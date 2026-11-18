import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const helena = { nome: 'Helena Souza', email: 'helena@empresa.com.br' }
const url = 'https://www.loja.com.br/contato'

async function semViolacoesSerias(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const graves = resultado.violations.filter(
    (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
  )
  expect(graves).toEqual([])
}

const avaliacao = {
  id: 'a1',
  url,
  urlFinal: null,
  status: 'ANALISANDO',
  etapa: 2,
  posicaoNaFila: null,
  paginaGrande: false,
  mensagemErro: null,
  falhas: [],
}

// API falsa: o e2e roda só o front-end. Helena já entrou; `resposta` muda a avaliação com o tempo.
async function simularApi(page: Page, resposta: () => object) {
  await page.route('**/api/auth/eu', (rota) =>
    rota.fulfill({ status: 200, json: { usuario: helena } }),
  )
  await page.route('**/api/avaliacoes', (rota) =>
    rota.fulfill({ status: 202, json: { avaliacao: { id: 'a1' } } }),
  )
  await page.route('**/api/avaliacoes/a1', (rota) =>
    rota.fulfill({ status: 200, json: { avaliacao: resposta() } }),
  )
}

test('só com teclado: pedir a avaliação, acompanhar e ver a análise concluída', async ({
  page,
}) => {
  let atual: object = avaliacao
  await simularApi(page, () => atual)

  await page.goto('/avaliacoes/nova')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Qual página você quer avaliar?')
  await semViolacoesSerias(page)

  // Tab até "Ir para o conteúdo [1]", Enter leva ao conteúdo e o próximo Tab chega ao campo
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo [1]' })).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Endereço da página (URL)')).toBeFocused()
  await page.keyboard.type(url)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('button', { name: 'Avaliar página' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page).toHaveURL('/avaliacoes/a1')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Avaliando a página')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect(page.locator('li[aria-current="step"]')).toContainText(
    'Verificando as recomendações do eMAG 3.1',
  )
  await semViolacoesSerias(page)

  atual = {
    ...avaliacao,
    status: 'CONCLUIDA',
    etapa: null,
    falhas: [{ requisitoEmag: '3.5.1' }, { requisitoEmag: '3.5.1' }, { requisitoEmag: '1.2' }],
  }
  const titulo = page.getByRole('heading', { level: 1 })
  await expect(titulo).toHaveText('Análise concluída', { timeout: 5_000 })
  await expect(titulo).toBeFocused()
  await expect(page.getByText('Encontramos 3 falhas em 2 recomendações do eMAG 3.1.')).toBeVisible()
  await semViolacoesSerias(page)

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Nova avaliação' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/avaliacoes/nova')
})

test('erro da análise: mensagem, sem violações sérias e volta com o endereço preenchido', async ({
  page,
}) => {
  await simularApi(page, () => ({
    ...avaliacao,
    status: 'ERRO',
    etapa: null,
    mensagemErro: 'Não conseguimos abrir essa página. Confira o endereço e tente de novo.',
  }))

  await page.goto('/avaliacoes/a1')
  const titulo = page.getByRole('heading', { level: 1 })
  await expect(titulo).toHaveText('Não conseguimos avaliar essa página.')
  await expect(titulo).toBeFocused()
  await expect(page.getByText('Não conseguimos abrir essa página.')).toBeVisible()
  await semViolacoesSerias(page)

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Corrigir o endereço' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByLabel('Endereço da página (URL)')).toHaveValue(url)
})
