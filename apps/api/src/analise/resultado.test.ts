import { describe, expect, it } from 'vitest'
import { itensDeRevisao, resultadoDaAvaliacao, textoDoIndicio } from './resultado.js'

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
  requisitosNaoAplicaveis: [] as string[],
  indicios: [] as unknown,
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

  it('revisão: indício no topo, depois a principal, e o grupo no fim, com o motivo', () => {
    const { revisao } = resultadoDaAvaliacao({
      ...base,
      requisitosNaoAplicaveis: ['1.6', '6.5'],
      indicios: [
        {
          numero: '6.7',
          total: 2,
          exemplos: [{ seletor: 'input', trecho: '<input type="radio">' }],
        },
      ],
    })
    expect(revisao[0]).toMatchObject({
      numero: '6.7',
      naoSeAplica: null,
      indicio: {
        texto: '2 grupos de botões de opção (radio) fora de <fieldset>.',
        exemplos: [{ seletor: 'input' }],
      },
    })
    expect(revisao.slice(-2).map((r) => r.numero)).toEqual(['1.6', '6.5'])
    expect(revisao.at(-1)?.naoSeAplica).toBe(
      'Não achamos formulário nem campo de preenchimento na página.',
    )
    expect(revisao).toHaveLength(16)
  })

  it('número com indício nunca fica no grupo; indício repetido vale o primeiro', () => {
    const { revisao } = resultadoDaAvaliacao({
      ...base,
      requisitosNaoAplicaveis: ['6.7', '6.8'],
      indicios: [
        { numero: '6.7', total: 1, exemplos: [] },
        { numero: '6.7', total: 9, exemplos: [] },
      ],
    })
    expect(revisao[0]).toMatchObject({
      numero: '6.7',
      naoSeAplica: null,
      indicio: { texto: '1 grupo de botões de opção (radio) fora de <fieldset>.' },
    })
    expect(revisao.filter((r) => r.numero === '6.7')).toHaveLength(1)
    expect(revisao.at(-1)).toMatchObject({ numero: '6.8', indicio: null })
  })

  it('textos do indício no singular e plural; 6.8 sem contagem', () => {
    const t = (numero: '1.9' | '6.8', total: number) =>
      textoDoIndicio({ numero, total, exemplos: [] })
    expect(t('1.9', 1)).toBe('1 link abre em nova aba ou janela sem aviso no texto.')
    expect(t('1.9', 4)).toBe('4 links abrem em nova aba ou janela sem aviso no texto.')
    expect(t('6.8', 3)).toBe(
      'Achamos CAPTCHA conhecido na página (reCAPTCHA, hCaptcha ou Turnstile).',
    )
  })

  it('avaliação antiga (colunas vazias): revisão igual a hoje', () => {
    const { revisao } = resultadoDaAvaliacao({ ...base, requisitosNaoAplicaveis: [], indicios: [] })
    expect(revisao.map((r) => r.numero)).toEqual(itensDeRevisao([]).map((r) => r.numero))
    expect(revisao.every((r) => r.naoSeAplica === null && r.indicio === null)).toBe(true)
  })

  it('Json da coluna fora do formato não quebra', () => {
    expect(() =>
      resultadoDaAvaliacao({ ...base, requisitosNaoAplicaveis: [], indicios: 'x' }),
    ).not.toThrow()
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
