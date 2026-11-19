import { db } from '../db.js'
import { requisitosDaRegra, type Prioridade } from '../emag/requisitos.js'
import { ErroDeAnalise, analisar, type CodigoErro, type Violacao } from './analisar.js'
import { criarFila } from './fila.js'
import { calcularNota, requisitosDasRegras } from './nota.js'

// Medido em 17/11/2026 com `npm run analisar` (tempo inclui a rede): 22 elementos 1,7 s; 807 → 5,9 s;
// 851 → 12,6 s; 5.256 → 20,8 s; 16.555 → 43,1 s (~2 s por mil elementos, 30 s perto de 10 mil).
// Outras (gov.br, g1, sebrae, correios, bbc) deram DEMOROU por lentidão da rede, não por tamanho.
// shortcut: poucas medições (uma por página, só neste IP); rever com o tempo real das análises no Render
export const LIMITE_PAGINA_GRANDE = 10_000
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
  // vale para o reinício do servidor e para a pendente que morreu sem dono (deploy, banco fora)
  INTERROMPIDA: 'A análise foi interrompida do nosso lado. Tente de novo.',
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
          // a página controla os dois (ids enormes por JavaScript); o Postgres recusa o caractere nulo
          seletor: ocorrencia.seletor.replaceAll('\u0000', '').slice(0, MAX_TRECHO),
          trecho: ocorrencia.trecho.replaceAll('\u0000', '').slice(0, MAX_TRECHO),
          revisaoHumana: requisito.cobertura === 'parcial',
        })
      }
    }
  }
  return falhas
}

// shortcut: o andamento vive na memória de uma instância só, como a fila; a Tela 4 lê daqui
export const andamento = new Map<string, { etapa: 1 | 2 | 3; paginaGrande: boolean }>()

// Para o log: o nome do erro e o `code` (ex.: P2002 do Prisma). Nunca a message, que pode levar URL ou host do banco.
export function diagnostico(erro: unknown): string[] {
  const nome = erro instanceof Error ? erro.name : typeof erro
  const code = (erro as { code?: unknown } | null)?.code
  return typeof code === 'string' ? [nome, code] : [nome]
}

export async function executarAvaliacao(id: string): Promise<void> {
  const avaliacao = await db.avaliacao.findUnique({ where: { id } })
  if (!avaliacao) return

  const estado = { etapa: 1 as 1 | 2 | 3, paginaGrande: false }
  andamento.set(id, estado)
  try {
    // Cada gravação só vale se o status ainda for o esperado: outra instância (deploy) ou o GET da
    // Tela 4 pode ter dado a análise como morta, e a conta pode ter sido excluída
    const { count } = await db.avaliacao.updateMany({
      where: { id, status: 'NA_FILA' },
      data: { status: 'ANALISANDO' },
    })
    if (count === 0) return

    const { violacoes, aplicaveis, duvidas, urlFinal } = await analisar(avaliacao.url, {
      aoCarregar: (elementos) => {
        estado.etapa = 2
        estado.paginaGrande = elementos > LIMITE_PAGINA_GRANDE
      },
    })
    estado.etapa = 3

    const falhas = falhasDaAnalise(violacoes)
    const requisitosAplicaveis = requisitosDasRegras(aplicaveis)
    const reprovados = [...new Set(falhas.map((falha) => falha.requisitoEmag))]
    await db.$transaction(async (tx) => {
      const { count } = await tx.avaliacao.updateMany({
        where: { id, status: 'ANALISANDO' },
        data: {
          status: 'CONCLUIDA',
          concluidaEm: new Date(),
          urlFinal,
          paginaGrande: estado.paginaGrande,
          requisitosAplicaveis,
          requisitosEmDuvida: requisitosDasRegras(duvidas),
          nota: calcularNota(requisitosAplicaveis, reprovados),
        },
      })
      // já virou ERRO ou sumiu: as falhas não entram
      if (count === 0) return
      await tx.falha.createMany({
        data: falhas.map((falha) => ({ ...falha, avaliacaoId: id })),
      })
    })
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
    } else if (erro instanceof ErroDeAnalise) {
      // oxlint-disable-next-line no-console
      console.error('Análise com erro:', codigo)
    } else {
      // erro de fora do analisar (banco, bug): o diagnóstico é o nome e o code, nunca a mensagem
      // oxlint-disable-next-line no-console
      console.error('Análise com erro:', codigo, ...diagnostico(erro))
    }
    await db.avaliacao.updateMany({
      where: { id, status: { in: ['NA_FILA', 'ANALISANDO'] } },
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
