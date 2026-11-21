import { randomUUID } from 'node:crypto'
import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { andamento, fila } from '../analise/executar.js'
import { classificarEndereco, MSG_URL, type TipoEndereco } from '../analise/endereco.js'
import { criarApp } from '../app.js'
import {
  limiteAvaliacaoPorConta,
  limiteAvaliacaoPorIp,
  limitePdfPorConta,
  limitePdfPorIp,
} from '../auth/tentativas.js'
import { GeradorOcupado, gerarPdf } from '../relatorio/pdf.js'

type AvaliacaoFalsa = {
  id: string
  usuarioId: string
  url: string
  urlFinal: string | null
  status: 'NA_FILA' | 'ANALISANDO' | 'CONCLUIDA' | 'ERRO'
  mensagemErro: string | null
  paginaGrande: boolean
  criadaEm: Date
  concluidaEm: Date | null
  nota: number | null
  requisitosAplicaveis: string[]
  requisitosEmDuvida: string[]
  revisados: string[]
  requisitosNaoAplicaveis: string[]
  indicios: unknown
  falhas: object[]
}
type Filtro = {
  usuarioId?: string
  id?: string | { lt: string }
  status?: { in: string[] }
  criadaEm?: Date | { gte?: Date; lt?: Date }
  OR?: Filtro[]
}

// O CI não tem banco: as rotas rodam de verdade, com um db em memória no lugar do Prisma
const banco = vi.hoisted(() => ({
  avaliacoes: [] as AvaliacaoFalsa[],
  // quando preenchida, o count espera por ela (simula um banco lento)
  espera: null as Promise<void> | null,
}))

vi.mock('../db.js', () => {
  const confereData = (data: Date, filtro: NonNullable<Filtro['criadaEm']>) =>
    filtro instanceof Date
      ? data.getTime() === filtro.getTime()
      : (filtro.gte === undefined || data >= filtro.gte) &&
        (filtro.lt === undefined || data < filtro.lt)
  const confere = (a: AvaliacaoFalsa, where: Filtro): boolean =>
    (where.usuarioId === undefined || a.usuarioId === where.usuarioId) &&
    (where.id === undefined ||
      (typeof where.id === 'string' ? a.id === where.id : a.id < where.id.lt)) &&
    (where.status === undefined || where.status.in.includes(a.status)) &&
    (where.criadaEm === undefined || confereData(a.criadaEm, where.criadaEm)) &&
    (where.OR === undefined || where.OR.some((ou) => confere(a, ou)))
  // da mais nova para a mais antiga; empate na data, pelo id (como o orderBy da rota)
  const ordem = (x: AvaliacaoFalsa, y: AvaliacaoFalsa) =>
    y.criadaEm.getTime() - x.criadaEm.getTime() || (y.id > x.id ? 1 : y.id < x.id ? -1 : 0)
  return {
    db: {
      // as operações já começaram; a transação só espera todas
      $transaction: async (operacoes: Promise<unknown>[]) => Promise.all(operacoes),
      avaliacao: {
        create: async ({ data }: { data: { usuarioId: string; url: string; criadaEm?: Date } }) => {
          const avaliacao: AvaliacaoFalsa = {
            id: randomUUID(),
            ...data,
            urlFinal: null,
            status: 'NA_FILA',
            mensagemErro: null,
            paginaGrande: false,
            criadaEm: data.criadaEm ?? new Date(),
            concluidaEm: null,
            nota: null,
            requisitosAplicaveis: [],
            requisitosEmDuvida: [],
            revisados: [],
            requisitosNaoAplicaveis: [],
            indicios: [],
            falhas: [],
          }
          banco.avaliacoes.push(avaliacao)
          return { id: avaliacao.id }
        },
        count: async ({ where }: { where: Filtro }) => {
          await banco.espera
          return banco.avaliacoes.filter((a) => confere(a, where)).length
        },
        // o select não é aplicado: devolve a linha inteira (os testes conferem com toMatchObject)
        findMany: async ({ where, take }: { where: Filtro; take?: number }) => {
          await banco.espera
          return banco.avaliacoes
            .filter((a) => confere(a, where))
            .sort(ordem)
            .slice(0, take)
        },
        findFirst: async ({ where }: { where: Filtro }) =>
          banco.avaliacoes.find((a) => confere(a, where)) ?? null,
        updateMany: async ({ where, data }: { where: Filtro; data: Partial<AvaliacaoFalsa> }) => {
          const achadas = banco.avaliacoes.filter((a) => confere(a, where))
          for (const a of achadas) Object.assign(a, data)
          return { count: achadas.length }
        },
      },
      // só o UPDATE da revisão usa SQL; os valores chegam na ordem do comando
      $executeRaw: async (_sql: TemplateStringsArray, ...valores: unknown[]) => {
        const [feita, numero] = valores as [boolean, string]
        const [id, usuarioId] = valores.slice(-2) as [string, string]
        const achadas = banco.avaliacoes.filter((a) => confere(a, { id, usuarioId }))
        for (const a of achadas) {
          a.revisados = a.revisados.filter((n) => n !== numero)
          if (feita) a.revisados.push(numero)
        }
        return achadas.length
      },
    },
  }
})

