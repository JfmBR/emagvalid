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
  concluidaEm: null,
  resultado: null,
}

// no formato do GET da API (apps/api/src/analise/resultado.ts)
const resultado = {
  nota: 57,
  verificacoes: [
    {
      numero: '3.1',
      nome: 'Identificar o idioma principal da página',
      prioridade: 'media',
      peso: 2,
      aprovada: true,
    },
    {
      numero: '3.3',
      nome: 'Oferecer um título descritivo e informativo à página',
      prioridade: 'media',
      peso: 2,
      aprovada: true,
    },
    {
      numero: '3.6',
      nome: 'Fornecer alternativa em texto para as imagens do sítio',
      prioridade: 'alta',
      peso: 3,
      aprovada: false,
    },
  ],
  cartoes: [
    {
      numero: '3.6',
      nome: 'Fornecer alternativa em texto para as imagens do sítio',
      link: 'https://emag.governoeletronico.gov.br/#s3.3',
      prioridade: 'alta',
      porque: 'Quem usa leitor de tela não sabe o que a imagem mostra.',
      exemplo: '<img src="logo.png" alt="Logo da Prefeitura">',
      revisaoHumana: false,
      ocorrencias: [
        {
          descricao: 'Imagens devem ter texto alternativo',
          seletor: 'img.logo',
          trecho: '<img class="logo" src="logo.png">',
        },
      ],
    },
    {
      numero: '1.8',
      nome: 'Dividir as áreas de informação',
      link: 'https://emag.governoeletronico.gov.br/#s3.1',
      prioridade: 'baixa',
      porque: 'Sem áreas marcadas, o leitor de tela lê tudo em sequência.',
      exemplo: '<main>...</main>',
      revisaoHumana: false,
      ocorrencias: [
        { descricao: 'Conteúdo fora de região', seletor: 'div.topo', trecho: '<div class="topo">' },
      ],
    },
  ],
  revisao: [
    {
      numero: '4.4',
      nome: 'Possibilitar que o elemento com foco seja visualmente evidente',
      motivo: 'fixa',
      conferir: 'Navegue com Tab.',
      feita: false,
    },
    {
      numero: '4.1',
      nome: 'Oferecer contraste mínimo entre plano de fundo e primeiro plano',
      motivo: 'duvida',
      conferir: 'Confira à mão.',
      feita: false,
    },
  ],
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
  await page.route('**/api/avaliacoes/a1/revisao', (rota) => rota.fulfill({ status: 204 }))
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
    concluidaEm: '2026-11-19T14:32:00.000Z',
    resultado,
  }
  // o foco vai para o título, e o leitor de tela ouve a nota junto
  const titulo = page.getByRole('heading', { level: 1 })
  // o Chrome põe um espaço antes do trecho só para leitor ("avaliação : nota"); na fala é a mesma pausa
  await expect(titulo).toHaveAccessibleName(/^Resultado da avaliação ?: nota 57 de 100$/, {
    timeout: 5_000,
  })
  await expect(titulo).toBeFocused()
  await expect(
    page.getByText('Não é certificação. A conclusão de conformidade é sua.'),
  ).toBeVisible()
  await semViolacoesSerias(page)

  // Tab abre "Como chegamos" pelo teclado; o próximo Tab para na tabela, e o seguinte, na aba ativa
  await page.keyboard.press('Tab')
  await expect(page.getByText('Como chegamos a 57')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByText('100 × 4 ÷ 7 = 57')).toBeVisible()
  await semViolacoesSerias(page)
  await page.keyboard.press('Tab')
  await expect(page.getByRole('region', { name: 'Conta da nota' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('tab', { name: 'Falhas automáticas (2)' })).toBeFocused()

  // seta troca de aba; Tab entra no painel e Espaço marca a primeira caixa
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('tab', { name: 'Revisão humana (2)' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('tabpanel')).toBeFocused()
  await page.keyboard.press('Tab')
  const caixa = page.getByRole('checkbox', { name: /4\.4/ })
  await expect(caixa).toBeFocused()
  await page.keyboard.press('Space')
  await expect(caixa).toBeChecked()
  await semViolacoesSerias(page)

  await page.getByRole('link', { name: 'Nova avaliação' }).focus()
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

// Tela 5 aberta por inteiro (conta, ocorrências e as duas abas) nos temas da barra e com zoom de 200%
for (const [tema, salvo] of Object.entries({
  escuro: { 'acessaweb-tema': 'escuro' },
  contraste: { 'acessaweb-contraste': 'sim' },
})) {
  test(`Tela 5 no tema ${tema} e com zoom de 200%: sem violação séria nem rolagem lateral`, async ({
    page,
  }) => {
    await page.addInitScript((itens) => {
      for (const [chave, valor] of Object.entries(itens)) localStorage.setItem(chave, valor)
    }, salvo)
    await simularApi(page, () => ({
      ...avaliacao,
      status: 'CONCLUIDA',
      etapa: null,
      concluidaEm: '2026-11-19T14:32:00.000Z',
      resultado,
    }))
    await page.setViewportSize({ width: 640, height: 900 })
    await page.goto('/avaliacoes/a1')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Resultado da avaliação')
    await expect(page.locator('html')).toHaveAttribute('data-theme', tema)

    await page.getByText('Como chegamos a 57').click()
    for (const resumo of await page.getByText(/^Onde está/).all()) await resumo.click()
    await semViolacoesSerias(page)
    await page.getByRole('tab', { name: 'Revisão humana (2)' }).click()
    await semViolacoesSerias(page)

    const sobra = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(sobra).toBeLessThanOrEqual(0)
  })
}
