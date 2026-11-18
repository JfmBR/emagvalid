import { Agent as AgenteHttp } from 'node:http'
import { Agent as AgenteHttps } from 'node:https'
import { createRequire } from 'node:module'
import { AxeBuilder } from '@axe-core/playwright'
import { chromium, type Route } from 'playwright'
import { classificarEndereco, resolverNome, type TipoEndereco } from './endereco.js'
import {
  buscar,
  cabecalhosDoPedido,
  ErroDeTamanho,
  lookupSeguro,
  motivoDaFalha,
  pedidoDoSalto,
  type Pedido,
} from './rede.js'

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

// Só para os testes; a API não usa
interface OpcoesDeTeste {
  resolver?: (host: string) => Promise<string[]>
  tamanhoMaximoTotal?: number
}

export interface ResultadoAnalise {
  violacoes: Violacao[]
  urlFinal: string
}

// Teto de cada resposta já descomprimida (documento principal e cada sub-recurso) (RNF10)
export const TAMANHO_MAXIMO = 5 * 1024 * 1024
// Teto da soma de todas as respostas de uma análise
export const TAMANHO_MAXIMO_TOTAL = 50 * 1024 * 1024
// Teto de hosts distintos por análise: cada um custa uma consulta de DNS
export const MAX_HOSTS_POR_ANALISE = 50

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

// Erro do goto (net::ERR_... do Chromium ou do motivo dado no route.abort) → código do RF17
function codigoDoErro(erro: unknown): CodigoErro {
  const texto = erro instanceof Error ? `${erro.name} ${erro.message}` : String(erro)
  if (texto.includes('ERR_BLOCKED_BY_CLIENT')) return 'BLOQUEADO'
  if (/Timeout|ERR_TIMED_OUT/.test(texto)) return 'DEMOROU'
  if (/ERR_NAME_NOT_RESOLVED|ERR_CONNECTION_|ERR_ADDRESS_UNREACHABLE/.test(texto))
    return 'INDISPONIVEL'
  return 'FALHOU'
}