vi.mock('../analise/executar.js', async (importOriginal) => ({
  // as mensagens reais, para o teste conferir o texto que a pessoa vê
  MENSAGEM_ERRO: (await importOriginal<typeof import('../analise/executar.js')>()).MENSAGEM_ERRO,
  fila: {
    adicionar: vi.fn<(id: string) => void>(),
    posicao: vi.fn<(id: string) => number | null>(),
    tamanho: vi.fn<() => number>(),
  },
  andamento: new Map(),
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

// o Chromium do PDF tem teste próprio (relatorio/pdf.test.ts); aqui só a rota
vi.mock('../relatorio/pdf.js', async (importOriginal) => ({
  GeradorOcupado: (await importOriginal<typeof import('../relatorio/pdf.js')>()).GeradorOcupado,
  gerarPdf: vi.fn<(html: string, rodape: string) => Promise<Buffer>>(),
}))

const MSG_ENVIANDO = 'Seu envio anterior ainda está sendo processado. Espere um instante.'
const MSG_LIMITE = 'Você chegou ao limite de 10 análises por hora. Tente de novo mais tarde.'

// uma lista de links (RF20); `pedir` é o atalho para um link só
function pedirLista(usuario: string | null, urls: unknown[]) {
  const pedido = request(criarApp()).post('/api/avaliacoes')
  if (usuario) pedido.set('x-usuario', usuario)
  return pedido.send({ urls })
}
const pedir = (usuario: string | null, url: unknown) => pedirLista(usuario, [url])

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
    concluidaEm: null,
    nota: null,
    requisitosAplicaveis: [],
    requisitosEmDuvida: [],
    revisados: [],
    requisitosNaoAplicaveis: [],
    indicios: [],
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
  limitePdfPorConta.zerar()
  limitePdfPorIp.zerar()
  vi.mocked(gerarPdf).mockReset().mockResolvedValue(Buffer.from('%PDF-1.7 falso'))
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
      campos: { 'urls.0': MSG_URL.invalida },
    })
    expect(classificarEndereco).not.toHaveBeenCalled()
  })

  it('url que não é texto → 400 com a mensagem de campo vazio', async () => {
    const resposta = await pedir('u1', 123)

    expect(resposta.status).toBe(400)
    expect(resposta.body.campos['urls.0']).toBe(MSG_URL.vazia)
  })

  it('endereço interno → 400 e log só com a conta e o host', async () => {
    vi.mocked(classificarEndereco).mockResolvedValue('interno')
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const resposta = await pedir('u1', 'https://alvo.exemplo/segredo?token=abc')

    expect(resposta.status).toBe(400)
    expect(resposta.body.campos['urls.0']).toBe(MSG_URL.interno)
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
    expect(resposta.body.campos['urls.0']).toBe(MSG_URL.inexistente)
    expect(banco.avaliacoes).toHaveLength(0)
    expect(log).not.toHaveBeenCalled()
    log.mockRestore()
  })

  it('cria NA_FILA com a URL preparada, enfileira e responde 202', async () => {
    const resposta = await pedir('u1', 'www.loja.com.br')

    expect(resposta.status).toBe(202)
    expect(banco.avaliacoes).toHaveLength(1)
    const criada = banco.avaliacoes[0]!
    expect(resposta.body).toEqual({ avaliacoes: [{ id: criada.id }] })
    expect(criada).toMatchObject({
      usuarioId: 'u1',
      url: 'https://www.loja.com.br/',
      status: 'NA_FILA',
    })
    expect(classificarEndereco).toHaveBeenCalledWith('www.loja.com.br')
    expect(fila.adicionar).toHaveBeenCalledExactlyOnceWith(criada.id)
  })

  it('com análise pendente, aceita outra (a regra de uma por conta saiu em 19/11)', async () => {
    semear({ status: 'ANALISANDO' })
    semear({ status: 'NA_FILA' })

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(202)
  })

  it('fila com 30 análises de todas as contas → 503, sem criar', async () => {
    vi.mocked(fila.tamanho).mockReturnValue(30)

    const resposta = await pedir('u1', 'https://www.loja.com.br')

    expect(resposta.status).toBe(503)
    expect(resposta.body).toEqual({
      erro: 'Há muitas análises na fila agora. Tente de novo em alguns minutos.',
    })
    expect(banco.avaliacoes).toEqual([])
    expect(fila.adicionar).not.toHaveBeenCalled()
    expect(classificarEndereco).not.toHaveBeenCalled()
  })

  it('fila com 29 análises ainda aceita um link', async () => {
    vi.mocked(fila.tamanho).mockReturnValue(29)

    expect((await pedir('u1', 'https://www.loja.com.br')).status).toBe(202)
  })

  it('dois pedidos ao mesmo tempo → um 202 e um 409, que só pode vir da trava em memória', async () => {
    // o primeiro pedido fica preso no count do banco; o 409 do segundo, então, não vem do banco
    let liberar!: () => void
    banco.espera = new Promise<void>((resolver) => (liberar = resolver))
    const app = criarApp()
    const enviar = () =>
      request(app)
        .post('/api/avaliacoes')
        .set('x-usuario', 'u1')
        .send({ urls: ['www.loja.com.br'] })
    const primeiro = enviar().then((r) => r)
    const segundo = enviar().then((r) => r)
    const demora = new Promise<'demorou'>((resolver) => setTimeout(() => resolver('demorou'), 1000))

    const [rapido] = await Promise.all([Promise.race([primeiro, segundo, demora])])
    liberar()
    const respostas = await Promise.all([primeiro, segundo])

    expect(rapido).not.toBe('demorou')
    expect(respostas.map((r) => r.status).sort()).toEqual([202, 409])
    expect(respostas.find((r) => r.status === 409)?.body).toEqual({ erro: MSG_ENVIANDO })
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

  describe('lista de links (RF20)', () => {
    const links = (n: number) => Array.from({ length: n }, (_, i) => `https://loja.com.br/p${i}`)

    it('3 links → 3 avaliações na ordem da lista, enfileiradas na mesma ordem', async () => {
      const resposta = await pedirLista('u1', links(3))

      expect(resposta.status).toBe(202)
      expect(banco.avaliacoes.map((a) => a.url)).toEqual([
        'https://loja.com.br/p0',
        'https://loja.com.br/p1',
        'https://loja.com.br/p2',
      ])
      const ids = banco.avaliacoes.map((a) => a.id)
      expect(resposta.body).toEqual({ avaliacoes: ids.map((id) => ({ id })) })
      expect(vi.mocked(fila.adicionar).mock.calls.map(([id]) => id)).toEqual(ids)
      // o histórico (mais nova em cima) mostra o envio na ordem da lista: o 1º link é o "mais novo"
      const datas = banco.avaliacoes.map((a) => a.criadaEm.getTime())
      expect(datas).toEqual([...datas].sort((x, y) => y - x))
      expect(new Set(datas).size).toBe(3)
    })

    it('10 links passam; 11 ou nenhum → 400, sem criar', async () => {
      expect((await pedirLista('u1', links(10))).status).toBe(202)
      banco.avaliacoes = []

      for (const lista of [links(11), []]) {
        const resposta = await pedirLista('u2', lista)
        expect(resposta.status).toBe(400)
        expect(resposta.body).toEqual({ erro: 'Informe de 1 a 10 endereços.' })
      }
      expect(banco.avaliacoes).toEqual([])
    })

    it('o erro aparece no campo do link certo, e nada é criado', async () => {
      vi.mocked(classificarEndereco).mockImplementation(async (host) =>
        host === 'interno.exemplo' ? 'interno' : 'publico',
      )
      vi.spyOn(console, 'error').mockImplementation(() => {})

      const resposta = await pedirLista('u1', [
        'https://loja.com.br/a',
        'ftp://x',
        'https://interno.exemplo/',
      ])

      expect(resposta.status).toBe(400)
      expect(resposta.body.campos).toEqual({ 'urls.1': MSG_URL.invalida })
      // o DNS só roda quando todos estão bem formados
      expect(classificarEndereco).not.toHaveBeenCalled()

      const segunda = await pedirLista('u1', ['https://loja.com.br/a', 'https://interno.exemplo/'])
      expect(segunda.body.campos).toEqual({ 'urls.1': MSG_URL.interno })
      expect(banco.avaliacoes).toEqual([])
      vi.mocked(console.error).mockRestore()
    })

    it('link repetido na lista → erro no campo da repetição', async () => {
      const resposta = await pedirLista('u1', ['loja.com.br', 'https://loja.com.br/'])

      expect(resposta.status).toBe(400)
      expect(resposta.body.campos).toEqual({ 'urls.1': 'Este endereço já está na lista.' })
    })

    it('lista maior que o que sobra na hora → 429 com quantas cabem, sem criar nem consultar o DNS', async () => {
      for (let i = 0; i < 8; i++) semear()

      const resposta = await pedirLista('u1', links(3))

      expect(resposta.status).toBe(429)
      expect(resposta.body).toEqual({
        erro: 'Você pode avaliar mais 2 páginas nesta hora. Tire alguns endereços e envie de novo.',
      })
      expect(banco.avaliacoes).toHaveLength(8)
      expect(classificarEndereco).not.toHaveBeenCalled()
      expect((await pedirLista('u1', links(2))).status).toBe(202)
    })

    it('lista que não cabe na fila geral → 503, sem criar', async () => {
      vi.mocked(fila.tamanho).mockReturnValue(28)

      expect((await pedirLista('u1', links(3))).status).toBe(503)
      expect(banco.avaliacoes).toEqual([])
      expect((await pedirLista('u1', links(2))).status).toBe(202)
    })

    it('cada link conta no limite de pedidos: 3 listas de 10 gastam os 30 da conta', async () => {
      vi.mocked(classificarEndereco).mockResolvedValue('inexistente')
      for (let i = 0; i < 3; i++) expect((await pedirLista('u1', links(10))).status).toBe(400)

      const resposta = await pedir('u1', 'https://loja.com.br/outra')

      expect(resposta.status).toBe(429)
      expect(resposta.body).toEqual({ erro: 'Muitas tentativas. Tente de novo em 15 minutos.' })
    })

    it('a lista só passa se couberem todos os links nas tentativas que sobram', async () => {
      vi.mocked(classificarEndereco).mockResolvedValue('inexistente')
      for (let i = 0; i < 29; i++) await pedir('u1', `https://loja.com.br/x${i}`)

      const resposta = await pedirLista('u1', links(10))

      expect(resposta.status).toBe(429)
      // não chegou a sondar nenhum dos 10
      expect(classificarEndereco).toHaveBeenCalledTimes(29)
      expect((await pedir('u1', 'https://loja.com.br/ultima')).status).toBe(400)
    })

    it('recusa barata (limite por hora) devolve as tentativas: não trava a conta', async () => {
      for (let i = 0; i < 8; i++) semear()
      // 5 listas de 10 recusadas pela hora gastariam 50 tentativas, se contassem
      for (let i = 0; i < 5; i++) expect((await pedirLista('u1', links(10))).status).toBe(429)

      expect((await pedirLista('u1', links(2))).status).toBe(202)
    })
  })
})

