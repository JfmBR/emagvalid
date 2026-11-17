import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/saude', (rota) => rota.fulfill({ status: 503 }))
})

test('endereço desconhecido mostra a página não encontrada, sem violações sérias', async ({
  page,
}) => {
  await page.goto('/nao-existe')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página não encontrada')
  await expect(page).toHaveTitle('Página não encontrada · AcessaWeb')
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const graves = resultado.violations.filter(
    (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
  )
  expect(graves).toEqual([])
})

test('só com teclado, voltar ao início leva o foco ao título da tela nova', async ({ page }) => {
  await page.goto('/nao-existe')
  const voltar = page.getByRole('link', { name: 'Voltar para o início' })
  await voltar.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect(page).toHaveTitle('AcessaWeb')
})
