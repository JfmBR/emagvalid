import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requisitosDaRegra } from '../emag/requisitos.js'
import type { Violacao } from './analisar.js'
import { SEM_REVISAO_AUTOMATICA } from './revisaoAutomatica.js'
import {
  LIMITE_PAGINA_GRANDE,
  MAX_OCORRENCIAS_POR_REGRA,
  MAX_TRECHO,
  MENSAGEM_ERRO,
  andamento,
  diagnostico,
  executarAvaliacao,
  falhasDaAnalise,
  recuperarInterrompidas,
} from './executar.js'

// O CI não tem banco: o db é um objeto em memória e o analisar é controlado pelo teste
const banco = vi.hoisted(() => ({
  avaliacao: null as { id: string; url: string; usuarioId: string } | null,
  atualizacoes: [] as Record<string, unknown>[],
  falhas: [] as Record<string, unknown>[],
  etapaNaGravacao: undefined as number | undefined,
  filtros: [] as unknown[],
  // linhas que cada updateMany encontra; 0 simula status que outra instância já mudou
  contagens: [] as number[],
}))

vi.mock('../db.js', () => {
  const db = {
    avaliacao: {
      findUnique: async () => banco.avaliacao,
      updateMany: async ({ where, data }: { where: unknown; data: Record<string, unknown> }) => {
        banco.filtros.push(where)
        banco.atualizacoes.push(data)
        return { count: banco.contagens.shift() ?? 1 }
      },
    },
    falha: {
      createMany: async ({ data }: { data: Record<string, unknown>[] }) => {
        banco.falhas.push(...data)
      },
    },
    $transaction: async (gravar: (tx: unknown) => Promise<unknown>) => {
      // quando a transação roda, a etapa do andamento já deve ser a 3
      banco.etapaNaGravacao = [...andamento.values()][0]?.etapa
      return gravar(db)
    },
  }
  return { db }
})

const analisar = vi.hoisted(() => vi.fn<typeof import('./analisar.js').analisar>())
vi.mock('./analisar.js', async () => ({
  ...(await vi.importActual<typeof import('./analisar.js')>('./analisar.js')),
  analisar,
}))

const { ErroDeAnalise } = await import('./analisar.js')

const imagemSemAlt: Violacao = {
  regra: 'image-alt',
  impacto: 'critical',
  ajuda: 'Imagens devem ter texto alternativo',
  ocorrencias: [{ seletor: 'img', trecho: '<img src="a.png">' }],
}

// análise sem falha, sem regra aplicável e sem dúvida
const semNada = {
  violacoes: [],
  aplicaveis: [],
  duvidas: [],
  revisaoAutomatica: SEM_REVISAO_AUTOMATICA,
}

beforeEach(() => {
  analisar.mockReset()
  banco.avaliacao = { id: 'a1', url: 'https://exemplo.com.br/', usuarioId: 'u1' }
  banco.atualizacoes = []
  banco.falhas = []
  banco.etapaNaGravacao = undefined
  banco.filtros = []
  banco.contagens = []
  andamento.clear()
})

describe('falhasDaAnalise', () => {
  it('uma falha por requisito e ocorrência, com prioridade e revisão humana', () => {
    const requisitos = requisitosDaRegra('image-alt')
    const falhas = falhasDaAnalise([imagemSemAlt])

    expect(falhas).toHaveLength(requisitos.length)
    for (const requisito of requisitos) {
      expect(falhas).toContainEqual({
        requisitoEmag: requisito.numero,
        descricao: imagemSemAlt.ajuda,
        prioridade: requisito.prioridade,
        seletor: 'img',
        trecho: '<img src="a.png">',
        revisaoHumana: requisito.cobertura === 'parcial',
      })
    }
  })

  it('marca revisão humana quando a cobertura do requisito é parcial', () => {
    // link-name → 3.5, cobertura parcial
    const [falha] = falhasDaAnalise([{ ...imagemSemAlt, regra: 'link-name' }])
    expect(falha?.requisitoEmag).toBe('3.5')
    expect(falha?.revisaoHumana).toBe(true)
  })

  it('ignora regra sem requisito do eMAG', () => {
    expect(falhasDaAnalise([{ ...imagemSemAlt, regra: 'regra-inventada' }])).toEqual([])
  })

  it('no máximo 50 ocorrências por regra e trecho de até 1.000 caracteres', () => {
    const ocorrencias = Array.from({ length: 80 }, (_, i) => ({
      seletor: `img:nth-child(${i})`,
      trecho: 'x'.repeat(5_000),
    }))
    const falhas = falhasDaAnalise([{ ...imagemSemAlt, regra: 'color-contrast', ocorrencias }])

    expect(falhas).toHaveLength(
      MAX_OCORRENCIAS_POR_REGRA * requisitosDaRegra('color-contrast').length,
    )
    expect(falhas.every((f) => f.trecho.length === MAX_TRECHO)).toBe(true)
  })

  it('seletor de até 1.000 caracteres e sem caractere nulo, que o Postgres recusa', () => {
    // a página cria ids enormes por JavaScript, sem gastar rede (revisão final, 18/11/2026)
    const ocorrencias = [{ seletor: `#${'a'.repeat(100_000)}`, trecho: '<img\u0000 src="x">' }]
    const [falha] = falhasDaAnalise([{ ...imagemSemAlt, ocorrencias }])

    expect(falha?.seletor).toHaveLength(MAX_TRECHO)
    expect(falha?.trecho).toBe('<img src="x">')
  })
})

