// Pedidos da análise pela rede do Node, no lugar da rede do Chromium (SSRF e tamanho, RNF10)
import { request as pedirHttp, type Agent, type IncomingMessage } from 'node:http'
import { request as pedirHttps } from 'node:https'
import { isIP, type LookupFunction } from 'node:net'
import type { Readable, Transform } from 'node:stream'
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib'
import { ipBloqueado } from './endereco.js'

// pedido sem receber nada por este tempo é abandonado (a página segue sem ele)
const PEDIDO_PARADO_MS = 30_000

export class ErroDeTamanho extends Error {}

export interface Resposta {
  status: number
  cabecalhos: Record<string, string>
  corpo: Buffer
}

export interface Pedido {
  metodo: string
  cabecalhos: Record<string, string>
  corpo: Buffer | null
}

const descompressores: Record<string, () => Transform> = {
  gzip: createGunzip,
  'x-gzip': createGunzip,
  deflate: createInflate,
  br: createBrotliDecompress,
}

// Cabeçalhos para o route.fulfill: o corpo já vai descomprimido e inteiro
function cabecalhosDaResposta(resposta: IncomingMessage): Record<string, string> {
  const cabecalhos: Record<string, string> = {}
  for (const [nome, valor] of Object.entries(resposta.headers)) {
    if (valor === undefined) continue
    if (['content-encoding', 'content-length', 'transfer-encoding'].includes(nome)) continue
    // só o set-cookie vem como lista; o Playwright separa os valores por quebra de linha
    cabecalhos[nome] = Array.isArray(valor) ? valor.join('\n') : valor
  }
  return cabecalhos
}

// Cabeçalhos do pedido do Chromium para o pedido do Node; só codificações que sabemos descomprimir
export function cabecalhosDoPedido(origem: Record<string, string>, corpo: Buffer | null) {
  const cabecalhos: Record<string, string> = {}
  for (const [nome, valor] of Object.entries(origem)) {
    if (nome.startsWith(':')) continue
    if (['host', 'connection', 'content-length', 'transfer-encoding'].includes(nome)) continue
    cabecalhos[nome] = valor
  }
  cabecalhos['accept-encoding'] = 'gzip, deflate, br'
  if (corpo) cabecalhos['content-length'] = String(corpo.length)
  return cabecalhos
}

// 301/302/303 viram GET sem corpo; 307/308 mantêm método e corpo. Outra origem não recebe cookie nem senha.
export function pedidoDoSalto(anterior: Pedido, status: number, de: URL, para: URL): Pedido {
  const cabecalhos = { ...anterior.cabecalhos }
  if (de.origin !== para.origin) {
    delete cabecalhos['cookie']
    delete cabecalhos['authorization']
  }
  if (status !== 301 && status !== 302 && status !== 303) return { ...anterior, cabecalhos }
  for (const nome of ['content-type', 'content-length', 'content-encoding', 'content-language']) {
    delete cabecalhos[nome]
  }
  return { metodo: 'GET', cabecalhos, corpo: null }
}

