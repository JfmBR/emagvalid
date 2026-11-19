import { chromium } from 'playwright'
import { ambienteDoNavegador, ARGS_SEM_REDE } from '../analise/analisar.js'

export class GeradorOcupado extends Error {}

// shortcut: trava em memória de uma instância só, como a fila; com mais instâncias ou pouca memória, passar o PDF para a fila
let gerando = false

// Gera o PDF do HTML do relatório (relatorio/html.ts) na hora do pedido, um por vez.
// O Chromium roda sem JavaScript e sem rede: o HTML traz trechos da página avaliada.
export async function gerarPdf(html: string, rodape: string, limiteMs = 20_000): Promise<Buffer> {
  if (gerando) throw new GeradorOcupado('Outro PDF está sendo gerado')
  gerando = true
  let relogio: NodeJS.Timeout | undefined
  const navegador = await chromium
    .launch({ env: ambienteDoNavegador(process.env), args: ARGS_SEM_REDE })
    .catch((erro: unknown) => {
      gerando = false
      throw erro
    })
  try {
    // o teto fecha o navegador, e o page.pdf que estiver esperando falha na hora
    const teto = new Promise<never>((_, falhar) => {
      relogio = setTimeout(() => {
        navegador.close().catch(() => {})
        falhar(new Error('O PDF passou do teto de tempo'))
      }, limiteMs)
    })
    const gerar = async () => {
      const contexto = await navegador.newContext({ javaScriptEnabled: false })
      await contexto.route('**/*', (rota) => rota.abort())
      const pagina = await contexto.newPage()
      await pagina.setContent(html, { waitUntil: 'load' })
      return pagina.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        footerTemplate: rodape,
        margin: { top: '16mm', bottom: '20mm', left: '14mm', right: '14mm' },
        tagged: true,
        outline: true,
      })
    }
    return await Promise.race([gerar(), teto])
  } finally {
    clearTimeout(relogio)
    await navegador.close().catch(() => {})
    gerando = false
  }
}
