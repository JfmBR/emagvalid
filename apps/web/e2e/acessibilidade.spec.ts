// o código dentro de evaluate roda no navegador e usa document, window e getComputedStyle
/// <reference lib="dom" />
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Telas que não precisam de conta; a API não roda no e2e (ninguém entrou)
const telas = ['/', '/entrar', '/cadastro', '/privacidade', '/acessibilidade']

// Cada tema como o navegador guarda (apps/web/src/tema.ts)
const temas: Record<string, Record<string, string>> = {
  claro: { 'acessaweb-tema': 'claro' },
  escuro: { 'acessaweb-tema': 'escuro' },
  contraste: { 'acessaweb-contraste': 'sim' },
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/eu', (rota) => rota.fulfill({ status: 401, json: {} }))
})

async function semViolacoesSerias(page: Page) {
  const resultado = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  const graves = resultado.violations.filter(
    (violacao) => violacao.impact === 'serious' || violacao.impact === 'critical',
  )
  expect(graves).toEqual([])
}

for (const [nome, salvo] of Object.entries(temas)) {
  test(`tema ${nome}: nenhuma tela tem violação séria`, async ({ page }) => {
    await page.addInitScript((itens) => {
      for (const [chave, valor] of Object.entries(itens)) localStorage.setItem(chave, valor)
    }, salvo)
    for (const tela of telas) {
      await page.goto(tela)
      await expect(page.locator('html')).toHaveAttribute('data-theme', nome)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await semViolacoesSerias(page)
    }
  })
}

// eMAG, recomendação 4.3: legível e funcional com zoom de 200% (1280 px de tela ÷ 2)
test('zoom de 200%: nenhuma tela rola na horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 })
  for (const tela of telas) {
    await page.goto(tela)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(sobra, tela).toBeLessThanOrEqual(0)
  }
})

// Com a conta aberta o topo ganha "Olá" e "Sair": também não pode empurrar a tela para o lado
test('zoom de 200% com a conta aberta: nenhuma tela rola na horizontal', async ({ page }) => {
  const helena = { nome: 'Helena Souza', email: 'helena@empresa.com.br' }
  await page.route('**/api/auth/eu', (rota) =>
    rota.fulfill({ status: 200, json: { usuario: helena } }),
  )
  await page.route('**/api/avaliacoes/a1', (rota) =>
    rota.fulfill({
      status: 200,
      json: {
        avaliacao: {
          id: 'a1',
          url: 'https://www.loja.com.br/contato',
          urlFinal: null,
          status: 'ANALISANDO',
          etapa: 2,
          posicaoNaFila: null,
          paginaGrande: false,
          mensagemErro: null,
          falhas: [],
        },
      },
    }),
  )
  await page.setViewportSize({ width: 640, height: 900 })
  for (const tela of ['/', '/avaliacoes/nova', '/avaliacoes/a1']) {
    await page.goto(tela)
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(sobra, tela).toBeLessThanOrEqual(0)
  }
})

// eMAG 4.1: Alt + número pela página (no Linux o accesskey perde para a troca de aba)
test('atalhos da barra: Alt + 4 e Alt + Shift + 1 levam o foco, com contorno visível', async ({
  page,
}) => {
  await page.goto('/acessibilidade')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.keyboard.press('Alt+4')
  const rodape = page.locator('#rodape')
  await expect(rodape).toBeFocused()
  await expect(rodape).not.toHaveCSS('outline-style', 'none')
  await page.keyboard.press('Alt+Shift+1')
  await expect(page.locator('#conteudo')).toBeFocused()

  // com o mouse, o link também mostra para onde o foco foi
  await page.getByRole('link', { name: 'Ir para o rodapé [4]' }).click()
  await expect(rodape).toBeFocused()
  await expect(rodape).not.toHaveCSS('outline-style', 'none')
})

test('botão e link respondem ao mouse', async ({ page }) => {
  await page.goto('/')
  const fundo = (seletor: string) =>
    page
      .locator(seletor)
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor)
  const principal = page.getByRole('link', { name: 'Criar conta' })
  await expect(principal).toBeVisible()
  const antes = await principal.evaluate((el) => getComputedStyle(el).backgroundColor)
  await principal.hover()
  await expect
    .poll(() => principal.evaluate((el) => getComputedStyle(el).backgroundColor))
    .not.toBe(antes)

  const texto = page.getByRole('button', { name: 'Alto contraste' })
  const semMouse = await fundo('.barra-opcoes .btn.txt')
  await texto.hover()
  await expect.poll(() => fundo('.barra-opcoes .btn.txt')).not.toBe(semMouse)
})

test('só com teclado: liga o alto contraste pela barra', async ({ page }) => {
  await page.goto('/')
  const botao = page.getByRole('button', { name: 'Alto contraste' })
  // atalhos 1, 2 e 4 vêm antes dos botões na barra
  for (let i = 0; i < 4; i++) await page.keyboard.press('Tab')
  await expect(botao).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'contraste')
  await expect(botao).toHaveAttribute('aria-pressed', 'true')
})

test('botão ligado da barra se distingue do desligado, sem o mouse em cima', async ({ page }) => {
  await page.goto('/')
  const borda = (nome: string) =>
    page.getByRole('button', { name: nome }).evaluate((el) => getComputedStyle(el).borderTopColor)
  await page.getByRole('button', { name: 'Modo escuro' }).click()
  await page.mouse.move(0, 600)
  // depois do clique o tema é escuro: compara os dois botões no mesmo tema
  expect(await borda('Modo escuro')).not.toBe(await borda('Alto contraste'))

  // ligado, ele também responde ao mouse
  const ligado = page.getByRole('button', { name: 'Modo escuro' })
  await expect(ligado).toHaveCSS('text-decoration-line', 'none')
  await ligado.hover()
  await expect(ligado).toHaveCSS('text-decoration-line', 'underline')
})

test.describe('com o alto contraste salvo', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('acessaweb-contraste', 'sim'))
  })

  test('link com cara de botão de texto ("Entrar") fica sublinhado (eMAG 4.2)', async ({
    page,
  }) => {
    await page.goto('/')
    const entrar = page.getByRole('navigation', { name: 'Principal' }).getByRole('link')
    await expect(entrar).toHaveCSS('text-decoration-line', 'underline')
  })

  test('o botão principal também responde ao mouse', async ({ page }) => {
    await page.goto('/')
    const principal = page.getByRole('link', { name: 'Criar conta' })
    await expect(principal).toHaveCSS('text-decoration-line', 'none')
    await principal.hover()
    await expect(principal).toHaveCSS('text-decoration-line', 'underline')
  })

  test('vence o sistema escuro: fundo preto', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/')
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(0, 0, 0)')
  })

  test('o tema entra antes do React: sem piscar no tema errado', async ({ page }) => {
    // sem o código do app, só o script do <head> pode aplicar o tema
    await page.route('**/src/main.tsx', (rota) => rota.abort())
    await page.goto('/')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'contraste')
  })
})
