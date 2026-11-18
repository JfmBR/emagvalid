import { describe, expect, it } from 'vitest'
import { classificarEndereco, ipBloqueado, MSG_URL, prepararUrl } from './endereco.js'

// Devolve o href do resultado ou falha o teste
function ok(resultado: ReturnType<typeof prepararUrl>): string {
  if ('erro' in resultado) throw new Error(`esperava url, veio erro: ${resultado.erro}`)
  return resultado.url.href
}

describe('prepararUrl', () => {
  it('completa com https:// e aceita http e https', () => {
    expect(ok(prepararUrl(' www.loja.com.br '))).toBe('https://www.loja.com.br/')
    expect(ok(prepararUrl('http://loja.com.br/a?b=1'))).toBe('http://loja.com.br/a?b=1')
  })
  it('recusa com a mensagem do campo', () => {
    expect(prepararUrl('')).toEqual({ erro: MSG_URL.vazia })
    expect(prepararUrl('ftp://loja.com.br')).toEqual({ erro: MSG_URL.invalida })
    expect(prepararUrl('https://' + 'a'.repeat(2050) + '.com')).toEqual({ erro: MSG_URL.invalida })
    expect(prepararUrl('https://ana:123@loja.com.br')).toEqual({ erro: MSG_URL.comSenha })
    expect(prepararUrl('https://loja.com.br:8080')).toEqual({ erro: MSG_URL.comPorta })
  })
})

describe('ipBloqueado', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    'fc00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
    '::7f00:1',
    '::ffff:0:7f00:1',
    '2002:7f00:1::1',
    '2001:0:4136:e378::1',
    '64:ff9b:1::1',
    '100::1',
    '::ffff:a9fe:a9fe',
    '::',
  ])('%s bloqueado', (ip) => expect(ipBloqueado(ip)).toBe(true))
  it.each(['8.8.8.8', '200.160.2.3', '2001:4860:4860::8888'])('%s liberado', (ip) =>
    expect(ipBloqueado(ip)).toBe(false),
  )
  it('texto que não é IP é bloqueado', () => {
    expect(ipBloqueado('loja.com.br')).toBe(true)
  })
})

describe('classificarEndereco', () => {
  it('interno se qualquer IP do nome for interno', async () => {
    expect(await classificarEndereco('x.teste', async () => ['8.8.8.8', '10.0.0.1'])).toBe(
      'interno',
    )
  })
  it('público se todos os IPs forem públicos', async () => {
    expect(await classificarEndereco('x.teste', async () => ['8.8.8.8'])).toBe('publico')
  })
  it('resolver sem nenhum IP é interno, na dúvida', async () => {
    expect(await classificarEndereco('x.teste', async () => [])).toBe('interno')
  })
  it('IP literal não passa pelo DNS', async () => {
    expect(
      await classificarEndereco('127.0.0.1', async () => {
        throw new Error('não chamar')
      }),
    ).toBe('interno')
  })
  it('IPv6 literal entre colchetes é decidido sem DNS', async () => {
    expect(
      await classificarEndereco('[::1]', async () => {
        throw new Error('não chamar')
      }),
    ).toBe('interno')
  })
  it('nome que não resolve é inexistente', async () => {
    expect(
      await classificarEndereco('x.teste', async () => {
        throw Object.assign(new Error(), { code: 'ENOTFOUND' })
      }),
    ).toBe('inexistente')
  })
  it('outro erro de DNS bloqueia, na dúvida', async () => {
    expect(
      await classificarEndereco('x.teste', async () => {
        throw new Error('falha qualquer')
      }),
    ).toBe('interno')
  })
})