describe('executarAvaliacao', () => {
  it('conclui: grava falhas, urlFinal e CONCLUIDA; andamento passa por 1, 2 e 3', async () => {
    const etapas: (number | undefined)[] = []
    analisar.mockImplementation(async (_url, opcoes) => {
      etapas.push(andamento.get('a1')?.etapa)
      opcoes?.aoCarregar?.(10)
      etapas.push(andamento.get('a1')?.etapa)
      return {
        violacoes: [imagemSemAlt],
        aplicaveis: ['image-alt', 'document-title', 'html-has-lang'],
        // image-alt também falhou: 3.6 fica no cartão, não na dúvida
        duvidas: ['color-contrast', 'image-alt'],
        urlFinal: 'https://exemplo.com.br/inicio',
        revisaoAutomatica: {
          naoAplicaveis: ['1.6'],
          indicios: [{ numero: '1.9', total: 2, exemplos: [] }],
        },
      }
    })

    await executarAvaliacao('a1')

    expect(analisar.mock.calls[0]?.[0]).toBe('https://exemplo.com.br/')
    expect(etapas).toEqual([1, 2])
    expect(banco.etapaNaGravacao).toBe(3)
    expect(andamento.has('a1')).toBe(false)
    expect(banco.atualizacoes[0]).toEqual({ status: 'ANALISANDO' })
    expect(banco.atualizacoes[1]).toMatchObject({
      status: 'CONCLUIDA',
      urlFinal: 'https://exemplo.com.br/inicio',
      paginaGrande: false,
      // 3.1 e 3.3 média (2 + 2) aprovadas; 3.6 alta (3) reprovada: 100 × 4 ÷ 7
      requisitosAplicaveis: ['3.1', '3.3', '3.6'],
      requisitosEmDuvida: ['4.1'],
      requisitosNaoAplicaveis: ['1.6'],
      indicios: [{ numero: '1.9', total: 2, exemplos: [] }],
      nota: 57,
    })
    expect(banco.atualizacoes[1]?.concluidaEm).toBeInstanceOf(Date)
    expect(banco.falhas).toHaveLength(requisitosDaRegra('image-alt').length)
    expect(banco.falhas[0]).toMatchObject({ avaliacaoId: 'a1', seletor: 'img' })
  })

  it('página com mais de LIMITE_PAGINA_GRANDE elementos marca paginaGrande', async () => {
    analisar.mockImplementation(async (_url, opcoes) => {
      opcoes?.aoCarregar?.(LIMITE_PAGINA_GRANDE + 1)
      expect(andamento.get('a1')?.paginaGrande).toBe(true)
      return { ...semNada, urlFinal: 'https://exemplo.com.br/' }
    })

    await executarAvaliacao('a1')

    expect(banco.atualizacoes[1]).toMatchObject({ status: 'CONCLUIDA', paginaGrande: true })
  })

  it('página com exatamente LIMITE_PAGINA_GRANDE elementos não é grande', async () => {
    analisar.mockImplementation(async (_url, opcoes) => {
      opcoes?.aoCarregar?.(LIMITE_PAGINA_GRANDE)
      return { ...semNada, urlFinal: 'https://exemplo.com.br/' }
    })

    await executarAvaliacao('a1')

    expect(banco.atualizacoes[1]).toMatchObject({ paginaGrande: false })
  })

  it('erro conhecido grava ERRO com a mensagem do código', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    analisar.mockRejectedValue(new ErroDeAnalise('PEDE_LOGIN'))

    await executarAvaliacao('a1')

    expect(banco.atualizacoes[1]).toEqual({
      status: 'ERRO',
      mensagemErro: MENSAGEM_ERRO.PEDE_LOGIN,
    })
    expect(banco.falhas).toEqual([])
    expect(andamento.has('a1')).toBe(false)
    expect(log).toHaveBeenCalledWith('Análise com erro:', 'PEDE_LOGIN')
    log.mockRestore()
  })

  it('BLOQUEADO registra no log o id da conta e só o host, sem a URL completa', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    banco.avaliacao = {
      id: 'a1',
      url: 'http://169.254.169.254/latest/meta-data?token=segredo',
      usuarioId: 'u7',
    }
    analisar.mockRejectedValue(new ErroDeAnalise('BLOQUEADO', new Error('detalhe interno')))

    await executarAvaliacao('a1')

    expect(banco.atualizacoes[1]).toMatchObject({ mensagemErro: MENSAGEM_ERRO.BLOQUEADO })
    expect(log).toHaveBeenCalledWith('Análise com erro:', 'BLOQUEADO', 'u7', '169.254.169.254')
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/segredo|detalhe interno|meta-data/)
    log.mockRestore()
  })

  it('erro desconhecido grava a mensagem FALHOU, sem detalhe interno', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    analisar.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:5432'))

    await executarAvaliacao('a1')

    expect(banco.atualizacoes[1]).toEqual({ status: 'ERRO', mensagemErro: MENSAGEM_ERRO.FALHOU })
    expect(JSON.stringify(log.mock.calls)).not.toContain('10.0.0.5')
    log.mockRestore()
  })

  it('erro desconhecido loga só o nome e o code, nunca a mensagem nem a URL', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const erro = Object.assign(new Error('falha em postgres://u:senha@db.interno:5432/app'), {
      name: 'PrismaClientKnownRequestError',
      code: 'P2002',
    })
    analisar.mockRejectedValue(erro)

    await executarAvaliacao('a1')

    expect(log).toHaveBeenCalledWith(
      'Análise com erro:',
      'FALHOU',
      'PrismaClientKnownRequestError',
      'P2002',
    )
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/postgres|senha|db\.interno/)
    log.mockRestore()
  })

  it('erro desconhecido que não é Error loga o typeof', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    analisar.mockRejectedValue('texto solto com http://interno')

    await executarAvaliacao('a1')

    expect(log).toHaveBeenCalledWith('Análise com erro:', 'FALHOU', 'string')
    log.mockRestore()
  })

  it('cada gravação só vale com o status esperado', async () => {
    analisar.mockResolvedValue({ ...semNada, urlFinal: 'https://exemplo.com.br/' })
    await executarAvaliacao('a1')
    analisar.mockRejectedValue(new ErroDeAnalise('DEMOROU'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await executarAvaliacao('a1')

    expect(banco.filtros).toEqual([
      { id: 'a1', status: 'NA_FILA' },
      { id: 'a1', status: 'ANALISANDO' },
      { id: 'a1', status: 'NA_FILA' },
      { id: 'a1', status: { in: ['NA_FILA', 'ANALISANDO'] } },
    ])
    vi.mocked(console.error).mockRestore()
  })

  it('já não estava NA_FILA (dada como morta ou conta excluída): não analisa', async () => {
    banco.contagens = [0]

    await executarAvaliacao('a1')

    expect(analisar).not.toHaveBeenCalled()
    expect(banco.atualizacoes).toHaveLength(1)
    expect(andamento.has('a1')).toBe(false)
  })

  it('virou ERRO durante a análise: não grava CONCLUIDA nem as falhas', async () => {
    banco.contagens = [1, 0]
    analisar.mockResolvedValue({
      ...semNada,
      violacoes: [imagemSemAlt],
      urlFinal: 'https://exemplo.com.br/',
    })

    await executarAvaliacao('a1')

    expect(banco.falhas).toEqual([])
  })

  it('avaliação que sumiu: não faz nada', async () => {
    banco.avaliacao = null

    await executarAvaliacao('a1')

    expect(analisar).not.toHaveBeenCalled()
    expect(banco.atualizacoes).toEqual([])
  })
})

describe('diagnostico', () => {
  it('devolve nome e code; sem code, só o nome; nunca a message', () => {
    const comCode = Object.assign(new Error('host db.interno:5432'), { code: 'ECONNREFUSED' })
    expect(diagnostico(comCode)).toEqual(['Error', 'ECONNREFUSED'])
    expect(diagnostico(new TypeError('x'))).toEqual(['TypeError'])
    expect(diagnostico(null)).toEqual(['object'])
  })
})

describe('recuperarInterrompidas', () => {
  it('troca NA_FILA e ANALISANDO por ERRO INTERROMPIDA e devolve quantas', async () => {
    banco.contagens = [2]
    expect(await recuperarInterrompidas()).toBe(2)
    expect(banco.filtros).toEqual([{ status: { in: ['NA_FILA', 'ANALISANDO'] } }])
    expect(banco.atualizacoes).toEqual([
      { status: 'ERRO', mensagemErro: MENSAGEM_ERRO.INTERROMPIDA },
    ])
  })
})
