import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { criarApp } from './app.js'

describe('API', () => {
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
