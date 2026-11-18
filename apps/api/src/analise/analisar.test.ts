import { createSocket, type Socket } from 'node:dgram'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ambienteDoNavegador, analisar, TAMANHO_MAXIMO, type CodigoErro } from './analisar.js'

// Página local com uma falha conhecida (imagem sem alt) e título e idioma corretos
const html = `<!doctype html><html lang="pt-BR"><head><title>Teste</title></head>
<body><main><h1>Teste</h1><img src="x.png"></main></body></html>`

let servidor: Server
let url: string
let porta: number
let udp: Socket
let portaUdp: number
// caminhos pedidos com Host localhost: o teste só aceita 127.0.0.1, então nenhum pode chegar
let pedidosInternos: string[] = []

beforeAll(async () => {
  servidor = createServer((req, res) => {
    if (req.headers.host?.startsWith('localhost')) pedidosInternos.push(req.url ?? '')
    const interno = `http://localhost:${porta}`
    switch (req.url) {
      case '/texto':
        res.setHeader('content-type', 'text/plain')
        res.end('só texto')
        return
      case '/login':
        res.writeHead(401, { 'content-type': 'text/html' })
        res.end('<!doctype html><title>Entre</title>')
        return
      case '/sumiu':
        res.writeHead(404, { 'content-type': 'text/html' })
        res.end('<!doctype html><title>Não achei</title>')
        return
      case '/vai':
        res.writeHead(302, { location: '/' })
        res.end()
        return
      case '/fora':
        res.writeHead(302, { location: `${interno}/` })
        res.end()
        return
      case '/lenta':
        return // nunca responde
      case '/enorme':
        res.setHeader('content-type', 'text/html')
        res.end(`<!doctype html><title>Enorme</title><p>${'a'.repeat(TAMANHO_MAXIMO)}</p>`)
        return
      case '/imagem-fora':
        res.writeHead(302, { location: `${interno}/imagem` })
        res.end()
        return
      case '/w.js':
        res.setHeader('content-type', 'text/javascript')
        res.end(`fetch('${interno}/worker').catch(() => {})`)
        return
      case '/escapes':
        // sub-recurso que redireciona, janela nova, workers e WebSocket para o endereço interno
        res.setHeader('content-type', 'text/html')
        res.end(`<!doctype html><html lang="pt-BR"><head><title>Escapes</title></head><body>
<img src="/imagem-fora" alt="">
<link rel="prefetch" href="${interno}/prefetch">
<script type="speculationrules">
  { "prefetch": [{ "source": "list", "urls": ["${interno}/especulacao"] }],
    "prerender": [{ "source": "list", "urls": ["${interno}/prerender"] }] }
</script>
<script>
  navigator.sendBeacon('${interno}/beacon')
  const conexao = new RTCPeerConnection({ iceServers: [{ urls: 'stun:127.0.0.1:${portaUdp}' }] })
  conexao.createDataChannel('x')
  conexao.createOffer().then((oferta) => conexao.setLocalDescription(oferta))
  try { new SharedWorker('/w.js') } catch (e) {}
  try { new Worker('/w.js') } catch (e) {}
  try { new WebSocket('ws://localhost:${porta}/ws') } catch (e) {}
  window.open('${interno}/janela')
</script></body></html>`)
        return
      default:
        res.setHeader('content-type', 'text/html')
        res.end(html)
    }
  })
  servidor.on('upgrade', (req, socket) => {
    pedidosInternos.push(`upgrade ${req.url}`)
    socket.destroy()
  })
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok))
  porta = (servidor.address() as AddressInfo).port
  // STUN do WebRTC é UDP: não passa pelo route nem por proxy
  udp = createSocket('udp4')
  udp.on('message', () => pedidosInternos.push('udp'))
  await new Promise<void>((ok) => udp.bind(0, '127.0.0.1', ok))
  portaUdp = udp.address().port
  url = `http://127.0.0.1:${porta}`
})

beforeEach(() => {
  pedidosInternos = []
})

afterAll(() => {
  servidor.close()
  udp.close()
})

const soLocal = async (hostname: string) => hostname === '127.0.0.1'

async function codigoDoErro(promessa: Promise<unknown>): Promise<CodigoErro | undefined> {
  try {
    await promessa
  } catch (erro) {
    return (erro as { codigo?: CodigoErro }).codigo
  }
  return undefined
}

