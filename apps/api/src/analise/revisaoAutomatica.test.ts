import { describe, expect, it } from 'vitest'
import { validarIndicios, validarNaoAplicaveis } from './revisaoAutomatica.js'

describe('validação do que a página devolveu', () => {
  it('validarIndicios descarta número fora da lista, total inválido e corta exemplos e textos', () => {
    const longo = 'a'.repeat(5000)
    const r = validarIndicios([
      { numero: '1.9', total: 7, exemplos: Array(6).fill({ seletor: 'a\u0000', trecho: longo }) },
      { numero: '3.6', total: 1, exemplos: [] },
      { numero: '6.7', total: -1, exemplos: [] },
      { numero: '6.8', total: 1.5, exemplos: [] },
      'lixo',
    ])
    expect(r).toHaveLength(1)
    expect(r[0]?.exemplos).toHaveLength(5)
    expect(r[0]?.exemplos[0]).toEqual({ seletor: 'a', trecho: 'a'.repeat(1000) })
  })

  it('validarNaoAplicaveis aceita só os 9 possíveis, sem repetição, na ordem do eMAG', () => {
    expect(validarNaoAplicaveis(['6.5', '1.6', '6.5', '3.6', 7])).toEqual(['1.6', '6.5'])
    expect(validarNaoAplicaveis('x')).toEqual([])
  })
})
