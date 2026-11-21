/// <reference lib="es2024.string" />
// es2024.string para o toWellFormed (o tsconfig fica no ES2023)
import type { Frame, Page } from 'playwright'
import type { Ocorrencia } from './analisar.js'
import { caminhoDoIframe, lerFrame } from './lerFrame.js'

// Itens do eMAG que a análise aponta para a revisão humana (spec da revisão automática, "Detecção")
export type NumeroIndicio = '1.9' | '6.7' | '6.8'

// type (não interface): o tipo Json do Prisma só aceita objetos com assinatura implícita
export type Indicio = {
  numero: NumeroIndicio
  total: number
  exemplos: Ocorrencia[]
}

export type RevisaoAutomatica = {
  // itens que provavelmente não se aplicam: nada do objeto deles foi achado em nenhum frame
  naoAplicaveis: string[]
  indicios: Indicio[]
}

export const SEM_REVISAO_AUTOMATICA: RevisaoAutomatica = { naoAplicaveis: [], indicios: [] }

// na ordem do eMAG
export const NAO_APLICAVEIS_POSSIVEIS = '1.6 3.8 5.2 5.3 6.4 6.5 6.6 6.7 6.8'.split(' ')
const NUMEROS_INDICIO: NumeroIndicio[] = ['1.9', '6.7', '6.8']
// itens que cada objeto achado na página tira do grupo "não se aplica"
const ITENS_DO_OBJETO: Record<string, string[]> = {
  tabela: ['1.6'],
  documento: ['3.8'],
  audio: ['5.2'],
  video: ['5.3'],
  formulario: ['6.4', '6.5', '6.6', '6.7', '6.8'],
}

const MAX_FRAMES = 20
// prazo da leitura toda: passou, sai vazio e a avaliação conclui com o axe
const PRAZO_MS = 10_000
const MAX_EXEMPLOS = 5
const MAX_TOTAL = 10_000
// o mesmo MAX_TRECHO de executar.ts; importar de lá criaria ciclo (executar → analisar → aqui)
const MAX_TRECHO = 1_000

// toWellFormed: o corte (ou a página) pode deixar meio emoji, que o jsonb do Postgres recusa
function texto(valor: unknown): string | null {
  return typeof valor === 'string'
    ? valor.replaceAll('\u0000', '').slice(0, MAX_TRECHO).toWellFormed()
    : null
}

// Descarta o que foge do formato e corta exemplos e textos (dado da página ou da coluna Json)
export function validarIndicios(bruto: unknown): Indicio[] {
  if (!Array.isArray(bruto)) return []
  const indicios: Indicio[] = []
  for (const item of bruto) {
    const { numero, total, exemplos } = (item ?? {}) as Record<string, unknown>
    if (!NUMEROS_INDICIO.includes(numero as NumeroIndicio)) continue
    if (typeof total !== 'number' || !Number.isInteger(total) || total < 0 || total > MAX_TOTAL) {
      continue
    }
    if (!Array.isArray(exemplos)) continue
    const validos: Ocorrencia[] = []
    for (const exemplo of exemplos) {
      const { seletor, trecho } = (exemplo ?? {}) as Record<string, unknown>
      const s = texto(seletor)
      const t = texto(trecho)
      if (s !== null && t !== null) validos.push({ seletor: s, trecho: t })
      if (validos.length === MAX_EXEMPLOS) break
    }
    indicios.push({ numero: numero as NumeroIndicio, total, exemplos: validos })
  }
  return indicios
}

// Só os itens possíveis, sem repetição, na ordem do eMAG
export function validarNaoAplicaveis(bruto: unknown): string[] {
  return Array.isArray(bruto) ? NAO_APLICAVEIS_POSSIVEIS.filter((n) => bruto.includes(n)) : []
}

function nomeDoErro(erro: unknown): string {
  return erro instanceof Error ? erro.name : typeof erro
}

