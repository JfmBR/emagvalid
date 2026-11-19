import { describe, expect, it } from 'vitest'
import { itensDeRevisao, resultadoDaAvaliacao } from './resultado.js'

const falha = (requisitoEmag: string, seletor = 'img', revisaoHumana = false) => ({
  requisitoEmag,
  descricao: 'Imagens devem ter texto alternativo',
  seletor,
  trecho: '<img src="a.png">',
  revisaoHumana,
})

const base = {
  nota: 57,
  requisitosAplicaveis: ['3.1', '3.3', '3.6'],
  requisitosEmDuvida: [],
  revisados: [],
  falhas: [],
}

describe('itensDeRevisao', () => {
  it('sempre as 16 sem cobertura; com dúvida do axe, mais essas, na ordem do eMAG', () => {
    expect(itensDeRevisao([])).toHaveLength(16)

    const numeros = itensDeRevisao(['4.1']).map((r) => r.numero)
    expect(numeros).toHaveLength(17)
    expect(numeros.indexOf('4.1')).toBe(numeros.indexOf('3.12') + 1)
  })
})

describe('resultadoDaAvaliacao', () => {
  it('verificações: cada aplicável com peso e se foi aprovada', () => {
    const { verificacoes } = resultadoDaAvaliacao({ ...base, falhas: [falha('3.6')] })

    expect(verificacoes).toEqual([
      expect.objectContaining({ numero: '3.1', prioridade: 'media', peso: 2, aprovada: true }),
      expect.objectContaining({ numero: '3.3', peso: 2, aprovada: true }),
      expect.objectContaining({ numero: '3.6', prioridade: 'alta', peso: 3, aprovada: false }),
    ])
  })

  it('cartões: um por requisito, com as ocorrências, da prioridade alta para a baixa', () => {
    const { cartoes } = resultadoDaAvaliacao({
      ...base,
      falhas: [
        falha('1.8', 'main'),
        falha('3.6', 'img.a'),
        falha('1.3', 'h3'),
        falha('3.6', 'img.b'),
      ],
    })

    expect(cartoes.map((c) => c.numero)).toEqual(['3.6', '1.3', '1.8'])
    expect(cartoes[0]?.ocorrencias.map((o) => o.seletor)).toEqual(['img.a', 'img.b'])
    expect(cartoes[0]).toMatchObject({ prioridade: 'alta', link: expect.stringContaining('#s3.3') })
  })

  it('cartão leva o selo de revisão humana se alguma falha pedir', () => {
    const { cartoes } = resultadoDaAvaliacao({
      ...base,
      falhas: [falha('3.5', 'a'), falha('3.5', 'a.b', true)],
    })
    expect(cartoes[0]?.revisaoHumana).toBe(true)
  })

  it('revisão: fixas e em dúvida, com o que conferir e o que já foi marcado', () => {
    const { revisao } = resultadoDaAvaliacao({
      ...base,
      requisitosEmDuvida: ['4.1'],
      revisados: ['4.4', '4.1'],
    })

    expect(revisao.find((r) => r.numero === '4.1')).toMatchObject({
      motivo: 'duvida',
      feita: true,
      conferir: expect.stringContaining('Confira à mão'),
    })
    expect(revisao.find((r) => r.numero === '4.4')).toMatchObject({ motivo: 'fixa', feita: true })
    expect(revisao.find((r) => r.numero === '1.1')).toMatchObject({ feita: false })
  })

  it('avaliação antiga, sem nota nem aplicáveis: sem verificações, cartões continuam', () => {
    const resultado = resultadoDaAvaliacao({
      ...base,
      nota: null,
      requisitosAplicaveis: [],
      falhas: [falha('3.6')],
    })

    expect(resultado.nota).toBeNull()
    expect(resultado.verificacoes).toEqual([])
    expect(resultado.cartoes).toHaveLength(1)
  })
})
