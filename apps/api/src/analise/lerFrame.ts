/// <reference lib="dom" />
// Funções que rodam dentro da página avaliada (frame.evaluate), por isso os tipos do DOM.
// O Playwright as serializa: sem import, sem closure e sem função nomeada dentro delas (o tsx do
// `npm run dev` embrulha essas em __name(), que não existe na página).
// O retorno é dado não confiável: o JavaScript da página pode trocar o DOM e o axe.

// O axe que o AxeBuilder deixou em cada frame. O getSelector precisa da árvore do axe, que o
// analyze desmonta no fim: quem chama monta (setup) e desmonta (teardown) de novo.
type JanelaComAxe = Window & {
  axe?: {
    _tree?: unknown
    setup?: (raiz: Document) => unknown
    teardown?: () => void
    // dentro de shadow root, o caminho vem como lista (um trecho por raiz)
    utils?: { getSelector?: (el: Element) => string | string[] }
  }
}

// Caminho do iframe no frame pai, para ir na frente do caminho do elemento do frame filho.
// Sem o axe, ou se ele falhar, fica vazio.
export function caminhoDoIframe(iframe: Node): string {
  const axe = (window as JanelaComAxe).axe
  let montou = false
  try {
    if (!axe?._tree && axe?.setup) {
      axe.setup(document)
      montou = true
    }
    const caminho: unknown = axe?.utils?.getSelector?.(iframe as Element)
    if (Array.isArray(caminho)) return caminho.filter((p) => typeof p === 'string').join(' ')
    return typeof caminho === 'string' ? caminho : ''
  } catch {
    return ''
  } finally {
    try {
      if (montou) axe?.teardown?.()
    } catch {
      // nada a desfazer do nosso lado
    }
  }
}

// Lê um frame: o que existe nele (para o "não se aplica") e os indícios de 1.9, 6.7 e 6.8
export function lerFrame() {
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
  const WIDGETS_DE_CAPTCHA = '.g-recaptcha, .h-captcha, .cf-turnstile'
  const PAPEIS = 'textbox searchbox combobox listbox radio checkbox spinbutton slider'.split(' ')
  const CAMPOS = [
    'form',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    '[contenteditable]:not([contenteditable="false" i])',
    ...PAPEIS.map((papel) => `[role="${papel}"]`),
  ].join(',')

  // todos os elementos, inclusive dentro de shadow root aberto (o axe também entra; o fechado, não)
  const todos: Element[] = []
  const raizes: (Document | ShadowRoot)[] = [document]
  for (const raiz of raizes) {
    for (const el of raiz.querySelectorAll('*')) {
      todos.push(el)
      if (el.shadowRoot) raizes.push(el.shadowRoot)
    }
  }

  const achou = {
    tabela: todos.some((el) => el.matches('table')),
    documento: false,
    audio: todos.some((el) => el.matches('audio')),
    video: todos.some((el) => el.matches('video')),
    formulario: todos.some((el) => el.matches(CAMPOS)),
  }
  for (const link of todos) {
    if (!link.matches('a[href]')) continue
    const caminho = (
      URL.parse(link.getAttribute('href') ?? '', document.baseURI)?.pathname ?? ''
    ).toLowerCase()
    const extensao = caminho.includes('.') ? caminho.slice(caminho.lastIndexOf('.') + 1) : ''
    if (DOCUMENTOS.includes(extensao)) achou.documento = true
    if (AUDIOS.includes(extensao)) achou.audio = true
    if (VIDEOS.includes(extensao)) achou.video = true
  }
  for (const iframe of todos) {
    if (!iframe.matches('iframe[src]')) continue
    const host = URL.parse(iframe.getAttribute('src') ?? '', document.baseURI)?.hostname ?? ''
    if (PLAYERS_DE_AUDIO.some((h) => host === h || host.endsWith(`.${h}`))) achou.audio = true
    if (PLAYERS_DE_VIDEO.some((h) => host === h || host.endsWith(`.${h}`))) achou.video = true
  }

  const novaJanela = { numero: '1.9', total: 0, elementos: [] as Element[] }
  const radios = { numero: '6.7', total: 0, elementos: [] as Element[] }
  const captcha = { numero: '6.8', total: 0, elementos: [] as Element[] }

  // 1.9: link que abre em nova aba ou janela sem aviso no nome
  for (const link of todos) {
    if (novaJanela.total >= LIMITE) break
    if (!link.matches('a[href][target]')) continue
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
  for (const radio of todos) {
    if (!(radio instanceof HTMLInputElement) || !radio.matches('input[type="radio"]')) continue
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

  // 6.8: CAPTCHA conhecido. Conta o widget; o iframe dentro dele não conta de novo, e o script
  // só conta se for o único sinal (reCAPTCHA invisível)
  let script: Element | null = null
  for (const el of todos) {
    if (captcha.total >= LIMITE) break
    const conhecido =
      el.matches('iframe[src], script[src]') &&
      CAPTCHAS.some(([h = '', inicio = '']) => {
        const alvo = URL.parse(el.getAttribute('src') ?? '', document.baseURI)
        const host = alvo?.hostname ?? ''
        return (host === h || host.endsWith(`.${h}`)) && (alvo?.pathname ?? '').startsWith(inicio)
      })
    if (conhecido && el.matches('script')) script ??= el
    const widget = el.matches(WIDGETS_DE_CAPTCHA) || (conhecido && !el.closest(WIDGETS_DE_CAPTCHA))
    if (!widget || el.matches('script')) continue
    captcha.total++
    if (captcha.elementos.length < 5) captcha.elementos.push(el)
  }
  if (captcha.total === 0 && script) {
    captcha.total = 1
    captcha.elementos.push(script)
  }

  // o mesmo caminho das falhas; sem o axe, ou se ele falhar, o caminho fica vazio e o trecho continua
  const achados = [novaJanela, radios, captcha].filter((indicio) => indicio.total > 0)
  const axe = (window as JanelaComAxe).axe
  let montou = false
  try {
    if (!axe?._tree && axe?.setup && achados.length > 0) {
      axe.setup(document)
      montou = true
    }
  } catch {
    // sem árvore do axe: o getSelector abaixo falha e o caminho fica vazio
  }
  const indicios = achados.map((indicio) => ({
    numero: indicio.numero,
    total: indicio.total,
    exemplos: indicio.elementos.map((el) => {
      let seletor = ''
      try {
        const caminho: unknown = axe?.utils?.getSelector?.(el)
        if (Array.isArray(caminho)) {
          seletor = caminho.filter((p) => typeof p === 'string').join(' ')
        } else if (typeof caminho === 'string') seletor = caminho
      } catch {
        // caminho vazio
      }
      return { seletor, trecho: el.outerHTML.slice(0, 1000) }
    }),
  }))
  try {
    if (montou) axe?.teardown?.()
  } catch {
    // nada a desfazer do nosso lado
  }
  return { achou, indicios }
}
