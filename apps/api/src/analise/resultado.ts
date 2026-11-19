import { PESO, requisitos, type Prioridade, type Requisito } from '../emag/requisitos.js'

// O que a Tela 5 mostra de uma avaliação concluída (RF04, RF05, RF06, RF09)

type FalhaGravada = {
  requisitoEmag: string
  descricao: string
  seletor: string
  trecho: string | null
  revisaoHumana: boolean
}

type AvaliacaoConcluida = {
  nota: number | null
  requisitosAplicaveis: string[]
  requisitosEmDuvida: string[]
  revisados: string[]
  falhas: FalhaGravada[]
}

// O select do Prisma com o que resultadoDaAvaliacao lê: a Tela 5 e o PDF mostram a mesma coisa
export const CAMPOS_DO_RESULTADO = {
  nota: true,
  requisitosAplicaveis: true,
  requisitosEmDuvida: true,
  revisados: true,
  falhas: {
    select: {
      requisitoEmag: true,
      descricao: true,
      prioridade: true,
      seletor: true,
      trecho: true,
      revisaoHumana: true,
    },
  },
} as const

const ORDEM: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 }
const posicao = (numero: string) => requisitos.findIndex((r) => r.numero === numero)
const porNumero = (numero: string) => requisitos.find((r) => r.numero === numero)

const CONFERIR_DUVIDA =
  'O axe-core não conseguiu decidir se esta página cumpre a recomendação. Confira à mão.'

// As 16 que a máquina não verifica, sempre, mais as que o axe deixou em dúvida nesta página, na ordem do eMAG
export function itensDeRevisao(emDuvida: string[]): Requisito[] {
  return requisitos.filter((r) => r.cobertura === 'nao' || emDuvida.includes(r.numero))
}

export function resultadoDaAvaliacao(avaliacao: AvaliacaoConcluida) {
  const reprovados = new Set(avaliacao.falhas.map((f) => f.requisitoEmag))

  // shortcut: prioridade e peso vêm da lista atual, não da gravada; se um peso mudar, a conta das avaliações velhas deixa de fechar com a nota gravada. Gravar os pesos junto se isso acontecer
  const verificacoes = avaliacao.requisitosAplicaveis.flatMap((numero) => {
    const r = porNumero(numero)
    if (!r?.prioridade) return []
    const { nome, prioridade } = r
    return [{ numero, nome, prioridade, peso: PESO[prioridade], aprovada: !reprovados.has(numero) }]
  })

  const cartoes = [...reprovados]
    .flatMap((numero) => {
      const r = porNumero(numero)
      if (!r?.prioridade) return []
      const falhas = avaliacao.falhas.filter((f) => f.requisitoEmag === numero)
      return [
        {
          numero,
          nome: r.nome,
          link: r.link,
          prioridade: r.prioridade,
          porque: r.porque ?? null,
          exemplo: r.exemplo ?? null,
          revisaoHumana: falhas.some((f) => f.revisaoHumana),
          ocorrencias: falhas.map(({ descricao, seletor, trecho }) => ({
            descricao,
            seletor,
            trecho,
          })),
        },
      ]
    })
    .sort(
      (a, b) => ORDEM[a.prioridade] - ORDEM[b.prioridade] || posicao(a.numero) - posicao(b.numero),
    )

  const revisao = itensDeRevisao(avaliacao.requisitosEmDuvida).map((r) => ({
    numero: r.numero,
    nome: r.nome,
    link: r.link,
    motivo: r.cobertura === 'nao' ? ('fixa' as const) : ('duvida' as const),
    conferir: r.cobertura === 'nao' ? (r.conferir ?? null) : CONFERIR_DUVIDA,
    feita: avaliacao.revisados.includes(r.numero),
  }))

  return { nota: avaliacao.nota, verificacoes, cartoes, revisao }
}
