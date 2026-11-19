import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { andamento, fila } from '../analise/executar.js'
import { classificarEndereco, MSG_URL, type TipoEndereco } from '../analise/endereco.js'
import { criarApp } from '../app.js'
import { limiteAvaliacaoPorConta, limiteAvaliacaoPorIp } from '../auth/tentativas.js'

type AvaliacaoFalsa = {
  id: string
  usuarioId: string
  url: string
  urlFinal: string | null
  status: 'NA_FILA' | 'ANALISANDO' | 'CONCLUIDA' | 'ERRO'
  mensagemErro: string | null
  paginaGrande: boolean
  criadaEm: Date
  falhas: object[]
}
type Filtro = {
  usuarioId?: string
  id?: string
  status?: { in: string[] }
  criadaEm?: { gte: Date }
}

// O CI não tem banco: as rotas rodam de verdade, com um db em memória no lugar do Prisma
const banco = vi.hoisted(() => ({
  avaliacoes: [] as AvaliacaoFalsa[],
  // quando preenchida, o count espera por ela (simula um banco lento)
  espera: null as Promise<void> | null,
}))

vi.mock('../db.js', () => {
  const confere = (a: AvaliacaoFalsa, where: Filtro) =>
    (where.usuarioId === undefined || a.usuarioId === where.usuarioId) &&
    (where.id === undefined || a.id === where.id) &&
    (where.status === undefined || where.status.in.includes(a.status)) &&
    (where.criadaEm === undefined || a.criadaEm >= where.criadaEm.gte)
  return {
    db: {
      avaliacao: {
        create: async ({ data }: { data: { usuarioId: string; url: string } }) => {
          const avaliacao: AvaliacaoFalsa = {
            id: randomUUID(),
            ...data,
            urlFinal: null,
            status: 'NA_FILA',
            mensagemErro: null,
            paginaGrande: false,
            criadaEm: new Date(),
            falhas: [],
          }
          banco.avaliacoes.push(avaliacao)
          return { id: avaliacao.id }
        },
        count: async ({ where }: { where: Filtro }) => {
          await banco.espera
          return banco.avaliacoes.filter((a) => confere(a, where)).length
        },
        findMany: async ({ where }: { where: Filtro }) => {
          await banco.espera
          return banco.avaliacoes
            .filter((a) => confere(a, where))
            .map(({ id, criadaEm }) => ({ id, criadaEm }))
        },
        findFirst: async ({ where }: { where: Filtro }) =>
          banco.avaliacoes.find((a) => confere(a, where)) ?? null,
        updateMany: async ({ where, data }: { where: Filtro; data: Partial<AvaliacaoFalsa> }) => {
          const achadas = banco.avaliacoes.filter((a) => confere(a, where))
          for (const a of achadas) Object.assign(a, data)
          return { count: achadas.length }
        },
      },
    },
  }
})

vi.mock('../analise/executar.js', () => ({
  fila: {
    adicionar: vi.fn<(id: string) => void>(),
    posicao: vi.fn<(id: string) => number | null>(),
    tamanho: vi.fn<() => number>(),
  },
  andamento: new Map(),
  MENSAGEM_ERRO: { INTERROMPIDA: 'A análise foi interrompida porque o servidor reiniciou.' },
}))

vi.mock('../analise/endereco.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../analise/endereco.js')>()),
  classificarEndereco: vi.fn<(hostname: string) => Promise<TipoEndereco>>(),
}))

// o cabeçalho x-usuario faz o papel da sessão; sem ele, 401
vi.mock('../auth/sessao.js', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../auth/sessao.js')>()),
  exigirLogin: (
    req: { get: (nome: string) => string | undefined },
    res: {
      locals: Record<string, unknown>
      status: (codigo: number) => { json: (corpo: object) => void }
    },
    next: () => void,
  ) => {
    const id = req.get('x-usuario')
    if (!id) {
      res.status(401).json({ erro: 'Entre na sua conta para continuar.' })
      return
    }
    res.locals.usuario = { id, nome: 'Teste', email: `${id}@empresa.com.br` }
    next()
  },
}))

const MSG_PENDENTE = 'Você já tem uma análise em andamento. Espere ela terminar para começar outra.'
const MSG_LIMITE = 'Você chegou ao limite de 10 análises por hora. Tente de novo mais tarde.'

function pedir(usuario: string | null, url: unknown) {
  const pedido = request(criarApp()).post('/api/avaliacoes')
  if (usuario) pedido.set('x-usuario', usuario)
  return pedido.send({ url })
}

