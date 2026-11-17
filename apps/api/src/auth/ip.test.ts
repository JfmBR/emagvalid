import { describe, expect, it } from 'vitest'
import { chaveDoIp } from './ip.js'

describe('chave do IP para os limites', () => {
  it('IPv4 fica como está, inclusive na forma ::ffff: do Node', () => {
    expect(chaveDoIp('45.228.149.247')).toBe('45.228.149.247')
    expect(chaveDoIp('::ffff:127.0.0.1')).toBe('127.0.0.1')
  })

  it('IPv6 do mesmo /64 vira a mesma chave: trocar de endereço não fura o limite', () => {
    expect(chaveDoIp('2001:db8::1')).toBe(chaveDoIp('2001:db8::2'))
    expect(chaveDoIp('2001:db8:0:0:aaaa:bbbb:cccc:dddd')).toBe('2001:db8:0:0::/64')
    expect(chaveDoIp('2001:DB8:0:0::1')).toBe('2001:db8:0:0::/64')
  })

  it('IPv6 de /64 diferentes ficam separados', () => {
    expect(chaveDoIp('2001:db8:0:1::1')).not.toBe(chaveDoIp('2001:db8:0:2::1'))
  })
})