describe('analisar', { timeout: 20_000 }, () => {
  it('acha a imagem sem alt com seletor, trecho e texto em pt-BR', async () => {
    const { violacoes } = await analisar(url, { conferirEndereco: soLocal })
    const imagem = violacoes.find((v) => v.regra === 'image-alt')

    expect(imagem?.ocorrencias[0]?.seletor).toBe('img')
    expect(imagem?.ocorrencias[0]?.trecho).toContain('x.png')
    expect(imagem?.ajuda).toBeTruthy()
    expect(imagem?.ajuda).not.toContain('Images must')
  })

  it('segue o redirecionamento e devolve o endereço final', async () => {
    const { urlFinal } = await analisar(`${url}/vai`, { conferirEndereco: soLocal })
    expect(urlFinal).toBe(`${url}/`)
  })

  it('redirecionamento para endereço não público → BLOQUEADO', async () => {
    expect(await codigoDoErro(analisar(`${url}/fora`, { conferirEndereco: soLocal }))).toBe(
      'BLOQUEADO',
    )
    expect(pedidosInternos).toEqual([])
  })

  it('sub-recurso, janela nova, workers, prefetch, WebSocket e WebRTC não chegam ao endereço interno', async () => {
    await analisar(`${url}/escapes`, { conferirEndereco: soLocal })
    // dá tempo para pedidos atrasados chegarem, se escaparem
    await new Promise((ok) => setTimeout(ok, 500))
    expect(pedidosInternos).toEqual([])
  })

  it('endereço inicial não público → BLOQUEADO sem abrir o navegador', async () => {
    const conferidos: string[] = []
    const conferir = async (hostname: string) => {
      conferidos.push(hostname)
      return false
    }
    expect(await codigoDoErro(analisar(`${url}/`, { conferirEndereco: conferir }))).toBe(
      'BLOQUEADO',
    )
    expect(conferidos).toEqual(['127.0.0.1'])
    expect(pedidosInternos).toEqual([])
  })

  it('endereço que não é http nem https → BLOQUEADO', async () => {
    const tudo = async () => true
    expect(await codigoDoErro(analisar('file:///etc/passwd', { conferirEndereco: tudo }))).toBe(
      'BLOQUEADO',
    )
  })

  it.each([
    ['/texto', 'NAO_HTML'],
    ['/login', 'PEDE_LOGIN'],
    ['/sumiu', 'INDISPONIVEL'],
    ['/enorme', 'GRANDE_DEMAIS'],
  ])('%s → %s', async (caminho, codigo) => {
    expect(await codigoDoErro(analisar(`${url}${caminho}`, { conferirEndereco: soLocal }))).toBe(
      codigo,
    )
  })

  it('porta sem ninguém → INDISPONIVEL', async () => {
    // porta que acabou de ser liberada: ninguém escuta nela
    const livre = createServer()
    await new Promise<void>((ok) => livre.listen(0, '127.0.0.1', ok))
    const portaLivre = (livre.address() as AddressInfo).port
    await new Promise<void>((ok) => livre.close(() => ok()))

    expect(
      await codigoDoErro(analisar(`http://127.0.0.1:${portaLivre}`, { conferirEndereco: soLocal })),
    ).toBe('INDISPONIVEL')
  })

  it('passou do limite de tempo → DEMOROU', async () => {
    const inicio = Date.now()
    expect(
      await codigoDoErro(analisar(`${url}/lenta`, { conferirEndereco: soLocal, limiteMs: 1_500 })),
    ).toBe('DEMOROU')
    expect(Date.now() - inicio).toBeLessThan(5_000)
  })

  it('avisa quantos elementos a página tem', async () => {
    const contagens: number[] = []
    await analisar(url, { conferirEndereco: soLocal, aoCarregar: (n) => contagens.push(n) })
    expect(contagens).toHaveLength(1)
    expect(contagens[0]).toBeGreaterThan(0)
  })

  it('o Chromium não recebe DATABASE_URL nem chaves', () => {
    const env = ambienteDoNavegador({
      PATH: '/bin',
      HOME: '/h',
      LANG: 'pt_BR.UTF-8',
      DATABASE_URL: 'x',
      GEMINI_API_KEY: 'y',
    })
    expect(env).toEqual({ PATH: '/bin', HOME: '/h', LANG: 'pt_BR.UTF-8' })
  })
})
