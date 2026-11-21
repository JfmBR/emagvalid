/// <reference lib="dom" />
// Tipos do DOM só para `lerFrame`, que roda dentro da página avaliada (frame.evaluate)
import type { Frame, Page } from 'playwright'
import type { Ocorrencia } from './analisar.js'

// Itens do eMAG que a análise aponta para a revisão humana (spec da revisão automática, "Detecção")
export type NumeroIndicio = '1.9' | '6.7' | '6.8'

export interface Indicio {
  numero: NumeroIndicio
  total: number
  exemplos: Ocorrencia[]
}

export interface RevisaoAutomatica {
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
const MAX_EXEMPLOS = 5
const MAX_TOTAL = 10_000
// o mesmo MAX_TRECHO de executar.ts; importar de lá criaria ciclo (executar → analisar → aqui)
const MAX_TRECHO = 1_000

// O axe que o AxeBuilder deixou em cada frame. O getSelector precisa da árvore do axe, que o
// analyze desmonta no fim: quem chama monta (setup) e desmonta (teardown) de novo.
type JanelaComAxe = Window & {
  axe?: {
    _tree?: unknown
    setup?: (raiz: Document) => unknown
    teardown?: () => void
    utils?: { getSelector?: (el: Element) => string }
  }
}

// Roda dentro de cada frame. O Playwright a serializa: sem import, sem closure e sem função nomeada
// dentro dela (o tsx do `npm run dev` embrulha essas em __name(), que não existe na página).
// O retorno é dado não confiável: o JavaScript da página pode trocar o DOM e o axe.
function lerFrame() {
  const LIMITE = 10_000
  const tirarAcentos = /\p{M}/gu
  const AVISOS = ['nova janela', 'nova aba', 'new window', 'new tab', 'abre em']
  const DOCUMENTOS = 'pdf doc docx xls xlsx ppt pptx odt ods odp rtf'.split(' ')
  const AUDIOS = 'mp3 wav ogg oga m4a aac opus flac'.split(' ')
  const VIDEOS = 'mp4 webm mov m4v ogv'.split(' ')
  // o host vale também com subdomínio
  const PLAYERS_DE_AUDIO = 'soundcloud.com open.spotify.com anchor.fm'.split(' ')
  const PLAYERS_DE_VIDEO =
    'youtube.com youtube-nocookie.com player.vimeo.com dailymotion.com'.split(' ')
  // [host, início do caminho]
  const CAPTCHAS = [
    ['google.com', '/recaptcha'],
    ['www.gstatic.com', '/recaptcha'],
    ['recaptcha.net', ''],
    ['hcaptcha.com', ''],
    ['challenges.cloudflare.com', ''],
  ]
  const PAPEIS = 'textbox searchbox combobox listbox radio checkbox spinbutton slider'.split(' ')
  const CAMPOS = [
    'form',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[contenteditable]',
    ...PAPEIS.map((papel) => `[role="${papel}"]`),
  ].join(',')

  const achou = {
    tabela: document.querySelector('table') !== null,
    documento: false,
    audio: document.querySelector('audio') !== null,
    video: document.querySelector('video') !== null,
    formulario: document.querySelector(CAMPOS) !== null,
  }
  for (const link of document.querySelectorAll('a[href]')) {
    const caminho = (
      URL.parse(link.getAttribute('href') ?? '', document.baseURI)?.pathname ?? ''
    ).toLowerCase()
    const extensao = caminho.includes('.') ? caminho.slice(caminho.lastIndexOf('.') + 1) : ''
    if (DOCUMENTOS.includes(extensao)) achou.documento = true
    if (AUDIOS.includes(extensao)) achou.audio = true
    if (VIDEOS.includes(extensao)) achou.video = true
  }
  for (const iframe of document.querySelectorAll('iframe[src]')) {
    const alvo = URL.parse(iframe.getAttribute('src') ?? '', document.baseURI)
    const host = alvo?.hostname ?? ''
    if (PLAYERS_DE_AUDIO.some((h) => host === h || host.endsWith(`.${h}`))) achou.audio = true
    if (PLAYERS_DE_VIDEO.some((h) => host === h || host.endsWith(`.${h}`))) achou.video = true
  }

  const novaJanela = { numero: '1.9', total: 0, elementos: [] as Element[] }
  const radios = { numero: '6.7', total: 0, elementos: [] as Element[] }
  const captcha = { numero: '6.8', total: 0, elementos: [] as Element[] }

  // 1.9: link que abre em nova aba ou janela sem aviso no nome
  for (const link of document.querySelectorAll('a[href][target]')) {
    if (novaJanela.total >= LIMITE) break
    const alvo = (link.getAttribute('target') ?? '').toLowerCase()
    if (['', '_self', '_parent', '_top'].includes(alvo)) continue
    const nome = [
      link.textContent,
      link.getAttribute('aria-label'),
      link.getAttribute('title'),
      ...Array.from(link.querySelectorAll('img[alt]'), (img) => img.getAttribute('alt')),
    ]
      .join(' ')
      .normalize('NFD')
      .replace(tirarAcentos, '')
      .toLowerCase()
    if (AVISOS.some((aviso) => nome.includes(aviso))) continue
    novaJanela.total++
    if (novaJanela.elementos.length < 5) novaJanela.elementos.push(link)
  }

  // 6.7: grupo de radios (mesmo name no mesmo form; sem name, sozinho) com algum fora de fieldset
  const grupos: { primeiro: Element; fora: boolean }[] = []
  const porFormulario = new Map<HTMLFormElement | null, Map<string, (typeof grupos)[number]>>()
  for (const radio of document.querySelectorAll<HTMLInputElement>('input[type="radio"]')) {
    const nome = radio.getAttribute('name') ?? ''
    let grupo = nome ? porFormulario.get(radio.form)?.get(nome) : undefined
    if (!grupo) {
      grupo = { primeiro: radio, fora: false }
      grupos.push(grupo)
      if (nome) {
        if (!porFormulario.has(radio.form)) porFormulario.set(radio.form, new Map())
        porFormulario.get(radio.form)?.set(nome, grupo)
      }
    }
    if (!radio.closest('fieldset, [role="radiogroup"]')) grupo.fora = true
  }
  for (const grupo of grupos) {
    if (radios.total >= LIMITE) break
    if (!grupo.fora) continue
    radios.total++
    if (radios.elementos.length < 5) radios.elementos.push(grupo.primeiro)
  }

  // 6.8: CAPTCHA conhecido
  for (const el of document.querySelectorAll(
    'iframe[src], script[src], .g-recaptcha, .h-captcha, .cf-turnstile',
  )) {
    if (captcha.total >= LIMITE) break
    const alvo = URL.parse(el.getAttribute('src') ?? '', document.baseURI)
    const host = alvo?.hostname ?? ''
    const conhecido =
      el.matches('.g-recaptcha, .h-captcha, .cf-turnstile') ||
      CAPTCHAS.some(
        ([h = '', inicio = '']) =>
          (host === h || host.endsWith(`.${h}`)) && (alvo?.pathname ?? '').startsWith(inicio),
      )
    if (!conhecido) continue
    captcha.total++
    if (captcha.elementos.length < 5) captcha.elementos.push(el)
  }

  const achados = [novaJanela, radios, captcha].filter((indicio) => indicio.total > 0)
  const axe = (window as JanelaComAxe).axe
  const montar = !axe?._tree && achados.length > 0
  if (montar) axe?.setup?.(document)
  try {
    return {
      achou,
      indicios: achados.map((indicio) => ({
        numero: indicio.numero,
        total: indicio.total,
        // o mesmo caminho das falhas; sem o axe, fica vazio e o trecho continua
        exemplos: indicio.elementos.map((el) => ({
          seletor: axe?.utils?.getSelector?.(el) ?? '',
          trecho: el.outerHTML.slice(0, 1000),
        })),
      })),
    }
  } finally {
    if (montar) axe?.teardown?.()
  }
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor.replaceAll('\u0000', '').slice(0, MAX_TRECHO) : null
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

// Lê aplicabilidade e indícios em cada frame, depois do axe. Nunca lança erro: em erro, devolve vazio.
export async function lerRevisaoAutomatica(pagina: Page): Promise<RevisaoAutomatica> {
  try {
    const frames = pagina.frames()
    // "não se aplica" só vale se todos os frames carregados foram lidos
    let leuTodos = frames.length <= MAX_FRAMES
    const aplicaveis = new Set<string>()
    const porNumero = new Map<NumeroIndicio, Indicio>()

    // caminho do iframe na frente do caminho do elemento, como o target.join(' ') do axe
    const prefixos = new Map<Frame, Promise<string>>()
    const prefixoDo = (frame: Frame): Promise<string> => {
      let prefixo = prefixos.get(frame)
      if (!prefixo) {
        const pai = frame.parentFrame()
        prefixo = pai
          ? Promise.all([
              prefixoDo(pai),
              frame.frameElement().then((iframe) =>
                iframe.evaluate((el) => {
                  const axe = (window as JanelaComAxe).axe
                  const montar = !axe?._tree
                  if (montar) axe?.setup?.(document)
                  try {
                    return axe?.utils?.getSelector?.(el as Element) ?? ''
                  } finally {
                    if (montar) axe?.teardown?.()
                  }
                }),
              ),
            ]).then((partes) => partes.filter(Boolean).join(' '))
          : Promise.resolve('')
        prefixos.set(frame, prefixo)
      }
      return prefixo
    }

    for (const frame of frames.slice(0, MAX_FRAMES)) {
      // frame destacado ou que nem carregou documento (iframe quebrado) não conta como lido nem como falha
      if (frame.isDetached() || frame.url().startsWith('chrome-error://')) continue
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
  } catch (erro) {
    console.error('Revisão automática com erro:', nomeDoErro(erro))
    return SEM_REVISAO_AUTOMATICA
  }
}
