import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Sem API rodando: por padrão /api/saude responde 503; os testes que precisam de outra resposta registram a sua
test.beforeEach(async ({ page }) => {
  await page.route('**/api/saude', (rota) => rota.fulfill({ status: 503 }))
})

test('tela inicial sem violações sérias de acessibilidade', async ({ page }) => {
  await page.goto('/')
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const graves = resultado.violations.filter(
    (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
  )
  expect(graves).toEqual([])
})

test('link pular para o conteúdo leva o foco ao main', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#conteudo')).toBeFocused()
})

test('sem a API, a tela avisa que ela está indisponível', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText(/API indisponível/)
})

test('com a API no ar, a tela diz que ela está conectada', async ({ page }) => {
  await page.route('**/api/saude', (rota) => rota.fulfill({ json: { status: 'ok' } }))
  await page.goto('/')
  await expect(page.getByRole('status')).toHaveText('API conectada.')
})