// Lê aplicabilidade e indícios em cada frame, depois do axe. Nunca lança erro: em erro ou depois
// do prazo, devolve vazio. `prazoMs` só muda nos testes.
export async function lerRevisaoAutomatica(
  pagina: Page,
  prazoMs = PRAZO_MS,
): Promise<RevisaoAutomatica> {
  let relogio: NodeJS.Timeout | undefined
  const prazo = new Promise<never>((_, falhar) => {
    relogio = setTimeout(() => falhar(new DOMException('prazo', 'TimeoutError')), prazoMs)
  })
  try {
    return await Promise.race([lerFrames(pagina), prazo])
  } catch (erro) {
    console.error('Revisão automática com erro:', nomeDoErro(erro))
    return SEM_REVISAO_AUTOMATICA
  } finally {
    clearTimeout(relogio)
  }
}

async function lerFrames(pagina: Page): Promise<RevisaoAutomatica> {
  // frame destacado ou que nem carregou documento (iframe quebrado) não conta como lido nem como falha
  const frames = pagina
    .frames()
    .filter((frame) => !frame.isDetached() && !frame.url().startsWith('chrome-error://'))
  // "não se aplica" só vale se todos os frames carregados foram lidos
  let leuTodos = frames.length <= MAX_FRAMES
  const aplicaveis = new Set<string>()
  const porNumero = new Map<NumeroIndicio, Indicio>()

  // caminho do iframe na frente do caminho do elemento, como o target.join(' ') do axe;
  // se falhar, o prefixo fica vazio e os indícios do frame continuam
  const prefixos = new Map<Frame, Promise<string>>()
  const prefixoDo = (frame: Frame): Promise<string> => {
    let prefixo = prefixos.get(frame)
    if (!prefixo) {
      const pai = frame.parentFrame()
      prefixo = pai
        ? Promise.all([
            prefixoDo(pai),
            frame
              .frameElement()
              .then((iframe) => iframe.evaluate(caminhoDoIframe))
              .catch(() => ''),
          ]).then((partes) => partes.filter(Boolean).join(' '))
        : Promise.resolve('')
      prefixos.set(frame, prefixo)
    }
    return prefixo
  }

  for (const frame of frames.slice(0, MAX_FRAMES)) {
    try {
      const lido: unknown = await frame.evaluate(lerFrame)
      const { achou, indicios } = (lido ?? {}) as {
        achou?: Record<string, unknown>
        indicios?: unknown
      }
      for (const [objeto, itens] of Object.entries(ITENS_DO_OBJETO)) {
        if (achou?.[objeto] === true) itens.forEach((n) => aplicaveis.add(n))
      }
      const validos = validarIndicios(indicios)
      const prefixo = validos.length > 0 ? await prefixoDo(frame) : ''
      for (const indicio of validos) {
        const exemplos = indicio.exemplos.map((e) => ({
          seletor: [prefixo, e.seletor].filter(Boolean).join(' '),
          trecho: e.trecho,
        }))
        const junto = porNumero.get(indicio.numero)
        porNumero.set(indicio.numero, {
          numero: indicio.numero,
          total: Math.min(MAX_TOTAL, (junto?.total ?? 0) + indicio.total),
          exemplos: [...(junto?.exemplos ?? []), ...exemplos].slice(0, MAX_EXEMPLOS),
        })
      }
    } catch (erro) {
      if (frame.isDetached()) continue
      leuTodos = false
      console.error('Revisão automática com erro:', nomeDoErro(erro))
    }
  }

  // indício vence o "não se aplica"
  for (const numero of porNumero.keys()) aplicaveis.add(numero)
  return {
    naoAplicaveis: validarNaoAplicaveis(
      leuTodos ? NAO_APLICAVEIS_POSSIVEIS.filter((n) => !aplicaveis.has(n)) : [],
    ),
    indicios: validarIndicios(NUMEROS_INDICIO.flatMap((n) => porNumero.get(n) ?? [])),
  }
}
