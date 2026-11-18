import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Sem API rodando: por padrão ninguém entrou (/api/auth/eu responde 401)
test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/eu', (rota) => rota.fulfill({ status: 401, json: {} }))
})

test('tela inicial sem violações sérias de acessibilidade', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Criar conta' })).toBeVisible()
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const graves = resultado.violations.filter(
    (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
  )
  expect(graves).toEqual([])
})

test('o primeiro Tab cai em "Ir para o conteúdo [1]", que leva o foco ao main', async ({
  page,
}) => {
  await page.goto('/')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Ir para o conteúdo [1]' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#conteudo')).toBeFocused()
})
