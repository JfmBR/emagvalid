import { describe, expect, it, vi } from 'vitest'
import { gerarPdf, GeradorOcupado } from './pdf.js'

// Chromium que nunca termina de abrir (pouca memória no Render, por exemplo)
vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn<() => Promise<never>>(() => new Promise(() => {})),
  },
}))

describe('gerarPdf com o Chromium travado ao abrir', () => {
  it('o teto de tempo vale também para abrir, e a trava é liberada', async () => {
    await expect(gerarPdf('<p>x</p>', '', 50)).rejects.toThrow('O PDF passou do teto de tempo')

    // o próximo pedido não recebe "outro PDF está sendo gerado"
    const segundo = gerarPdf('<p>x</p>', '', 50)
    await expect(segundo).rejects.toThrow('O PDF passou do teto de tempo')
    await expect(segundo).rejects.not.toBeInstanceOf(GeradorOcupado)
  })
})
