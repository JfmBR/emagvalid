import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

export const MSG_URL = {
  vazia: 'Digite o endereço da página.',
  invalida: 'Digite um endereço completo, como https://www.suaempresa.com.br.',
  comSenha: 'Tire o usuário e a senha do endereço. Avaliamos só páginas públicas.',
  comPorta: 'Use o endereço sem número de porta (como :8080).',
  interno:
    'Esse endereço não é de uma página pública na internet. Use o endereço que abre em qualquer navegador.',
  inexistente: 'Não encontramos esse endereço. Confira se ele está escrito certo.',
}

export type TipoEndereco = 'publico' | 'interno' | 'inexistente'

const TAMANHO_MAXIMO = 2048

// Normaliza o texto digitado: completa com https:// e recusa o que não é página pública comum
export function prepararUrl(texto: string): { url: URL } | { erro: string } {
  const limpo = texto.trim()
  if (limpo === '') return { erro: MSG_URL.vazia }
  if (limpo.length > TAMANHO_MAXIMO) return { erro: MSG_URL.invalida }

  const completo = /^[a-z][a-z0-9+.-]*:\/\//i.test(limpo) ? limpo : `https://${limpo}`
  let url: URL
  try {
    url = new URL(completo)
  } catch {
    return { erro: MSG_URL.invalida }
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { erro: MSG_URL.invalida }
  if (url.username !== '' || url.password !== '') return { erro: MSG_URL.comSenha }
  if (url.port !== '') return { erro: MSG_URL.comPorta }
  return { url }
}

const bloqueados = new BlockList()
for (const [rede, bits] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  bloqueados.addSubnet(rede, bits, 'ipv4')
}
for (const [rede, bits] of [
  ['::', 96], // inclui :: e ::1; IPv4-compatível (::7f00:1)
  ['::ffff:0:0:0', 96], // SIIT
  ['100::', 64],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
  ['2001::', 32], // Teredo
  ['2001:db8::', 32],
  ['2002::', 16], // 6to4
  ['64:ff9b::', 96],
  ['64:ff9b:1::', 48],
] as const) {
  bloqueados.addSubnet(rede, bits, 'ipv6')
}

// IPv4 mapeado em IPv6 (::ffff:a.b.c.d ou ::ffff:xxxx:xxxx) vira IPv4; o URL já normaliza as duas formas
function ipv4Mapeado(ip: string): string | null {
  const m = new URL(`http://[${ip}]`).hostname.match(/^\[::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})\]$/)
  if (!m) return null
  const alto = parseInt(m[1]!, 16)
  const baixo = parseInt(m[2]!, 16)
  return `${alto >> 8}.${alto & 255}.${baixo >> 8}.${baixo & 255}`
}

// Na dúvida, bloqueia: texto que não é IP também devolve true
export function ipBloqueado(ip: string): boolean {
  const versao = isIP(ip)
  if (versao === 0) return true
  try {
    if (versao === 4) return bloqueados.check(ip, 'ipv4')
    const mapeado = ipv4Mapeado(ip)
    return mapeado ? bloqueados.check(mapeado, 'ipv4') : bloqueados.check(ip, 'ipv6')
  } catch {
    return true
  }
}

async function resolverNome(host: string): Promise<string[]> {
  const enderecos = await lookup(host, { all: true })
  return enderecos.map((e) => e.address)
}

// O argumento deve vir de URL.hostname (já normalizado).
// shortcut: confere o DNS aqui e o Chromium resolve de novo ao abrir (DNS rebinding); fechar exige proxy próprio, depois do MVP
export async function classificarEndereco(
  hostname: string,
  resolver: (host: string) => Promise<string[]> = resolverNome,
): Promise<TipoEndereco> {
  const host = hostname.replace(/^\[|\]$/g, '')
  if (isIP(host) !== 0) return ipBloqueado(host) ? 'interno' : 'publico'

  let ips: string[]
  try {
    ips = await resolver(host)
  } catch (erro) {
    const codigo = (erro as { code?: string }).code
    return codigo === 'ENOTFOUND' || codigo === 'ENODATA' ? 'inexistente' : 'interno'
  }
  return ips.length === 0 || ips.some(ipBloqueado) ? 'interno' : 'publico'
}
