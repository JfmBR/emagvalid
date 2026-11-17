import { describe, expect, it } from 'vitest'
import { MAX_REGISTROS, criarLimite } from './tentativas.js'

describe('limite de tentativas', () => {
  it('bloqueia ao chegar no máximo e libera quando a janela passa', () => {
    const limite = criarLimite(5, 1000)
    const inicio = 1_000_000
    for (let i = 0; i < 4; i++) limite.registrar('chave', inicio)
    expect(limite.bloqueado('chave', inicio)).toBe(false)

    limite.registrar('chave', inicio)
    expect(limite.bloqueado('chave', inicio)).toBe(true)
    expect(limite.bloqueado('chave', inicio + 1000)).toBe(false)
  })

  it('cada chave conta separado, e limpar zera só a sua', () => {
    const limite = criarLimite(2, 1000)
    limite.registrar('a')
    limite.registrar('a')
    limite.registrar('b')

    expect(limite.bloqueado('a')).toBe(true)
    expect(limite.bloqueado('b')).toBe(false)
    limite.limpar('a')
    expect(limite.bloqueado('a')).toBe(false)
  })

  it('a memória tem teto, mesmo com muitas chaves inventadas', () => {
    const limite = criarLimite(5, 60_000)
    for (let i = 0; i < MAX_REGISTROS + 50; i++) limite.registrar(`inventado${i}`)

    expect(limite.total()).toBeLessThanOrEqual(MAX_REGISTROS)
  })
})
