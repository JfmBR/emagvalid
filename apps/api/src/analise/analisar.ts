import { AxeBuilder } from '@axe-core/playwright'
import { chromium } from 'playwright'

export interface Ocorrencia {
  seletor: string
  trecho: string
}

export interface Violacao {
  regra: string
  impacto: string | null
  ajuda: string
  ocorrencias: Ocorrencia[]
}

// Abre a página no Chromium, roda o axe-core e devolve só as violações.
// shortcut: não valida a URL (SSRF, RNF10); a validação entra antes da rota POST /api/avaliacoes (Passo 6).
export async function analisar(url: string, limiteMs = 30_000): Promise<Violacao[]> {
  const navegador = await chromium.launch()
  try {
    // o axe-core exige uma página criada por um contexto
    const pagina = await (await navegador.newContext()).newPage()
    await pagina.goto(url, { timeout: limiteMs, waitUntil: 'load' })
    const { violations } = await new AxeBuilder({ page: pagina }).analyze()

    return violations.map((v) => ({
      regra: v.id,
      impacto: v.impact ?? null,
      ajuda: v.help,
      // seletor é o caminho do elemento na página; trecho é o HTML dele (mostrar sempre como texto, RNF10)
      ocorrencias: v.nodes.map((n) => ({ seletor: n.target.join(' '), trecho: n.html })),
    }))
  } finally {
    await navegador.close()
  }
}
