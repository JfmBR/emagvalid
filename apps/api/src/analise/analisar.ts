import { createRequire } from 'node:module'
import { AxeBuilder } from '@axe-core/playwright'
import { chromium, type Route } from 'playwright'
import { classificarEndereco } from './endereco.js'

export interface Ocorrencia {
  seletor: string
  trecho: string
}

export interface Violacao {
  regra: string
  impacto: string | null
  ajuda: string
  ocorrencias: Ocorrencia[]
}

export type CodigoErro =
  'INDISPONIVEL' | 'DEMOROU' | 'NAO_HTML' | 'PEDE_LOGIN' | 'GRANDE_DEMAIS' | 'BLOQUEADO' | 'FALHOU'

export class ErroDeAnalise extends Error {
  constructor(
    readonly codigo: CodigoErro,
    causa?: unknown,
  ) {
    super(codigo, { cause: causa })
    this.name = 'ErroDeAnalise'
  }
}

export interface OpcoesAnalise {
  limiteMs?: number
  conferirEndereco?: (hostname: string) => Promise<boolean>
  aoCarregar?: (elementos: number) => void
}

export interface ResultadoAnalise {
  violacoes: Violacao[]
  urlFinal: string
}

// HTML principal maior que isto não é analisado (RNF10)
export const TAMANHO_MAXIMO = 5 * 1024 * 1024

// o mesmo limite de saltos do Chromium
const MAX_SALTOS = 20

// axe-core com os textos em pt-BR; o AxeBuilder injeta este código em cada página que analisa
const require = createRequire(import.meta.url)
const axeEmPortugues = `${require('axe-core').source};axe.configure({ locale: ${JSON.stringify(
  require('axe-core/locales/pt_BR.json'),
)} })`

// Só o necessário para o Chromium rodar: ele não pode ler DATABASE_URL nem chaves de API
export function ambienteDoNavegador(env: NodeJS.ProcessEnv): Record<string, string> {
  const copia: Record<string, string> = {}
  for (const nome of ['PATH', 'HOME', 'LANG']) {
    const valor = env[nome]
    if (valor !== undefined) copia[nome] = valor
  }
  return copia
}

async function enderecoPublico(hostname: string): Promise<boolean> {
  return (await classificarEndereco(hostname)) === 'publico'
}

// Erro do goto (net::ERR_... do Chromium ou do motivo dado no route.abort) → código do RF17
function codigoDoErro(erro: unknown): CodigoErro {
  const texto = erro instanceof Error ? `${erro.name} ${erro.message}` : String(erro)
  if (texto.includes('ERR_BLOCKED_BY_CLIENT')) return 'BLOQUEADO'
  if (/Timeout|ERR_TIMED_OUT/.test(texto)) return 'DEMOROU'
  if (/ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_|ERR_ADDRESS_UNREACHABLE/.test(texto))
    return 'INDISPONIVEL'
  return 'FALHOU'
}

// Erro do pedido feito pelo route.fetch (rede do Node) → motivo que o Chromium entende
function motivoDaFalha(erro: unknown): 'connectionfailed' | 'timedout' | 'failed' {
  const texto = String(erro)
  if (/ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN|EHOSTUNREACH|ENETUNREACH/.test(texto))
    return 'connectionfailed'
  if (/Timeout|ETIMEDOUT/.test(texto)) return 'timedout'
  return 'failed'
}

