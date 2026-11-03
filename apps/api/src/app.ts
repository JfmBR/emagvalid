import express, { type ErrorRequestHandler } from 'express'
import { rotasSaude } from './rotas/saude.js'

export function criarApp() {
  const app = express()

  app.use(express.json())
  app.use('/api/saude', rotasSaude)

  app.use('/api', (_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' })
  })

  const tratarErro: ErrorRequestHandler = (erro, _req, res, _next) => {
    console.error(erro)
    res.status(500).json({ erro: 'Erro interno. Tente de novo em instantes.' })
  }
  app.use(tratarErro)

  return app
}
