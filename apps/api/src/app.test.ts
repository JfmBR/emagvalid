import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { criarApp } from './app.js'

describe('API', () => {
  it('JSON malformado responde 400 e não escreve o corpo (que pode ter senha) no log', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const resposta = await request(criarApp())
      .post('/api/saude')
      .set('Content-Type', 'application/json')
      .send('{"email":"a@b.com","senha":"segredo-123"')

    expect(resposta.status).toBe(400)
    expect(JSON.stringify(log.mock.calls)).not.toContain('segredo-123')
    log.mockRestore()
  })

  it('responde ok em /api/saude', async () => {
    const resposta = await request(criarApp()).get('/api/saude')

    expect(resposta.status).toBe(200)
    expect(resposta.body).toEqual({ status: 'ok' })
  })

  it('responde 404 em rota inexistente', async () => {
    const resposta = await request(criarApp()).get('/api/nao-existe')

    expect(resposta.status).toBe(404)
  })
})

describe('front-end pronto (produção)', () => {
  let pastaWeb: string

  beforeAll(() => {
    pastaWeb = mkdtempSync(join(tmpdir(), 'web-'))
    writeFileSync(join(pastaWeb, 'index.html'), '<p>tela</p>')
    writeFileSync(join(pastaWeb, 'app.js'), 'console.log(1)')
  })

  afterAll(() => {
    rmSync(pastaWeb, { recursive: true })
  })

  it('serve os arquivos do build', async () => {
    const resposta = await request(criarApp(pastaWeb)).get('/app.js')

    expect(resposta.status).toBe(200)
    expect(resposta.text).toBe('console.log(1)')
  })

  it('devolve o index.html nas rotas das telas', async () => {
    const resposta = await request(criarApp(pastaWeb)).get('/avaliacoes/1')

    expect(resposta.status).toBe(200)
    expect(resposta.text).toBe('<p>tela</p>')
  })

  it('serve a tela inicial em /', async () => {
    const resposta = await request(criarApp(pastaWeb)).get('/')

    expect(resposta.status).toBe(200)
    expect(resposta.text).toBe('<p>tela</p>')
  })

  it('mantém /api/saude', async () => {
    const resposta = await request(criarApp(pastaWeb)).get('/api/saude')

    expect(resposta.body).toEqual({ status: 'ok' })
  })

  it('não diz que roda com Express', async () => {
    const resposta = await request(criarApp(pastaWeb)).get('/')

    expect(resposta.headers['x-powered-by']).toBeUndefined()
  })

  it('recusa subir sem o index.html', () => {
    expect(() => criarApp(join(pastaWeb, 'nao-existe'))).toThrow(/index\.html/)
  })

  it('mantém o 404 em JSON nas rotas da API', async () => {
    const resposta = await request(criarApp(pastaWeb)).get('/api/nao-existe')

    expect(resposta.status).toBe(404)
    expect(resposta.body).toEqual({ erro: 'Rota não encontrada.' })
  })
})
