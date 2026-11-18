import { db } from '../db.js'
import { requisitosDaRegra, type Prioridade } from '../emag/requisitos.js'
import { ErroDeAnalise, analisar, type CodigoErro, type Violacao } from './analisar.js'
import { criarFila } from './fila.js'

export const LIMITE_PAGINA_GRANDE = 3_000 // shortcut: provisório até a medição da Tarefa 9
export const MAX_OCORRENCIAS_POR_REGRA = 50
export const MAX_TRECHO = 1_000

// Mensagens fixas por código: o cliente nunca recebe detalhe interno do erro
export const MENSAGEM_ERRO: Record<CodigoErro | 'INTERROMPIDA', string> = {
  INDISPONIVEL:
    'Não conseguimos abrir essa página. Confira se o endereço está certo e se a página abre no seu navegador.',
  DEMOROU: 'A página demorou demais para responder. Tente de novo daqui a alguns minutos.',
  NAO_HTML:
    'Esse endereço abre um arquivo, não uma página. Informe o endereço de uma página do site.',
  PEDE_LOGIN: 'Essa página pede login. Por enquanto, avaliamos só páginas públicas.',
  GRANDE_DEMAIS:
    'A página é grande demais para analisar (mais de 5 MB). Tente outra página do site.',
  BLOQUEADO:
    'Esse endereço não é de uma página pública na internet. Use o endereço que abre em qualquer navegador.',
  FALHOU: 'A análise falhou do nosso lado. Tente de novo em instantes.',
  INTERROMPIDA: 'A análise foi interrompida porque o servidor reiniciou. Tente de novo.',
}

export type FalhaNova = {
  requisitoEmag: string
  descricao: string
  prioridade: Prioridade
  seletor: string
  trecho: string
  revisaoHumana: boolean
}

// Uma falha por requisito do eMAG e por ocorrência (RF04). Regra sem requisito com prioridade não gera falha.
export function falhasDaAnalise(violacoes: Violacao[]): FalhaNova[] {
  const falhas: FalhaNova[] = []
  for (const violacao of violacoes) {
    for (const requisito of requisitosDaRegra(violacao.regra)) {
      if (!requisito.prioridade) continue
      for (const ocorrencia of violacao.ocorrencias.slice(0, MAX_OCORRENCIAS_POR_REGRA)) {
        falhas.push({
          requisitoEmag: requisito.numero,
          descricao: violacao.ajuda,
          prioridade: requisito.prioridade,
          seletor: ocorrencia.seletor,
          trecho: ocorrencia.trecho.slice(0, MAX_TRECHO),
          revisaoHumana: requisito.cobertura === 'parcial',
        })
      }
    }
  }
  return falhas
}

// shortcut: o andamento vive na memória de uma instância só, como a fila; a Tela 4 lê daqui
export const andamento = new Map<string, { etapa: 1 | 2 | 3; paginaGrande: boolean }>()

export async function executarAvaliacao(id: string): Promise<void> {
  const avaliacao = await db.avaliacao.findUnique({ where: { id } })
  if (!avaliacao) return

  const estado = { etapa: 1 as 1 | 2 | 3, paginaGrande: false }
  andamento.set(id, estado)
  try {
    await db.avaliacao.update({ where: { id }, data: { status: 'ANALISANDO' } })

    const { violacoes, urlFinal } = await analisar(avaliacao.url, {
      aoCarregar: (elementos) => {
        estado.etapa = 2
        estado.paginaGrande = elementos > LIMITE_PAGINA_GRANDE
      },
    })
    estado.etapa = 3

    await db.$transaction([
      db.falha.createMany({
        data: falhasDaAnalise(violacoes).map((falha) => ({ ...falha, avaliacaoId: id })),
      }),
      db.avaliacao.update({
        where: { id },
        data: {
          status: 'CONCLUIDA',
          concluidaEm: new Date(),
          urlFinal,
          paginaGrande: estado.paginaGrande,
        },
      }),
    ])
  } catch (erro) {
    const codigo: CodigoErro = erro instanceof ErroDeAnalise ? erro.codigo : 'FALHOU'
    // Log de segurança (decisão 13): só o código; em BLOQUEADO, a conta e o host, nunca a URL completa
    if (codigo === 'BLOQUEADO') {
      // oxlint-disable-next-line no-console
      console.error(
        'Análise com erro:',
        codigo,
        avaliacao.usuarioId,
        URL.parse(avaliacao.url)?.hostname,
      )
    } else {
      // oxlint-disable-next-line no-console
      console.error('Análise com erro:', codigo)
    }
    await db.avaliacao.update({
      where: { id },
      data: { status: 'ERRO', mensagemErro: MENSAGEM_ERRO[codigo] },
    })
  } finally {
    andamento.delete(id)
  }
}

export const fila = criarFila(executarAvaliacao)

// A fila é em memória: ao reiniciar, o que estava pendente viraria "Analisando" para sempre (decisão 8)
export async function recuperarInterrompidas(): Promise<number> {
  const { count } = await db.avaliacao.updateMany({
    where: { status: { in: ['NA_FILA', 'ANALISANDO'] } },
    data: { status: 'ERRO', mensagemErro: MENSAGEM_ERRO.INTERROMPIDA },
  })
  return count
}