// Abre a página no Chromium, roda o axe-core e devolve as violações e o endereço final.
// Cada pedido da página (inclusive cada salto de redirecionamento) só sai se o host for público (SSRF, RNF10).
// shortcut: o host é conferido aqui e resolvido de novo na hora do pedido (DNS rebinding); fechar a janela exige proxy próprio, depois do MVP
// shortcut: o route.fetch guarda cada resposta inteira na memória do processo, sem limite de tamanho por recurso; limitar exige o mesmo proxy próprio
export async function analisar(url: string, opcoes: OpcoesAnalise = {}): Promise<ResultadoAnalise> {
  const { limiteMs = 60_000, conferirEndereco = enderecoPublico, aoCarregar } = opcoes

  // cada host é conferido uma vez por análise; na dúvida (erro), bloqueia
  const conferidos = new Map<string, Promise<boolean>>()
  const publico = (hostname: string) => {
    let resposta = conferidos.get(hostname)
    if (!resposta) {
      resposta = conferirEndereco(hostname).catch(() => false)
      conferidos.set(hostname, resposta)
    }
    return resposta
  }

  // file:, data: e outros esquemas abririam sem passar pela rede (e sem conferência)
  const inicial = URL.parse(url)
  if (
    !inicial ||
    (inicial.protocol !== 'http:' && inicial.protocol !== 'https:') ||
    !(await publico(inicial.hostname))
  ) {
    throw new ErroDeAnalise('BLOQUEADO')
  }

  const navegador = await chromium.launch({
    env: ambienteDoNavegador(process.env),
    // O Chromium fica sem rede própria: todo pedido dele vai a um proxy que não existe e falha.
    // Só sai o que o route abaixo conferiu e buscou pelo route.fetch (rede do Node). Isso fecha o que o
    // route não intercepta: saltos de redirecionamento, prefetch/prerender, SharedWorker. O WebRTC (UDP)
    // não usa proxy, então fica proibido à parte.
    args: [
      '--proxy-server=http://proxy.invalid:1',
      '--proxy-bypass-list=<-loopback>',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    ],
  })
  let estourou = false
  const relogio = setTimeout(() => {
    estourou = true
    navegador.close().catch(() => {})
  }, limiteMs)

  try {
    const contexto = await navegador.newContext({ serviceWorkers: 'block' })
    const pagina = await contexto.newPage()
    // destino de um redirecionamento da página principal; o próximo goto pede ele como pedido novo
    let proximoEndereco: string | null = null

    // O Chromium segue redirecionamentos sem chamar o route de novo (e sem rede, falharia). Por isso o
    // pedido sai pelo route.fetch sem seguir redirecionamento, e cada salto é conferido antes de ser pedido.
    // No contexto (e não na página) para pegar também janelas novas e workers.
    await contexto.route('**/*', async (route: Route) => {
      const pedido = route.request()
      let alvo = new URL(pedido.url())
      if (alvo.protocol !== 'http:' && alvo.protocol !== 'https:') return route.continue()
      try {
        const principal = pedido.isNavigationRequest() && pedido.frame() === pagina.mainFrame()
        for (let saltos = 0; ; saltos++) {
          if (saltos > MAX_SALTOS) return await route.abort('failed')
          if (!(await publico(alvo.hostname))) return await route.abort('blockedbyclient')
          const resposta = await route.fetch({ url: alvo.href, maxRedirects: 0 })
          const destino = resposta.headers()['location']
          if (resposta.status() < 300 || resposta.status() > 399 || !destino) {
            return await route.fulfill({ response: resposta })
          }
          alvo = new URL(destino, alvo)
          if (principal) {
            proximoEndereco = alvo.href
            return await route.fulfill({ status: 200, contentType: 'text/html', body: '' })
          }
        }
      } catch (erro) {
        await route.abort(motivoDaFalha(erro)).catch(() => {})
      }
    })
    await contexto.routeWebSocket(/.*/, (ws) => ws.close())

    let endereco = url
    let resposta = null
    for (let saltos = 0; ; saltos++) {
      proximoEndereco = null
      try {
        resposta = await pagina.goto(endereco, { timeout: limiteMs, waitUntil: 'load' })
      } catch (erro) {
        throw new ErroDeAnalise(codigoDoErro(erro), erro)
      }
      if (proximoEndereco === null) break
      if (saltos >= MAX_SALTOS) throw new ErroDeAnalise('FALHOU')
      endereco = proximoEndereco
    }

    if (!resposta) throw new ErroDeAnalise('FALHOU')
    const status = resposta.status()
    if (status === 401 || status === 403) throw new ErroDeAnalise('PEDE_LOGIN')
    if (status >= 400) throw new ErroDeAnalise('INDISPONIVEL')
    const tipo = resposta.headers()['content-type'] ?? ''
    if (!/text\/html|application\/xhtml\+xml/i.test(tipo)) throw new ErroDeAnalise('NAO_HTML')
    if ((await resposta.body()).length > TAMANHO_MAXIMO) throw new ErroDeAnalise('GRANDE_DEMAIS')

    aoCarregar?.(await pagina.locator('*').count())
    const { violations } = await new AxeBuilder({
      page: pagina,
      axeSource: axeEmPortugues,
    }).analyze()

    return {
      violacoes: violations.map((v) => ({
        regra: v.id,
        impacto: v.impact ?? null,
        ajuda: v.help,
        // seletor é o caminho do elemento na página; trecho é o HTML dele (mostrar sempre como texto, RNF10)
        ocorrencias: v.nodes.map((n) => ({ seletor: n.target.join(' '), trecho: n.html })),
      })),
      urlFinal: pagina.url(),
    }
  } catch (erro) {
    if (estourou) throw new ErroDeAnalise('DEMOROU', erro)
    throw erro instanceof ErroDeAnalise ? erro : new ErroDeAnalise('FALHOU', erro)
  } finally {
    clearTimeout(relogio)
    await navegador.close()
  }
}
