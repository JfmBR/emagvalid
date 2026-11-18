import { createSocket, type Socket } from 'node:dgram'
import { createServer, type Server } from 'node:http'
import { createServer as criarServidorTcp, type AddressInfo } from 'node:net'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { ambienteDoNavegador, analisar, TAMANHO_MAXIMO, type CodigoErro } from './analisar.js'

// Página local com uma falha conhecida (imagem sem alt) e título e idioma corretos
const html = `<!doctype html><html lang="pt-BR"><head><title>Teste</title></head>
<body><main><h1>Teste</h1><img src="x.png"></main></body></html>`
const MB = 1024 * 1024

// Bombas de descompressão: poucos KB na rede, dezenas de MB depois de descomprimir
const bombaGzip = gzipSync(
  Buffer.concat([Buffer.from('<!doctype html><title>Bomba</title><p>'), Buffer.alloc(20 * MB, 97)]),
)
const bombaBrotli = brotliCompressSync(Buffer.alloc(60 * MB), {
  params: { [constants.BROTLI_PARAM_QUALITY]: 1 },
})

let servidor: Server
let url: string
let porta: number
let udp: Socket
let portaUdp: number
// porta onde ninguém pode nem conectar (pega preconnect, que abre só a conexão TCP)
let sentinela: ReturnType<typeof criarServidorTcp>
let portaSentinela: number
// pedidos com Host diferente de 127.0.0.1: o teste só aceita 127.0.0.1, então nenhum pode chegar
let pedidosInternos: string[] = []
// método, caminho e corpo que chegaram em /eco
let ecos: string[] = []

beforeAll(async () => {
  servidor = createServer((req, res) => {
    if (!req.headers.host?.startsWith('127.0.0.1')) {
      pedidosInternos.push(`${req.headers.host} ${req.url}`)
    }
    const interno = `http://localhost:${porta}`
    const { pathname, search } = new URL(req.url ?? '/', 'http://x')
    switch (pathname) {
      case '/bomba-gzip':
        res.writeHead(200, { 'content-type': 'text/html', 'content-encoding': 'gzip' })
        res.end(bombaGzip)
        return
      case '/br-enorme':
        res.writeHead(200, { 'content-type': 'image/png', 'content-encoding': 'br' })
        res.end(bombaBrotli)
        return
      case '/com-br-enorme':
        res.setHeader('content-type', 'text/html')
        res.end(html.replace('x.png', '/br-enorme'))
        return
      case '/peso':
        res.setHeader('content-type', 'image/png')
        res.end(Buffer.alloc(600 * 1024))
        return
      case '/varias-imagens':
        res.setHeader('content-type', 'text/html')
        res.end(
          html.replace(
            '<img src="x.png">',
            [1, 2, 3].map((n) => `<img src="/peso?${n}">`).join(''),
          ),
        )
        return
      case '/vai-sumiu':
        res.writeHead(302, { location: `http://sumiu.test:${porta}/` })
        res.end()
        return
      case '/307':
        res.writeHead(307, { location: '/eco?307' })
        res.end()
        return
      case '/303':
        res.writeHead(303, { location: '/eco?303' })
        res.end()
        return
      case '/eco': {
        let corpo = ''
        req.on('data', (parte: Buffer) => (corpo += parte.toString()))
        req.on('end', () => {
          ecos.push(`${req.method} ${search} ${corpo}`)
          res.end('ok')
        })
        return
      }
      case '/metodos':
        // XHR síncrono: a página só termina de carregar depois das respostas
        res.setHeader('content-type', 'text/html')
        res.end(`<!doctype html><html lang="pt-BR"><head><title>Métodos</title></head><body><script>
  for (const caminho of ['/307', '/303']) {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', caminho, false)
    xhr.send('corpo' + caminho.slice(1))
  }
</script></body></html>`)
        return
    }
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
<iframe src="${interno}/iframe" title="Interno"></iframe>
<link rel="preconnect" href="http://localhost:${portaSentinela}">
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
  sentinela = criarServidorTcp((socket) => {
    pedidosInternos.push('tcp')
    socket.destroy()
  })
  await new Promise<void>((ok) => sentinela.listen(0, '127.0.0.1', ok))
  portaSentinela = (sentinela.address() as AddressInfo).port
  url = `http://127.0.0.1:${porta}`
})

beforeEach(() => {
  pedidosInternos = []
  ecos = []
})

afterAll(() => {
  servidor.close()
  udp.close()
  sentinela.close()
})

const soLocal = async (hostname: string) => hostname === '127.0.0.1'

// resolvedor de DNS que não conhece o nome
const semDns = async (): Promise<string[]> => {
  throw Object.assign(new Error('não achei'), { code: 'ENOTFOUND' })
}

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

  it('documento gzip pequeno que descomprime para mais de 5 MB → GRANDE_DEMAIS', async () => {
    expect(bombaGzip.length).toBeLessThan(100 * 1024)
    expect(await codigoDoErro(analisar(`${url}/bomba-gzip`, { conferirEndereco: soLocal }))).toBe(
      'GRANDE_DEMAIS',
    )
  })

  it('sub-recurso br enorme é abortado e a análise conclui', async () => {
    // descomprimido teria 60 MB, acima também do teto total: se não parasse em 5 MB, daria GRANDE_DEMAIS
    const { violacoes } = await analisar(`${url}/com-br-enorme`, { conferirEndereco: soLocal })
    expect(violacoes.find((v) => v.regra === 'image-alt')).toBeDefined()
  })

  it('soma dos recursos acima do teto total → GRANDE_DEMAIS', async () => {
    // 3 imagens de 600 KB com teto de 1 MB (o teto real, 50 MB, deixaria o teste lento)
    expect(
      await codigoDoErro(
        analisar(`${url}/varias-imagens`, {
          conferirEndereco: soLocal,
          tamanhoMaximoTotal: MB,
        }),
      ),
    ).toBe('GRANDE_DEMAIS')
  })

  it('DNS rebinding: o IP usado na conexão também é conferido', async () => {
    // a conferência recebe um IP público; a conexão, o IP interno
    const respostas = [['203.0.113.10'], ['127.0.0.1']]
    const resolver = async (host: string) => {
      if (host !== 'rebind.test') return semDns()
      return respostas.shift() ?? ['127.0.0.1']
    }
    expect(await codigoDoErro(analisar(`http://rebind.test:${porta}/`, { resolver }))).toBe(
      'BLOQUEADO',
    )
    expect(respostas).toEqual([])
    expect(pedidosInternos).toEqual([])
  })

  it('endereço inicial que não existe → INDISPONIVEL', async () => {
    expect(await codigoDoErro(analisar('http://sumiu.test/', { resolver: semDns }))).toBe(
      'INDISPONIVEL',
    )
  })

  it('redirecionamento para nome que não existe → INDISPONIVEL', async () => {
    const conferir = async (hostname: string) => ['127.0.0.1', 'sumiu.test'].includes(hostname)
    expect(
      await codigoDoErro(
        analisar(`${url}/vai-sumiu`, {
          conferirEndereco: conferir,
          resolver: semDns,
        }),
      ),
    ).toBe('INDISPONIVEL')
  })

  it('307 mantém método e corpo; 303 vira GET sem corpo', async () => {
    await analisar(`${url}/metodos`, { conferirEndereco: soLocal })
    expect(ecos).toEqual(['POST ?307 corpo307', 'GET ?303 '])
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
