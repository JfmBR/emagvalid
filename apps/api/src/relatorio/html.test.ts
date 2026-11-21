import { describe, expect, it } from 'vitest'
import { resultadoDaAvaliacao } from '../analise/resultado.js'
import { dataBrasilia, htmlDoRelatorio, rodapeDoRelatorio } from './html.js'

const falha = (requisitoEmag: string, seletor = 'img', trecho: string | null = '<img>') => ({
  requisitoEmag,
  descricao: 'Imagens devem ter texto alternativo',
  seletor,
  trecho,
  revisaoHumana: false,
})

const avaliacao = {
  nota: 57 as number | null,
  requisitosAplicaveis: ['1.8', '3.1', '3.6'],
  requisitosEmDuvida: [],
  revisados: [] as string[],
  requisitosNaoAplicaveis: [] as string[],
  indicios: [] as unknown,
  falhas: [falha('1.8', 'main'), falha('3.6')],
}

function gerar(mudancas: Partial<typeof avaliacao> = {}, nomeDaConta = 'Helena Souza') {
  return htmlDoRelatorio({
    pagina: 'https://padariadabia.com.br/contato',
    nomeDaConta,
    avaliadaEm: new Date('2026-11-19T17:32:00Z'),
    resultado: resultadoDaAvaliacao({ ...avaliacao, ...mudancas }),
  })
}

describe('htmlDoRelatorio', () => {
  it('trecho e seletor saem escapados', () => {
    const html = gerar({
      falhas: [falha('3.6', `a[title='"']`, '</style><script>alert("x")</script>')],
    })

    expect(html).not.toContain('<script>alert')
    expect(html).not.toContain('</style><script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('a[title=&#39;&quot;&#39;]')
  })

  it('nome da conta e página também são escapados', () => {
    const html = gerar({}, '<b>Helena</b>')

    expect(html).not.toContain('<b>Helena</b>')
    expect(html).toContain('&lt;b&gt;Helena&lt;/b&gt;')
  })

  it('traz o cabeçalho, a data de Brasília e o aviso de que não é certificação', () => {
    const html = gerar()

    expect(html).toContain('AcessaWeb · Relatório de acessibilidade · eMAG 3.1')
    expect(html).toContain('https://padariadabia.com.br/contato')
    expect(html).toContain('Avaliação de 19/11/2026, 14:32 · Preparado para: Helena Souza')
    expect(html).toContain(
      'Esta nota é automática e não é certificação. Parte do eMAG só uma pessoa confere (seção "Revisão humana").',
    )
  })

  it('seções na ordem do plano', () => {
    const html = gerar()
    const posicoes = [
      '<h2>Resumo</h2>',
      '<h2>Falhas, da mais urgente para a menos</h2>',
      '<h2>Revisão humana</h2>',
      '<h2>Como chegamos na nota</h2>',
    ].map((titulo) => html.indexOf(titulo))

    expect(posicoes.every((p) => p >= 0)).toBe(true)
    expect([...posicoes].sort((a, b) => a - b)).toEqual(posicoes)
  })

  it('resumo com nota, falhas por prioridade e revisão', () => {
    const html = gerar({ revisados: ['1.1', '1.6'] })

    expect(html).toContain('Nota 57/100')
    expect(html).toContain('2 falhas em 2 recomendações: 1 de prioridade alta, 0 média, 1 baixa')
    expect(html).toContain('Revisão humana: 2 de 16 itens conferidos')
  })

  it('caixas na ordem dos cartões: alta antes de baixa', () => {
    const html = gerar()

    expect(html.indexOf('3.6 Fornecer alternativa em texto')).toBeLessThan(
      html.indexOf('1.8 Dividir as áreas de informação'),
    )
    expect(html).toContain('Prioridade alta')
    expect(html).toContain('Por que é falha:')
    expect(html).toContain('Como corrigir:')
    expect(html).toContain('Onde (1 ocorrência):')
  })

  it('trecho vazio não vira caixa de código vazia, como na Tela 5', () => {
    const html = gerar({ falhas: [falha('3.6', 'img', ''), falha('3.6', 'img.b', null)] })

    expect(html).not.toContain('<pre></pre>')
  })

  it('sem falhas diz "Nenhuma falha automática encontrada."', () => {
    expect(gerar({ falhas: [] })).toContain('Nenhuma falha automática encontrada.')
  })

  it('sem nota omite "Como chegamos na nota" e diz "Sem nota"', () => {
    const html = gerar({ nota: null })

    expect(html).toContain('Sem nota (avaliação anterior ao cálculo da nota)')
    expect(html).not.toContain('Como chegamos na nota')
  })

  it('revisão mostra ☑ conferido e ☐ a conferir conforme feita', () => {
    const html = gerar({ revisados: ['1.1'] })

    expect(html).toMatch(/☑ conferido[\s\S]*1\.1/)
    expect(html).toContain('☐ a conferir')
  })

  it('K de T conta só a lista principal; o grupo vem depois, com subtítulo e motivo', () => {
    const html = gerar({ requisitosNaoAplicaveis: ['1.6'], revisados: ['1.6', '1.1'] })

    expect(html).toContain('Revisão humana: 1 de 15 itens conferidos')
    expect(html).toContain('Provavelmente não se aplicam nesta página')
    expect(html.indexOf('Não achamos tabela')).toBeGreaterThan(
      html.indexOf('Provavelmente não se aplicam'),
    )
  })

  it('sem grupo não mostra o subtítulo', () => {
    expect(gerar()).not.toContain('Provavelmente não se aplicam')
  })

  it('indício com exemplos escapados', () => {
    const html = gerar({
      indicios: [
        {
          numero: '1.9',
          total: 1,
          exemplos: [{ seletor: 'a', trecho: '<a target="_blank"><script>x</script></a>' }],
        },
      ],
    })

    expect(html).toContain('Indício: 1 link abre em nova aba ou janela sem aviso no texto.')
    expect(html).toContain('Onde achamos:')
    expect(html).toContain('&lt;script&gt;')
    expect(html).not.toContain('<script>x')
  })

  it('trecho longo quebra a linha', () => {
    expect(gerar()).toContain('overflow-wrap: anywhere')
  })

  it('não carrega nada de fora (fonte, imagem, CSS)', () => {
    const html = gerar()

    expect(html).not.toMatch(/@import|<link|src="http|url\(/)
  })
})

describe('rodapeDoRelatorio', () => {
  it('tem a data, o aviso, pageNumber e totalPages', () => {
    const rodape = rodapeDoRelatorio(new Date('2026-11-19T17:32:00Z'))

    expect(rodape).toContain('Gerado pelo AcessaWeb em 19/11/2026, 14:32')
    expect(rodape).toContain('Nota automática, não é certificação')
    expect(rodape).toContain(
      'Página <span class="pageNumber"></span> de <span class="totalPages"></span>',
    )
  })
})

describe('dataBrasilia', () => {
  it('converte para o horário de Brasília', () => {
    expect(dataBrasilia(new Date('2026-11-20T01:30:00Z'))).toBe('19/11/2026, 22:30')
  })
})
