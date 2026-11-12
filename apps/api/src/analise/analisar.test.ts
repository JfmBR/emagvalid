import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { analisar } from './analisar.js'

// Página local com uma falha conhecida (imagem sem alt) e título e idioma corretos
const html = `<!doctype html><html lang="pt-BR"><head><title>Teste</title></head>
<body><main><h1>Teste</h1><img src="x.png"></main></body></html>`

let servidor: Server
let url: string

beforeAll(async () => {
  servidor = createServer((_req, res) => {
    res.setHeader('content-type', 'text/html')
    res.end(html)
  })
  await new Promise<void>((ok) => servidor.listen(0, '127.0.0.1', ok))
  url = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`
})

afterAll(() => {
  servidor.close()
})

describe('analisar', () => {
  it('acha a imagem sem alt com seletor e trecho', async () => {
    const violacoes = await analisar(url)
    const imagem = violacoes.find((v) => v.regra === 'image-alt')

    expect(imagem?.ocorrencias[0]?.seletor).toBe('img')
    expect(imagem?.ocorrencias[0]?.trecho).toContain('x.png')
  })

  it('falha quando o endereço não abre', async () => {
    // porta que acabou de ser liberada: ninguém escuta nela
    const livre = createServer()
    await new Promise<void>((ok) => livre.listen(0, '127.0.0.1', ok))
    const porta = (livre.address() as AddressInfo).port
    await new Promise<void>((ok) => livre.close(() => ok()))

    await expect(analisar(`http://127.0.0.1:${porta}`, 5_000)).rejects.toThrow(
      /ERR_CONNECTION_REFUSED/,
    )
  })
})