describe('GET /api/avaliacoes (histórico)', () => {
  function listar(usuario: string | null, antes?: string) {
    const pedido = request(criarApp())
      .get('/api/avaliacoes')
      .query(antes ? { antes } : {})
    if (usuario) pedido.set('x-usuario', usuario)
    return pedido
  }
  const minutosAtras = (n: number) => new Date(Date.now() - n * 60_000)

  it('sem login → 401', async () => {
    expect((await listar(null)).status).toBe(401)
  })

  it('só as da conta, da mais nova para a mais antiga, com o andamento', async () => {
    const velha = semear({ criadaEm: minutosAtras(30), nota: 76 })
    const nova = semear({ status: 'NA_FILA', criadaEm: minutosAtras(1) })
    semear({ usuarioId: 'u2' })
    vi.mocked(fila.posicao).mockImplementation((id) => (id === nova.id ? 2 : null))

    const { status, body } = await listar('u1')

    expect(status).toBe(200)
    expect(body.avaliacoes).toHaveLength(2)
    expect(body.avaliacoes[0]).toMatchObject({ id: nova.id, status: 'NA_FILA', posicaoNaFila: 2 })
    expect(body.avaliacoes[1]).toMatchObject({ id: velha.id, status: 'CONCLUIDA', nota: 76 })
    expect(body.proximo).toBeNull()
  })

  it('20 por vez; o cursor traz as seguintes sem pular nem repetir, mesmo com datas iguais', async () => {
    const mesmaData = minutosAtras(5)
    // 25 avaliações; 6 delas com a mesma data, bem na virada da página
    for (let i = 0; i < 25; i++) semear({ criadaEm: i < 6 ? mesmaData : minutosAtras(100 + i) })

    const primeira = (await listar('u1')).body
    expect(primeira.avaliacoes).toHaveLength(20)
    expect(primeira.proximo).toEqual(expect.any(String))

    const segunda = (await listar('u1', primeira.proximo)).body
    expect(segunda.avaliacoes).toHaveLength(5)
    expect(segunda.proximo).toBeNull()

    const ids = [...primeira.avaliacoes, ...segunda.avaliacoes].map((a: { id: string }) => a.id)
    expect(new Set(ids).size).toBe(25)
  })

  it('cursor inválido → 400', async () => {
    expect((await listar('u1', 'nao-e-cursor')).status).toBe(400)
  })

  it('pendente morta vira ERRO também no histórico', async () => {
    semear({ status: 'ANALISANDO', criadaEm: minutosAtras(11) })

    const { body } = await listar('u1')

    expect(body.avaliacoes[0]).toMatchObject({
      status: 'ERRO',
      mensagemErro: 'A análise foi interrompida do nosso lado. Tente de novo.',
    })
    expect(banco.avaliacoes[0]?.status).toBe('ERRO')
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
    expect(body.avaliacao.resultado).toBeNull()
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
      concluidaEm: null,
      resultado: null,
    })
  })

  it('concluída traz a nota, as verificações, os cartões e a revisão, sem etapa nem posição', async () => {
    const falha = {
      requisitoEmag: '3.6',
      descricao: 'Imagens devem ter texto alternativo',
      prioridade: 'alta',
      seletor: 'img',
      trecho: '<img src="a.png">',
      revisaoHumana: false,
    }
    const avaliacao = semear({
      status: 'CONCLUIDA',
      urlFinal: 'https://www.loja.com.br/inicio',
      paginaGrande: true,
      nota: 57,
      requisitosAplicaveis: ['3.1', '3.3', '3.6'],
      requisitosEmDuvida: ['4.1'],
      revisados: ['4.1'],
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
    })
    const { resultado } = body.avaliacao
    expect(resultado.nota).toBe(57)
    expect(resultado.verificacoes).toHaveLength(3)
    expect(resultado.cartoes).toEqual([
      expect.objectContaining({
        numero: '3.6',
        ocorrencias: [{ descricao: falha.descricao, seletor: 'img', trecho: '<img src="a.png">' }],
      }),
    ])
    expect(resultado.revisao).toHaveLength(17)
    expect(resultado.revisao.find((r: { numero: string }) => r.numero === '4.1')).toMatchObject({
      motivo: 'duvida',
      feita: true,
    })
  })

  it('pendente fora da fila há mais de 10 min vira ERRO no banco e na resposta', async () => {
    const avaliacao = semear({ status: 'NA_FILA', criadaEm: new Date(Date.now() - 11 * 60_000) })

    const { body } = await buscar('u1', avaliacao.id)

    expect(body.avaliacao).toMatchObject({
      status: 'ERRO',
      mensagemErro: 'A análise foi interrompida do nosso lado. Tente de novo.',
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
      resultado: null,
    })
  })
})

