import { describe, expect, it } from 'vitest'
import { conferirSenha, gerarHashSenha } from './senha.js'

describe('senha', () => {
  it('guarda só o hash, com sal, e confere a senha certa', async () => {
    const guardado = await gerarHashSenha('minha senha boa')

    expect(guardado).not.toContain('minha senha boa')
    expect(guardado).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
    expect(await conferirSenha('minha senha boa', guardado)).toBe(true)
  })

  it('recusa a senha errada', async () => {
    const guardado = await gerarHashSenha('minha senha boa')

    expect(await conferirSenha('minha senha ruim', guardado)).toBe(false)
  })

  it('a mesma senha gera hashes diferentes (sal aleatório)', async () => {
    expect(await gerarHashSenha('igual123')).not.toBe(await gerarHashSenha('igual123'))
  })

  it('recusa um valor guardado em formato desconhecido', async () => {
    expect(await conferirSenha('qualquer', 'texto-sem-formato')).toBe(false)
  })

  it('recusa um hash guardado de tamanho errado (dado corrompido não abre a conta)', async () => {
    expect(await conferirSenha('x', 'scrypt$ab$zz')).toBe(false)
    expect(await conferirSenha('x', 'scrypt$$')).toBe(false)
  })
})