// Abre a página no Chromium, roda o axe-core e devolve as violações e o endereço final.
// Cada pedido da página (inclusive cada salto de redirecionamento) só sai se o host for público, e a
// conexão só vai para IP público (SSRF e DNS rebinding, RNF10). Respostas têm teto de tamanho.
export async function analisar(
  url: string,
  opcoes: OpcoesAnalise & OpcoesDeTeste = {},
): Promise<ResultadoAnalise> {
  const {
    limiteMs = 60_000,
    conferirEndereco,
    aoCarregar,
    resolver = resolverNome,
    tamanhoMaximoTotal = TAMANHO_MAXIMO_TOTAL,
  } = opcoes

  // cada host é conferido uma vez por análise; na dúvida (erro), bloqueia
  const conferidos = new Map<string, Promise<TipoEndereco>>()
  const classificar = (hostname: string) => {
    let tipo = conferidos.get(hostname)
    if (!tipo) {
      if (conferidos.size >= MAX_HOSTS_POR_ANALISE) return Promise.resolve<TipoEndereco>('interno')
      tipo = conferirEndereco
        ? conferirEndereco(hostname).then((ok) => (ok ? 'publico' : 'interno'))
        : classificarEndereco(hostname, resolver)
      tipo = tipo.catch(() => 'interno' as const)
      conferidos.set(hostname, tipo)
    }
    return tipo
  }

  // file:, data: e outros esquemas abririam sem passar pela rede (e sem conferência)
  const inicial = URL.parse(url)
  if (!inicial || (inicial.protocol !== 'http:' && inicial.protocol !== 'https:')) {
    throw new ErroDeAnalise('BLOQUEADO')
  }
  const tipoInicial = await classificar(inicial.hostname)
  if (tipoInicial === 'inexistente') throw new ErroDeAnalise('INDISPONIVEL')
  if (tipoInicial !== 'publico') throw new ErroDeAnalise('BLOQUEADO')

  const navegador = await chromium.launch({
    env: ambienteDoNavegador(process.env),
    // O Chromium fica sem rede própria: todo pedido dele vai a um proxy que não existe e falha.
    // Só sai o que o route abaixo conferiu e buscou pela rede do Node. Isso fecha o que o route não
    // intercepta: saltos de redirecionamento, prefetch/prerender, SharedWorker. O WebRTC (UDP) não usa
    // proxy, então fica proibido à parte.
    args: [
      '--proxy-server=http://proxy.invalid:1',
      '--proxy-bypass-list=<-loopback>',
      '--force-webrtc-ip-handling-policy=disable_non_proxied_udp',
    ],
  })

  // Relógio ou teto total encerram a análise na hora: param os pedidos e fecham o navegador
  let encerrada: CodigoErro | null = null
  const parar = new AbortController()
  const encerrar = (codigo: CodigoErro) => {
    if (encerrada) return
    encerrada = codigo
    parar.abort()
    navegador.close().catch(() => {})
  }
  const relogio = setTimeout(() => encerrar('DEMOROU'), limiteMs)
  let total = 0
  const contar = (bytes: number) => {
    total += bytes
    if (total > tamanhoMaximoTotal) encerrar('GRANDE_DEMAIS')
    return total <= tamanhoMaximoTotal
  }
  const lookup = lookupSeguro(resolver)
  const agenteHttp = new AgenteHttp({ keepAlive: true })
  const agenteHttps = new AgenteHttps({ keepAlive: true })

  try {
    const contexto = await navegador.newContext({ serviceWorkers: 'block' })
    const pagina = await contexto.newPage()
    // destino de um redirecionamento da página principal; o próximo goto pede ele como pedido novo
    let proximoEndereco: string | null = null

    // O Chromium segue redirecionamentos sem chamar o route de novo (e sem rede, falharia). Por isso o
    // pedido sai pela rede do Node sem seguir redirecionamento, e cada salto é conferido antes de ser pedido.
    // No contexto (e não na página) para pegar também janelas novas e workers.
    await contexto.route('**/*', async (route: Route) => {
      const pedido = route.request()
      let alvo = new URL(pedido.url())
      if (alvo.protocol !== 'http:' && alvo.protocol !== 'https:') return route.continue()
      let principal = false
      try {
        principal = pedido.isNavigationRequest() && pedido.frame() === pagina.mainFrame()
        const corpo = pedido.postDataBuffer()
        let atual: Pedido = {
          metodo: pedido.method(),
          cabecalhos: cabecalhosDoPedido(await pedido.allHeaders(), corpo),
          corpo,
        }
        for (let saltos = 0; ; saltos++) {
          if (saltos > MAX_SALTOS) return await route.abort('failed')
          const tipo = await classificar(alvo.hostname)
          if (tipo === 'inexistente') return await route.abort('namenotresolved')
          if (tipo !== 'publico') return await route.abort('blockedbyclient')
          const resposta = await buscar(alvo, atual, {
            lookup,
            agente: alvo.protocol === 'https:' ? agenteHttps : agenteHttp,
            sinal: parar.signal,
            limite: TAMANHO_MAXIMO,
            contar,
          })
          const destino = resposta.cabecalhos['location']
          if (resposta.status < 300 || resposta.status > 399 || !destino) {
            return await route.fulfill({
              status: resposta.status,
              headers: resposta.cabecalhos,
              body: resposta.corpo,
            })
          }
          const proximo = new URL(destino, alvo)
          if (principal) {
            proximoEndereco = proximo.href
            return await route.fulfill({ status: 200, contentType: 'text/html', body: '' })
          }
          atual = pedidoDoSalto(atual, resposta.status, alvo, proximo)
          alvo = proximo
        }
      } catch (erro) {
        // documento principal acima do teto encerra a análise; sub-recurso grande só é abortado
        if (erro instanceof ErroDeTamanho && principal) encerrar('GRANDE_DEMAIS')
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
    if (encerrada) throw new ErroDeAnalise(encerrada, erro)
    throw erro instanceof ErroDeAnalise ? erro : new ErroDeAnalise('FALHOU', erro)
  } finally {
    clearTimeout(relogio)
    parar.abort()
    agenteHttp.destroy()
    agenteHttps.destroy()
    // fechar não pode trocar o resultado nem o erro da análise
    await navegador.close().catch(() => {})
  }
}