describe('POST /api/avaliacoes/:id/revisao', () => {
  function marcar(usuario: string | null, id: string, dados: unknown) {
    const pedido = request(criarApp()).post(`/api/avaliacoes/${id}/revisao`)
    if (usuario) pedido.set('x-usuario', usuario)
    return pedido.send(dados as object)
  }

  it('sem login → 401', async () => {
    expect((await marcar(null, semear().id, { numero: '4.4', feita: true })).status).toBe(401)
  })

  it('marca e desmarca, sem repetir o número', async () => {
    const avaliacao = semear({ revisados: ['1.1'] })

    expect((await marcar('u1', avaliacao.id, { numero: '4.4', feita: true })).status).toBe(204)
    await marcar('u1', avaliacao.id, { numero: '4.4', feita: true })
    expect(banco.avaliacoes[0]?.revisados).toEqual(['1.1', '4.4'])

    await marcar('u1', avaliacao.id, { numero: '1.1', feita: false })
    expect(banco.avaliacoes[0]?.revisados).toEqual(['4.4'])
  })

  it('aceita o item em dúvida daquela avaliação', async () => {
    const avaliacao = semear({ requisitosEmDuvida: ['4.1'] })

    expect((await marcar('u1', avaliacao.id, { numero: '4.1', feita: true })).status).toBe(204)
  })

  it('avaliação de outra conta ou id que não é UUID → 404, sem gravar', async () => {
    const dela = semear({ usuarioId: 'u2' })

    expect((await marcar('u1', dela.id, { numero: '4.4', feita: true })).status).toBe(404)
    expect((await marcar('u1', 'nao-e-uuid', { numero: '4.4', feita: true })).status).toBe(404)
    expect(dela.revisados).toEqual([])
  })

  it('número fora da lista de revisão ou corpo inválido → 400', async () => {
    const avaliacao = semear()

    for (const dados of [
      { numero: '3.6', feita: true }, // entra na nota, não na revisão
      { numero: '4.1', feita: true }, // não ficou em dúvida nesta avaliação
      { numero: '4.4', feita: 'sim' },
      { numero: 44, feita: true },
      {},
    ]) {
      expect((await marcar('u1', avaliacao.id, dados)).status).toBe(400)
    }
    expect(avaliacao.revisados).toEqual([])
  })

  it('análise que não terminou → 409', async () => {
    const avaliacao = semear({ status: 'ANALISANDO' })

    expect((await marcar('u1', avaliacao.id, { numero: '4.4', feita: true })).status).toBe(409)
  })
})

