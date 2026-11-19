// o código dentro de evaluate roda no navegador e usa document e window
/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const helena = { nome: 'Helena Souza', email: 'helena@empresa.com.br' }

async function semViolacoesSerias(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const graves = resultado.violations.filter(
    (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
  )
  expect(graves).toEqual([])
}

const item = (id: string, dados: object = {}) => ({
  id,
  url: `https://www.loja.com.br/pagina-com-um-endereco-bem-comprido/${id}`,
  status: 'CONCLUIDA',
  criadaEm: '2026-11-19T15:02:00.000Z',
  nota: 76,
  etapa: null,
  posicaoNaFila: null,
  mensagemErro: null,
  ...dados,
})
const historico = {
  avaliacoes: [
    item('a3', { status: 'NA_FILA', nota: null, posicaoNaFila: 1 }),
    item('a2', { status: 'ANALISANDO', nota: null, etapa: 2 }),
    item('a1'),
    item('a0', { status: 'ERRO', nota: null }),
  ],
  proximo: null,
}

// API falsa: o e2e roda só o front-end. POST cria a lista; GET devolve o histórico.
async function simularApi(page: Page) {
  const enviados: unknown[] = []
  await page.route('**/api/auth/eu', (rota) =>
    rota.fulfill({ status: 200, json: { usuario: helena } }),
  )
  await page.route('**/api/avaliacoes', (rota) => {
    if (rota.request().method() === 'POST') {
      enviados.push(rota.request().postDataJSON())
      return rota.fulfill({
        status: 202,
        json: { avaliacoes: [{ id: 'a1' }, { id: 'a2' }, { id: 'a3' }] },
      })
    }
    return rota.fulfill({ status: 200, json: historico })
  })
  return enviados
}

test('só com teclado: três links na Tela 3 e o acompanhamento no histórico', async ({ page }) => {
  const enviados = await simularApi(page)
  await page.goto('/avaliacoes/nova')
  const primeiro = page.getByLabel('Endereço da página (URL)')
  await primeiro.focus()
  await page.keyboard.type('https://www.loja.com.br/a')

  // Tab até o "+", Enter acrescenta e leva o foco ao campo novo
  for (const [numero, endereco] of [
    [2, 'https://www.loja.com.br/b'],
    [3, 'https://www.loja.com.br/c'],
  ] as const) {
    await page.getByRole('button', { name: '+ Adicionar outra página' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByLabel(`Endereço da página ${numero} (URL)`)).toBeFocused()
    await page.keyboard.type(endereco)
  }
  await expect(page.getByText('3 de 10 páginas')).toBeVisible()
  await semViolacoesSerias(page)

  await page.getByRole('button', { name: 'Avaliar páginas' }).focus()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL('/avaliacoes')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Histórico de avaliações')
  await expect(page.getByText('Analisando (passo 2 de 3)')).toBeVisible()
  expect(enviados).toEqual([
    {
      urls: ['https://www.loja.com.br/a', 'https://www.loja.com.br/b', 'https://www.loja.com.br/c'],
    },
  ])
  await semViolacoesSerias(page)
})

for (const [tema, salvo] of Object.entries({
  claro: { 'acessaweb-tema': 'claro' },
  escuro: { 'acessaweb-tema': 'escuro' },
  contraste: { 'acessaweb-contraste': 'sim' },
})) {
  test(`histórico no tema ${tema} e com zoom de 200%: sem violação séria nem rolagem lateral`, async ({
    page,
  }) => {
    await page.addInitScript((itens) => {
      for (const [chave, valor] of Object.entries(itens)) localStorage.setItem(chave, valor)
    }, salvo)
    await simularApi(page)
    await page.setViewportSize({ width: 640, height: 900 })
    await page.goto('/avaliacoes')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Histórico de avaliações')
    await expect(page.locator('html')).toHaveAttribute('data-theme', tema)
    await expect(page.getByText('Concluída')).toBeVisible()
    await semViolacoesSerias(page)

    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(sobra).toBeLessThanOrEqual(0)
  })
}
