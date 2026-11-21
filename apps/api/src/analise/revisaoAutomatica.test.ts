import { chromium, type Page } from 'playwright'
import { describe, expect, it } from 'vitest'
import {
  lerRevisaoAutomatica,
  NAO_APLICAVEIS_POSSIVEIS,
  validarIndicios,
  validarNaoAplicaveis,
} from './revisaoAutomatica.js'

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

  it('validarIndicios não deixa meio emoji (surrogate sozinho), que o jsonb do Postgres recusa', () => {
    const r = validarIndicios([
      {
        numero: '1.9',
        total: 1,
        // o emoji ocupa as posições 999 e 1000: o corte em 1000 parte o par
        exemplos: [{ seletor: '\ud83d', trecho: `${'a'.repeat(999)}😀` }],
      },
    ])
    expect(r[0]?.exemplos[0]?.seletor.isWellFormed()).toBe(true)
    expect(r[0]?.exemplos[0]?.trecho.isWellFormed()).toBe(true)
    expect(r[0]?.exemplos[0]?.trecho).toHaveLength(1000)
  })

  it('validarNaoAplicaveis aceita só os 9 possíveis, sem repetição, na ordem do eMAG', () => {
    expect(validarNaoAplicaveis(['6.5', '1.6', '6.5', '3.6', 7])).toEqual(['1.6', '6.5'])
    expect(validarNaoAplicaveis('x')).toEqual([])
  })
})

// Página falsa: só o que lerRevisaoAutomatica usa de Page e Frame
function paginaFalsa(frames: { url: string; evaluate: () => Promise<unknown> }[]): Page {
  const lista = frames.map((f) => ({
    url: () => f.url,
    isDetached: () => false,
    parentFrame: () => null,
    evaluate: f.evaluate,
  }))
  return { frames: () => lista } as unknown as Page
}
const nadaAchado = {
  achou: { tabela: false, documento: false, audio: false, video: false, formulario: false },
  indicios: [],
}

describe('lerRevisaoAutomatica', { timeout: 20_000 }, () => {
  it('frame chrome-error:// (iframe que não carregou) não é lido nem conta como falha', async () => {
    const pagina = paginaFalsa([
      { url: 'http://127.0.0.1/', evaluate: async () => nadaAchado },
      {
        url: 'chrome-error://chromewebdata/',
        evaluate: async () => {
          throw new Error('não devia ler')
        },
      },
    ])
    expect((await lerRevisaoAutomatica(pagina)).naoAplicaveis).toEqual(NAO_APLICAVEIS_POSSIVEIS)
  })

  it('erro num frame carregado: nada se afirma como não aplicável', async () => {
    const pagina = paginaFalsa([
      { url: 'http://127.0.0.1/', evaluate: async () => nadaAchado },
      {
        url: 'http://127.0.0.1/filho',
        evaluate: async () => {
          throw new Error('sabotado')
        },
      },
    ])
    expect((await lerRevisaoAutomatica(pagina)).naoAplicaveis).toEqual([])
  })

  it('axe da página que falha no setup e no getSelector: caminho vazio, trecho e grupo continuam', async () => {
    // sem AxeBuilder: o window.axe da página não é trocado pelo axe de verdade
    const navegador = await chromium.launch()
    try {
      const pagina = await navegador.newPage()
      await pagina.setContent(`<!doctype html><html lang="pt-BR"><title>T</title><body>
<a href="/x" target="_blank">x</a>
<script>
  window.axe = { setup() { throw 1 }, teardown() { throw 1 }, utils: { getSelector() { throw 1 } } }
</script></body></html>`)
      const r = await lerRevisaoAutomatica(pagina)
      expect(r.indicios).toEqual([
        {
          numero: '1.9',
          total: 1,
          exemplos: [{ seletor: '', trecho: expect.stringContaining('target="_blank"') }],
        },
      ])
      expect(r.naoAplicaveis).toEqual(NAO_APLICAVEIS_POSSIVEIS)
    } finally {
      await navegador.close()
    }
  })
})