function semear(dados: Partial<AvaliacaoFalsa> = {}) {
  const avaliacao: AvaliacaoFalsa = {
    id: randomUUID(),
    usuarioId: 'u1',
    url: 'https://www.loja.com.br/',
    urlFinal: null,
    status: 'CONCLUIDA',
    mensagemErro: null,
    paginaGrande: false,
    criadaEm: new Date(),
    falhas: [],
    ...dados,
  }
  banco.avaliacoes.push(avaliacao)
  return avaliacao
}

beforeEach(() => {
  banco.avaliacoes = []
  banco.espera = null
  limiteAvaliacaoPorConta.zerar()
  limiteAvaliacaoPorIp.zerar()
  andamento.clear()
  vi.mocked(fila.adicionar).mockReset()
  vi.mocked(fila.posicao).mockReset().mockReturnValue(null)
  vi.mocked(fila.tamanho).mockReset().mockReturnValue(0)
  vi.mocked(classificarEndereco).mockReset().mockResolvedValue('publico')
})

describe('POST /api/avaliacoes', () => {
  it('sem login → 401', async () => {
    const resposta = await pedir(null, 'https://www.loja.com.br')

    expect(resposta.status).toBe(401)
    expect(banco.avaliacoes).toHaveLength(0)
  })

  it('URL inválida → 400 no campo url', async () => {
    const resposta = await pedir('u1', 'ftp://x')

    expect(resposta.status).toBe(400)
    expect(resposta.body).toEqual({
      erro: 'Confira os campos marcados.',
      campos: { url: MSG_URL.invalida },
    })
    expect(classificarEndereco).not.toHaveBeenCalled()
  })

  it('url que não é texto → 400 com a mensagem de campo vazio', async () => {
    const resposta = await pedir('u1', 123)

    expect(resposta.status).toBe(400)
    expect(resposta.body.campos.url).toBe(MSG_URL.vazia)
  })

  it('endereço interno → 400 e log só com a conta e o host', async () => {
    vi.mocked(classificarEndereco).mockResolvedValue('interno')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const resposta = await pedir('u1', 'https://alvo.exemplo/segredo?token=abc')

    expect(resposta.status).toBe(400)
    expect(resposta.body.campos.url).toBe(MSG_URL.interno)
    expect(banco.avaliacoes).toHaveLength(0)
    expect(fila.adicionar).not.toHaveBeenCalled()
    // decisão 13: conta e host no log, nunca a URL completa
    expect(log).toHaveBeenCalledExactlyOnceWith(
      'Endereço interno recusado: conta u1, host alvo.exemplo',
    )
    log.mockRestore()
  })

  it('endereço inexistente → 400, sem log de segurança', async () => {
    vi.mocked(classificarEndereco).mockResolvedValue('inexistente')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const resposta = await pedir('u1', 'https://nao-existe.exemplo')

    expect(resposta.status).toBe(400)
    expect(resposta.body.campos.url).toBe(MSG_URL.inexistente)
    expect(banco.avaliacoes).toHaveLength(0)
    expect(log).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('cria NA_FILA com a URL preparada, enfileira e responde 202', async () => {
    const resposta = await pedir('u1', 'www.loja.com.br')

    expect(resposta.status).toBe(202)
    expect(banco.avaliacoes).toHaveLength(1)
    const criada = banco.avaliacoes[0]!
    expect(resposta.body).toEqual({ avaliacao: { id: criada.id } })
    expect(criada).toMatchObject({
      usuarioId: 'u1',
      url: 'https://www.loja.com.br/',
      status: 'NA_FILA',
    })
    expect(classificarEndereco).toHaveBeenCalledWith('www.loja.com.br')
    expect(fila.adicionar).toHaveBeenCalledExactlyOnceWith(criada.id)
  })

  it('com análise pendente → 409', async () => {
    semear({ status: 'ANALISANDO' })

    const resposta = await pedir('u1', 'https://www.loja.com.br')

    expect(resposta.status).toBe(409)
    expect(resposta.body).toEqual({ erro: MSG_PENDENTE })
    expect(fila.adicionar).not.toHaveBeenCalled()
    expect(classificarEndereco).not.toHaveBeenCalled()
  })

  it('pendente criada há mais de 10 min não bloqueia (análise que morreu sem dono)', async () => {
    semear({ status: 'ANALISANDO', criadaEm: new Date(Date.now() - 11 * 60_000) })

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(202)
  })

  it('pendente criada há 9 min, fora da fila, ainda bloqueia', async () => {
    semear({ status: 'NA_FILA', criadaEm: new Date(Date.now() - 9 * 60_000) })

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(409)
  })

  it('fila com 10 análises de todas as contas → 503, sem criar', async () => {
    vi.mocked(fila.tamanho).mockReturnValue(10)

    const resposta = await pedir('u1', 'https://www.loja.com.br')

    expect(resposta.status).toBe(503)
    expect(resposta.body).toEqual({
      erro: 'Há muitas análises na fila agora. Tente de novo em alguns minutos.',
    })
    expect(banco.avaliacoes).toEqual([])
    expect(fila.adicionar).not.toHaveBeenCalled()
  })

  it('fila com 9 análises ainda aceita', async () => {
    vi.mocked(fila.tamanho).mockReturnValue(9)

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(202)
  })

  it('pendente com mais de 10 min que ainda está na fila continua bloqueando', async () => {
    const antiga = semear({ status: 'NA_FILA', criadaEm: new Date(Date.now() - 40 * 60_000) })
    vi.mocked(fila.posicao).mockImplementation((id) => (id === antiga.id ? 20 : null))

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(409)
  })

  it('pendente de outra conta não bloqueia', async () => {
    semear({ usuarioId: 'u2', status: 'NA_FILA' })

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(202)
  })

  it('dois pedidos ao mesmo tempo → um 202 e um 409, que só pode vir da trava em memória', async () => {
    // o primeiro pedido fica preso no count do banco; o 409 do segundo, então, não vem do banco
    let liberar!: () => void
    banco.espera = new Promise<void>((resolver) => (liberar = resolver))
    const app = criarApp()
    const enviar = () =>
      request(app).post('/api/avaliacoes').set('x-usuario', 'u1').send({ url: 'www.loja.com.br' })
    const primeiro = enviar().then((r) => r)
    const segundo = enviar().then((r) => r)
    const demora = new Promise<'demorou'>((resolver) => setTimeout(() => resolver('demorou'), 1000))

    const [rapido] = await Promise.all([Promise.race([primeiro, segundo, demora])])
    liberar()
    const respostas = await Promise.all([primeiro, segundo])

    expect(rapido).not.toBe('demorou')
    expect(respostas.map((r) => r.status).sort()).toEqual([202, 409])
    expect(banco.avaliacoes).toHaveLength(1)
  })

  it('11ª análise na mesma hora → 429, sem consultar o DNS', async () => {
    for (let i = 0; i < 10; i++) semear()

    const resposta = await pedir('u1', 'https://www.loja.com.br')

    expect(resposta.status).toBe(429)
    expect(resposta.body).toEqual({ erro: MSG_LIMITE })
    expect(fila.adicionar).not.toHaveBeenCalled()
    expect(classificarEndereco).not.toHaveBeenCalled()
  })

  it('31º pedido da mesma conta em 15 min → 429, mesmo com URL interna e sem consultar o DNS', async () => {
    vi.mocked(classificarEndereco).mockResolvedValue('inexistente')
    for (let i = 0; i < limiteAvaliacaoPorConta.maximo; i++) {
      expect((await pedir('u1', 'https://nao-existe.exemplo')).status).toBe(400)
    }
    vi.mocked(classificarEndereco).mockClear().mockResolvedValue('interno')

    const resposta = await pedir('u1', 'https://alvo.exemplo')

    expect(resposta.status).toBe(429)
    expect(resposta.body).toEqual({ erro: 'Muitas tentativas. Tente de novo em 15 minutos.' })
    expect(classificarEndereco).not.toHaveBeenCalled()
  })

  it('61º pedido do mesmo IP com contas diferentes → 429', async () => {
    vi.mocked(classificarEndereco).mockResolvedValue('inexistente')
    for (let i = 0; i < limiteAvaliacaoPorIp.maximo; i++) {
      expect((await pedir(`conta${i}`, 'https://nao-existe.exemplo')).status).toBe(400)
    }

    const resposta = await pedir('conta-nova', 'https://nao-existe.exemplo')

    expect(resposta.status).toBe(429)
    expect(resposta.body.erro).toMatch(/Tente de novo em 15 minutos/)
  })

  it('URL mal formada não gasta o limite', async () => {
    for (let i = 0; i < limiteAvaliacaoPorConta.maximo + 1; i++) await pedir('u1', 'ftp://x')

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(202)
  })

  it('análises de mais de 1 hora atrás e de outras contas não entram no limite', async () => {
    for (let i = 0; i < 10; i++) semear({ criadaEm: new Date(Date.now() - 61 * 60 * 1000) })
    for (let i = 0; i < 10; i++) semear({ usuarioId: 'u2' })

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(202)
  })
})

describe('GET /api/avaliacoes/:id', () => {
  function buscar(usuario: string | null, id: string) {
    const pedido = request(criarApp()).get(`/api/avaliacoes/${id}`)
    if (usuario) pedido.set('x-usuario', usuario)
    return pedido
  }

  it('sem login → 401', async () => {
    expect((await buscar(null, semear().id)).status).toBe(401)
  })

  it('avaliação de outra conta ou id que não é UUID → 404', async () => {
    const dela = semear({ usuarioId: 'u2' })

    for (const resposta of [await buscar('u1', dela.id), await buscar('u1', 'nao-e-uuid')]) {
      expect(resposta.status).toBe(404)
      expect(resposta.body).toEqual({ erro: 'Avaliação não encontrada.' })
    }
  })

  it('id em maiúsculas vale como o id em minúsculas (andamento e fila usam minúsculas)', async () => {
    const avaliacao = semear({ status: 'ANALISANDO' })
    andamento.set(avaliacao.id, { etapa: 3, paginaGrande: false })

    const resposta = await buscar('u1', avaliacao.id.toUpperCase())

    expect(resposta.status).toBe(200)
    expect(resposta.body.avaliacao).toMatchObject({ id: avaliacao.id, etapa: 3 })
  })

  it('na fila traz a posição, sem etapa', async () => {
    const avaliacao = semear({ status: 'NA_FILA' })
    vi.mocked(fila.posicao).mockReturnValue(2)

    const { body } = await buscar('u1', avaliacao.id)

    expect(body.avaliacao).toMatchObject({ status: 'NA_FILA', posicaoNaFila: 2, etapa: null })
    expect(body.avaliacao.falhas).toEqual([])
  })

  it('em andamento traz etapa e paginaGrande do andamento, sem posição', async () => {
    const avaliacao = semear({ status: 'ANALISANDO' })
    andamento.set(avaliacao.id, { etapa: 2, paginaGrande: true })
    vi.mocked(fila.posicao).mockReturnValue(0)

    const { body } = await buscar('u1', avaliacao.id)

    expect(body.avaliacao).toEqual({
      id: avaliacao.id,
      url: 'https://www.loja.com.br/',
      urlFinal: null,
      status: 'ANALISANDO',
      etapa: 2,
      posicaoNaFila: null,
      paginaGrande: true,
      mensagemErro: null,
      falhas: [],
    })
  })

  it('concluída traz as falhas e o paginaGrande gravado, sem etapa nem posição', async () => {
    const falha = {
      requisitoEmag: '3.5',
      descricao: 'Imagem sem texto alternativo',
      prioridade: 'ALTA',
      seletor: 'img',
      trecho: '<img src="a.png">',
      revisaoHumana: false,
    }
    const avaliacao = semear({
      status: 'CONCLUIDA',
      urlFinal: 'https://www.loja.com.br/inicio',
      paginaGrande: true,
      falhas: [falha],
    })

    const { status, body } = await buscar('u1', avaliacao.id)

    expect(status).toBe(200)
    expect(body.avaliacao).toMatchObject({
      status: 'CONCLUIDA',
      urlFinal: 'https://www.loja.com.br/inicio',
      etapa: null,
      posicaoNaFila: null,
      paginaGrande: true,
      falhas: [falha],
    })
  })

  it('pendente fora da fila há mais de 10 min vira ERRO no banco e na resposta', async () => {
    const avaliacao = semear({ status: 'NA_FILA', criadaEm: new Date(Date.now() - 11 * 60_000) })

    const { body } = await buscar('u1', avaliacao.id)

    expect(body.avaliacao).toMatchObject({
      status: 'ERRO',
      mensagemErro: 'A análise foi interrompida porque o servidor reiniciou.',
      posicaoNaFila: null,
    })
    expect(banco.avaliacoes[0]).toMatchObject({ status: 'ERRO' })
  })

  it('pendente antiga que ainda está na fila, ou recente fora dela, segue pendente', async () => {
    const naFila = semear({ status: 'NA_FILA', criadaEm: new Date(Date.now() - 30 * 60_000) })
    const recente = semear({ status: 'ANALISANDO', criadaEm: new Date(Date.now() - 9 * 60_000) })
    vi.mocked(fila.posicao).mockImplementation((id) => (id === naFila.id ? 4 : null))

    expect((await buscar('u1', naFila.id)).body.avaliacao).toMatchObject({
      status: 'NA_FILA',
      posicaoNaFila: 4,
    })
    expect((await buscar('u1', recente.id)).body.avaliacao.status).toBe('ANALISANDO')
    expect(banco.avaliacoes.map((a) => a.status)).toEqual(['NA_FILA', 'ANALISANDO'])
  })

  it('com erro traz a mensagem e nenhuma falha', async () => {
    const avaliacao = semear({ status: 'ERRO', mensagemErro: 'A página demorou demais.' })

    const { body } = await buscar('u1', avaliacao.id)

    expect(body.avaliacao).toMatchObject({
      status: 'ERRO',
      mensagemErro: 'A página demorou demais.',
      falhas: [],
    })
  })
})
