import { describe, expect, it } from 'vitest'
import { motivoDaFalha } from './rede.js'

const comCodigo = (code: string) => Object.assign(new Error(code), { code })

describe('motivoDaFalha', () => {
  it('DNS fora do ar ou lento (códigos do c-ares) é falha de conexão, não erro desconhecido', () => {
    expect(motivoDaFalha(comCodigo('ETIMEOUT'))).toBe('connectionfailed')
    expect(motivoDaFalha(comCodigo('ESERVFAIL'))).toBe('connectionfailed')
  })

  it('endereço interno, nome inexistente e prazo de conexão têm motivo próprio', () => {
    expect(motivoDaFalha(comCodigo('EBLOQUEADO'))).toBe('blockedbyclient')
    expect(motivoDaFalha(comCodigo('ENOTFOUND'))).toBe('namenotresolved')
    expect(motivoDaFalha(comCodigo('ETIMEDOUT'))).toBe('timedout')
  })

  it('o resto vira falha genérica', () => {
    expect(motivoDaFalha(comCodigo('EOUTRO'))).toBe('failed')
    expect(motivoDaFalha(null)).toBe('failed')
  })
})