// Um pedido, sem seguir redirecionamento. O corpo é contado já descomprimido e o pedido para
// assim que passa do teto, então uma bomba de descompressão não chega a ocupar a memória.
export function buscar(
  alvo: URL,
  pedido: Pedido,
  opcoes: {
    lookup: LookupFunction
    agente: Agent
    sinal: AbortSignal
    limite: number
    contar: (bytes: number) => boolean
  },
): Promise<Resposta> {
  return new Promise((ok, falha) => {
    const pedir = alvo.protocol === 'https:' ? pedirHttps : pedirHttp
    const requisicao = pedir(
      alvo,
      {
        method: pedido.metodo,
        headers: pedido.cabecalhos,
        lookup: opcoes.lookup,
        agent: opcoes.agente,
        signal: opcoes.sinal,
      },
      (resposta) => {
        const status = resposta.statusCode ?? 0
        const cabecalhos = cabecalhosDaResposta(resposta)
        if (status >= 300 && status <= 399 && cabecalhos['location']) {
          // o corpo de um redirecionamento não interessa
          resposta.destroy()
          ok({ status, cabecalhos, corpo: Buffer.alloc(0) })
          return
        }
        const codificacao = (resposta.headers['content-encoding'] ?? 'identity')
          .trim()
          .toLowerCase()
        const descomprimir = descompressores[codificacao]
        if (!descomprimir && codificacao !== 'identity') {
          resposta.destroy()
          falha(new Error(`codificação desconhecida: ${codificacao}`))
          return
        }
        const fluxo: Readable = descomprimir ? resposta.pipe(descomprimir()) : resposta
        const partes: Buffer[] = []
        let tamanho = 0
        fluxo.on('data', (parte: Buffer) => {
          tamanho += parte.length
          if (tamanho > opcoes.limite || !opcoes.contar(parte.length)) {
            falha(new ErroDeTamanho())
            fluxo.destroy()
            resposta.destroy()
            return
          }
          partes.push(parte)
        })
        fluxo.on('end', () => ok({ status, cabecalhos, corpo: Buffer.concat(partes) }))
        fluxo.on('error', falha)
        resposta.on('error', falha)
        // fechou antes do fim sem erro (conexão cortada): não deixa o pedido pendurado
        fluxo.on('close', () => falha(new Error('resposta incompleta')))
      },
    )
    requisicao.setTimeout(PEDIDO_PARADO_MS, () =>
      requisicao.destroy(Object.assign(new Error('pedido parado'), { code: 'ETIMEDOUT' })),
    )
    requisicao.on('error', falha)
    requisicao.end(pedido.corpo ?? undefined)
  })
}

// Resolve o nome na hora de conectar e recusa se qualquer IP for interno. Como a conexão usa
// exatamente os IPs conferidos aqui, um DNS que troca de resposta (rebinding) não passa.
// O Node não chama o lookup para IP literal; esse caso já foi conferido antes do pedido.
export function lookupSeguro(resolver: (host: string) => Promise<string[]>): LookupFunction {
  return (hostname, opcoes, callback) => {
    resolver(hostname).then(
      (ips) => {
        // IPv4 primeiro: nem todo servidor tem rota IPv6
        const enderecos = ips
          .map((address) => ({ address, family: isIP(address) }))
          .filter((e) => !opcoes.family || e.family === opcoes.family)
          .sort((a, b) => a.family - b.family)
        if (enderecos.length === 0 || ips.some(ipBloqueado)) {
          callback(Object.assign(new Error('endereço interno'), { code: 'EBLOQUEADO' }), '')
        } else if (opcoes.all) {
          // um endereço só: com vários, o "happy eyeballs" do Node estourava o tempo em rede lenta (ETIMEDOUT)
          callback(null, enderecos.slice(0, 1))
        } else {
          callback(null, enderecos[0]!.address, enderecos[0]!.family)
        }
      },
      (erro: NodeJS.ErrnoException) => callback(erro, ''),
    )
  }
}

// Erro do pedido feito pela rede do Node → motivo que o Chromium entende
export function motivoDaFalha(erro: unknown) {
  const codigo = (erro as { code?: unknown } | null)?.code
  if (codigo === 'EBLOQUEADO') return 'blockedbyclient'
  if (codigo === 'ENOTFOUND' || codigo === 'ENODATA') return 'namenotresolved'
  if (codigo === 'ETIMEDOUT') return 'timedout'
  // ETIMEOUT, ESERVFAIL e EREFUSED: DNS fora do ar, lento ou recusando no c-ares (resolverNome),
  // no lugar do EAI_AGAIN do getaddrinfo
  if (
    typeof codigo === 'string' &&
    [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEOUT',
      'ESERVFAIL',
      'EREFUSED',
      'EHOSTUNREACH',
      'ENETUNREACH',
    ].includes(codigo)
  )
    return 'connectionfailed'
  return 'failed'
}