describe('GET /api/avaliacoes/:id/pdf', () => {
  function baixar(usuario: string | null, id: string) {
    const pedido = request(criarApp()).get(`/api/avaliacoes/${id}/pdf`)
    if (usuario) pedido.set('x-usuario', usuario)
    return pedido
  }
  const concluida = (dados: Partial<AvaliacaoFalsa> = {}) =>
    semear({
      status: 'CONCLUIDA',
      url: 'https://www.loja.com.br/',
      urlFinal: 'https://www.loja.com.br/inicio',
      concluidaEm: new Date('2026-11-20T01:30:00Z'),
      nota: 100,
      requisitosAplicaveis: ['3.1'],
      ...dados,
    })

  it('sem login → 401', async () => {
    expect((await baixar(null, concluida().id)).status).toBe(401)
  })

  it('avaliação de outra conta, inexistente ou id que não é UUID → 404', async () => {
    const outra = concluida({ usuarioId: 'u2' })

    for (const id of [outra.id, randomUUID(), 'nao-e-uuid']) {
      const { status, body } = await baixar('u1', id)
      expect(status).toBe(404)
      expect(body.erro).toBe('Avaliação não encontrada.')
    }
    expect(gerarPdf).not.toHaveBeenCalled()
  })

  it('avaliação pendente ou com erro → 409', async () => {
    for (const status of ['NA_FILA', 'ANALISANDO', 'ERRO'] as const) {
      const resposta = await baixar('u1', semear({ status }).id)
      expect(resposta.status).toBe(409)
      expect(resposta.body.erro).toBe('Esta avaliação não tem resultado para gerar o relatório.')
    }
    expect(gerarPdf).not.toHaveBeenCalled()
  })

  it('200 com o PDF, o nome do arquivo pelo urlFinal e pela data de Brasília, sem cache', async () => {
    const resposta = await baixar('u1', concluida().id)

    expect(resposta.status).toBe(200)
    expect(resposta.headers['content-type']).toBe('application/pdf')
    expect(resposta.headers['content-disposition']).toBe(
      'attachment; filename="acessaweb-www.loja.com.br-2026-11-19.pdf"',
    )
    expect(resposta.headers['cache-control']).toBe('no-store')
    expect(Buffer.from(resposta.body).subarray(0, 4).toString()).toBe('%PDF')
  })

  it('sem urlFinal usa url', async () => {
    const resposta = await baixar(
      'u1',
      concluida({ url: 'https://padaria.com.br/x', urlFinal: null }).id,
    )

    expect(resposta.headers['content-disposition']).toContain('acessaweb-padaria.com.br-')
  })

  it('o HTML enviado ao gerador traz o nome da conta e a página', async () => {
    await baixar('u1', concluida().id)

    const [html, rodape] = vi.mocked(gerarPdf).mock.calls[0]!
    expect(html).toContain('Preparado para: Teste')
    expect(html).toContain('https://www.loja.com.br/inicio')
    expect(rodape).toContain('pageNumber')
  })

  it('11º pedido da conta na mesma hora → 429', async () => {
    const id = concluida().id
    for (let i = 0; i < 10; i++) expect((await baixar('u1', id)).status).toBe(200)

    const { status, body } = await baixar('u1', id)
    expect(status).toBe(429)
    expect(body.erro).toBe(
      'Você chegou ao limite de 10 relatórios por hora. Tente de novo mais tarde.',
    )
  })

  it('21º pedido do mesmo IP com contas diferentes → 429', async () => {
    for (let i = 0; i < limitePdfPorIp.maximo; i++) {
      const conta = `conta${i}`
      expect((await baixar(conta, concluida({ usuarioId: conta }).id)).status).toBe(200)
    }

    const { status, body } = await baixar('conta-nova', concluida({ usuarioId: 'conta-nova' }).id)
    expect(status).toBe(429)
    expect(body.erro).toBe('Muitos relatórios pedidos desta rede. Tente de novo em 1 hora.')
    expect(gerarPdf).toHaveBeenCalledTimes(limitePdfPorIp.maximo)
  })

  it('outro PDF em geração → 503 com Retry-After, sem gastar o limite da conta nem o do IP', async () => {
    const id = concluida().id
    vi.mocked(gerarPdf).mockRejectedValue(new GeradorOcupado('ocupado'))
    for (let i = 0; i < limitePdfPorIp.maximo + 1; i++) {
      const { status, body, headers } = await baixar('u1', id)
      expect(status).toBe(503)
      expect(headers['retry-after']).toBe('5')
      expect(body.erro).toBe('Outro relatório está sendo gerado. Tente de novo em instantes.')
    }

    vi.mocked(gerarPdf).mockResolvedValue(Buffer.from('%PDF-1.7 falso'))
    expect((await baixar('u1', id)).status).toBe(200)
  })

  it('falha do gerador → 500 com mensagem genérica', async () => {
    vi.mocked(gerarPdf).mockRejectedValue(new Error('Chromium caiu: detalhe interno'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const { status, body } = await baixar('u1', concluida().id)

    expect(status).toBe(500)
    expect(body.erro).toBe('Não conseguimos gerar o relatório. Tente de novo em instantes.')
  })
})
