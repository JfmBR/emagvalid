import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { gerarPdf, GeradorOcupado } from './pdf.js'

const html = '<!doctype html><html lang="pt-BR"><title>T</title><h1>Relatório</h1></html>'
const rodape = '<div style="font-size:9px"><span class="pageNumber"></span></div>'

// Servidor local que só conta os pedidos: o Chromium do PDF não pode buscar nada
let servidor: Server
let porta: number
let pedidos = 0

beforeAll(async () => {
  servidor = createServer((_req, res) => {
    pedidos++
    res.end('x')
  })
  await new Promise<void>((pronto) => servidor.listen(0, '127.0.0.1', pronto))
  porta = (servidor.address() as AddressInfo).port
})

afterAll(() => {
  servidor.close()
})

beforeEach(() => {
  pedidos = 0
})

describe('gerarPdf', () => {
  it('gera um PDF', async () => {
    const pdf = await gerarPdf(html, rodape)

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  }, 30_000)

  it('não busca nada na rede', async () => {
    const comRecursos = `<!doctype html><html><head>
      <link rel="stylesheet" href="http://127.0.0.1:${porta}/estilo.css"></head>
      <body><img src="http://127.0.0.1:${porta}/x.png">
      <iframe src="http://127.0.0.1:${porta}/quadro"></iframe></body></html>`

    await gerarPdf(comRecursos, rodape)

    expect(pedidos).toBe(0)
  }, 30_000)

  it('um por vez: o segundo pedido ao mesmo tempo é recusado', async () => {
    const resultados = await Promise.allSettled([gerarPdf(html, rodape), gerarPdf(html, rodape)])

    expect(resultados[0].status).toBe('fulfilled')
    expect(resultados[1].status).toBe('rejected')
    expect((resultados[1] as PromiseRejectedResult).reason).toBeInstanceOf(GeradorOcupado)
  }, 30_000)

  it('libera a trava depois de falhar pelo teto de tempo', async () => {
    await expect(gerarPdf(html, rodape, 1)).rejects.toThrow('O PDF passou do teto de tempo')

    const pdf = await gerarPdf(html, rodape)
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
  }, 30_000)
})
