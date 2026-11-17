import { isIPv6 } from 'node:net'

// Chave do IP para os limites (tentativas.ts). Revisão de segurança de 17/11/2026:
// quem tem IPv6 costuma receber um /64 inteiro (2^64 endereços) e trocaria de endereço a cada
// pedido; por isso o IPv6 conta pelo /64, e o IPv4 pelo endereço.
export function chaveDoIp(ip: string) {
  const semPrefixo = ip.toLowerCase().replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '')
  if (!isIPv6(semPrefixo)) return semPrefixo
  const [inicio = '', fim = ''] = semPrefixo.split('::')
  const blocosInicio = inicio ? inicio.split(':') : []
  const blocosFim = fim ? fim.split(':') : []
  const blocos = semPrefixo.includes('::')
    ? [
        ...blocosInicio,
        ...Array<string>(8 - blocosInicio.length - blocosFim.length).fill('0'),
        ...blocosFim,
      ]
    : semPrefixo.split(':')
  const prefixo = blocos.slice(0, 4).map((bloco) => parseInt(bloco || '0', 16).toString(16))
  return `${prefixo.join(':')}::/64`
}
