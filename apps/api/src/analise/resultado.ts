import { PESO, requisitos, type Prioridade, type Requisito } from '../emag/requisitos.js'
import { validarIndicios, validarNaoAplicaveis, type Indicio } from './revisaoAutomatica.js'

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
  requisitosNaoAplicaveis: string[]
  // coluna Json: validada na leitura
  indicios: unknown
  falhas: FalhaGravada[]
}

// O select do Prisma com o que resultadoDaAvaliacao lê: a Tela 5 e o PDF mostram a mesma coisa
export const CAMPOS_DO_RESULTADO = {
  nota: true,
  requisitosAplicaveis: true,
  requisitosEmDuvida: true,
  revisados: true,
  requisitosNaoAplicaveis: true,
  indicios: true,
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

const SEM_FORMULARIO = 'Não achamos formulário nem campo de preenchimento na página.'

// Motivo mostrado no grupo "provavelmente não se aplica"; o texto fica aqui e a coluna grava só o número
export const MOTIVO_NAO_SE_APLICA: Record<string, string> = {
  '1.6': 'Não achamos tabela (<table>) na página.',
  '3.8': 'Não achamos link para documento (PDF, DOC, ODT, planilha ou apresentação).',
  '5.2': 'Não achamos áudio na página (<audio>, link para arquivo de áudio ou player conhecido).',
  '5.3': 'Não achamos vídeo na página (<video>, YouTube, Vimeo ou link para arquivo de vídeo).',
  '6.4': SEM_FORMULARIO,
  '6.5': SEM_FORMULARIO,
  '6.6': SEM_FORMULARIO,
  '6.7': SEM_FORMULARIO,
  '6.8': SEM_FORMULARIO,
}

export function textoDoIndicio({ numero, total }: Indicio): string {
  if (numero === '1.9') {
    return total === 1
      ? '1 link abre em nova aba ou janela sem aviso no texto.'
      : `${total} links abrem em nova aba ou janela sem aviso no texto.`
  }
  if (numero === '6.7') {
    return `${total} ${total === 1 ? 'grupo' : 'grupos'} de botões de opção (radio) fora de <fieldset>.`
  }
  return 'Achamos CAPTCHA conhecido na página (reCAPTCHA, hCaptcha ou Turnstile).'
}

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

  // se a coluna repetir um número, vale o primeiro
  const indicios = new Map<string, Indicio>()
  for (const i of validarIndicios(avaliacao.indicios))
    if (!indicios.has(i.numero)) indicios.set(i.numero, i)
  const naoAplicaveis = validarNaoAplicaveis(avaliacao.requisitosNaoAplicaveis)

  const itens = itensDeRevisao(avaliacao.requisitosEmDuvida).map((r) => {
    const indicio = indicios.get(r.numero)
    // indício vence o "não se aplica"
    const naoSeAplica =
      !indicio && naoAplicaveis.includes(r.numero) ? (MOTIVO_NAO_SE_APLICA[r.numero] ?? null) : null
    return {
      numero: r.numero,
      nome: r.nome,
      link: r.link,
      motivo: r.cobertura === 'nao' ? ('fixa' as const) : ('duvida' as const),
      conferir: r.cobertura === 'nao' ? (r.conferir ?? null) : CONFERIR_DUVIDA,
      feita: avaliacao.revisados.includes(r.numero),
      naoSeAplica,
      indicio: indicio ? { texto: textoDoIndicio(indicio), exemplos: indicio.exemplos } : null,
    }
  })
  // com indício, depois a lista principal, depois o grupo; cada parte na ordem do eMAG
  const revisao = [
    ...itens.filter((i) => i.indicio),
    ...itens.filter((i) => !i.indicio && !i.naoSeAplica),
    ...itens.filter((i) => i.naoSeAplica),
  ]

  return { nota: avaliacao.nota, verificacoes, cartoes, revisao }
}
