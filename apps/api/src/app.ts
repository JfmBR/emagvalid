import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import express, { type ErrorRequestHandler } from 'express'
import { rotasAuth } from './rotas/auth.js'
import { rotasSaude } from './rotas/saude.js'

// pastaWeb: build do front-end (apps/web/dist), servido pela própria API em produção.
// Em desenvolvimento fica vazia: o Vite serve as telas e repassa /api para cá.
export function criarApp(pastaWeb?: string) {
  const app = express()
  app.disable('x-powered-by')

  app.use(express.json())
  app.use('/api/saude', rotasSaude)
  app.use('/api/auth', rotasAuth)

  app.use('/api', (_req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada.' })
  })

  if (pastaWeb) {
    // falha na partida (aparece no log do Render) em vez de responder 500 em toda tela
    if (!existsSync(resolve(pastaWeb, 'index.html'))) {
      throw new Error(`PASTA_WEB sem index.html: ${pastaWeb}`)
    }
    app.use(express.static(pastaWeb))
    // qualquer outra rota é uma tela do React: devolve o index.html e o React decide o que mostrar
    app.get('/{*tela}', (_req, res) => {
      res.sendFile('index.html', { root: pastaWeb })
    })
  }

  const tratarErro: ErrorRequestHandler = (erro, _req, res, _next) => {
    console.error(erro)
    res.status(500).json({ erro: 'Erro interno. Tente de novo em instantes.' })
  }
  app.use(tratarErro)

  return app
}
