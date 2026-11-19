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

// API falsa: o e2e roda só o front-end. Ninguém entrou até o cadastro ou o login darem certo.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/eu', (rota) => rota.fulfill({ status: 401, json: {} }))
})

test('cadastro com erros, entrar e privacidade sem violações sérias', async ({ page }) => {
  await page.route('**/api/auth/cadastro', (rota) =>
    rota.fulfill({
      status: 400,
      json: {
        campos: {
          nome: 'Digite seu nome.',
          email: 'Digite um e-mail válido, como nome@empresa.com.br.',
          senha: 'A senha precisa ter pelo menos 8 caracteres.',
        },
      },
    }),
  )
  await page.goto('/cadastro')
  await page.getByRole('button', { name: 'Criar conta' }).click()
  await expect(page.getByLabel('Nome')).toBeFocused()
  await semViolacoesSerias(page)

  await page.goto('/entrar')
  await semViolacoesSerias(page)

  await page.goto('/privacidade')
  await semViolacoesSerias(page)
})

test('só com teclado: criar conta, sair e entrar de novo', async ({ page }) => {
  await page.route('**/api/auth/cadastro', (rota) =>
    rota.fulfill({ status: 201, json: { usuario: helena } }),
  )
  await page.route('**/api/auth/sair', (rota) => rota.fulfill({ status: 204 }))
  await page.route('**/api/auth/entrar', (rota) =>
    rota.fulfill({ status: 200, json: { usuario: helena } }),
  )
  const menu = page.getByRole('navigation', { name: 'Principal' })

  await page.goto('/cadastro')
  await page.getByLabel('Nome').focus()
  await page.keyboard.type(helena.nome)
  await page.keyboard.press('Tab')
  await page.keyboard.type(helena.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type('Senha-forte-1')
  await page.keyboard.press('Enter')
  await expect(menu.getByText('Olá, Helena')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()

  await menu.getByRole('button', { name: 'Sair' }).focus()
  await page.keyboard.press('Enter')
  const entrar = menu.getByRole('link', { name: 'Entrar' })
  await expect(entrar).toBeVisible()

  await entrar.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL('/entrar')
  await page.keyboard.press('Tab')
  await page.keyboard.type(helena.email)
  await page.keyboard.press('Tab')
  await page.keyboard.type('Senha-forte-1')
  await page.keyboard.press('Enter')
  await expect(menu.getByText('Olá, Helena')).toBeVisible()
})

test('só com teclado: abrir Minha conta e excluir a conta com a senha', async ({ page }) => {
  await page.route('**/api/auth/eu', (rota) =>
    rota.fulfill({ status: 200, json: { usuario: helena } }),
  )
  let senhaEnviada: unknown
  await page.route('**/api/auth/excluir-conta', (rota) => {
    senhaEnviada = rota.request().postDataJSON()?.senha
    return rota.fulfill({ status: 204 })
  })
  const menu = page.getByRole('navigation', { name: 'Principal' })

  await page.goto('/')
  await menu.getByRole('link', { name: 'Minha conta' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Minha conta' })).toBeFocused()
  await semViolacoesSerias(page)

  await page.getByLabel('Digite sua senha para confirmar').focus()
  await page.keyboard.type('Senha-forte-1')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Conta excluída' })).toBeFocused()
  expect(senhaEnviada).toBe('Senha-forte-1')
  await expect(menu.getByRole('link', { name: 'Entrar' })).toBeVisible()
  await semViolacoesSerias(page)
})
