import { describe, expect, it } from 'vitest'
import { calcularNota, requisitosDasRegras } from './nota.js'

describe('requisitosDasRegras', () => {
  it('meta-refresh liga a 2.3, 2.4 e 2.5', () => {
    expect(requisitosDasRegras(['meta-refresh'])).toEqual(['2.3', '2.4', '2.5'])
  })

  it('duas regras do mesmo requisito dão um número só', () => {
    expect(requisitosDasRegras(['image-alt', 'role-img-alt'])).toEqual(['3.6'])
  })

  it('segue a ordem da lista do eMAG, não a das regras', () => {
    expect(requisitosDasRegras(['image-alt', 'document-title', 'html-has-lang'])).toEqual([
      '3.1',
      '3.3',
      '3.6',
    ])
  })

  it('regra sem requisito do eMAG fica de fora', () => {
    expect(requisitosDasRegras(['regra-inventada'])).toEqual([])
  })
})

describe('calcularNota', () => {
  it('tudo aprovado dá 100', () => {
    expect(calcularNota(['3.6', '1.3'], [])).toBe(100)
  })

  it('pesa pela prioridade: alta 3, média 2, baixa 1', () => {
    // 3.6 alta (3) reprovada; 1.3 média (2) e 1.8 baixa (1) aprovadas: 100 × 3 ÷ 6
    expect(calcularNota(['3.6', '1.3', '1.8'], ['3.6'])).toBe(50)
  })

  it('arredonda para baixo', () => {
    // 3.6 alta (3) e 1.8 baixa (1) aprovadas; 1.3 média (2) reprovada: 100 × 4 ÷ 6 = 66,7
    expect(calcularNota(['3.6', '1.3', '1.8'], ['1.3'])).toBe(66)
  })

  it('com uma reprovada, nunca dá 100', () => {
    // 66 aprovadas de peso 3 (198) e uma baixa (1) reprovada: 100 × 198 ÷ 199 = 99,5
    const aplicaveis = [...Array.from({ length: 66 }, () => '3.6'), '1.8']
    expect(calcularNota(aplicaveis, ['1.8'])).toBe(99)
  })

  it('tudo reprovado dá 0', () => {
    expect(calcularNota(['3.6'], ['3.6'])).toBe(0)
  })

  it('sem verificação aplicável não há nota', () => {
    expect(calcularNota([], [])).toBeNull()
  })

  it('reprovado fora das aplicáveis não entra na conta', () => {
    expect(calcularNota(['1.3'], ['3.6'])).toBe(100)
  })
})
