import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import express, { type ErrorRequestHandler, type RequestHandler } from 'express'
import { rotasAuth } from './rotas/auth.js'
import { rotasDiagnostico } from './rotas/diagnostico.js'
import { rotasSaude } from './rotas/saude.js'

// Contra CSRF: pedido que muda dado só vale vindo das próprias telas do AcessaWeb.
// Navegadores atuais mandam Sec-Fetch-Site; os antigos, só Origin. Sem nenhum dos dois (curl, testes), passa.
const exigirMesmaOrigem: RequestHandler = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next()
    return
  }
  const site = req.get('sec-fetch-site')
  const origem = req.get('origin')
  let outroSite = false
  if (site) outroSite = site !== 'same-origin'
  else if (origem) {
    try {
      outroSite = new URL(origem).host !== req.get('host')
    } catch {
      outroSite = true // Origin "null" ou inválido
    }
  }
  if (outroSite) {
    res.status(403).json({ erro: 'Pedido recusado.' })
    return
  }
  next()
}

// Cabeçalhos de segurança, sem dependência nova. A CSP só libera o próprio site e as fontes do
// Google (design-system/components/bundle.css); frame-ancestors impede pôr as telas dentro de outro site.
const CSP = [
  "default-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const cabecalhosDeSeguranca: RequestHandler = (_req, res, next) => {
  res.set({
    'Content-Security-Policy': CSP,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  })
  next()
}

// pastaWeb: build do front-end (apps/web/dist), servido pela própria API em produção.
// Em desenvolvimento fica vazia: o Vite serve as telas e repassa /api para cá.
export function criarApp(pastaWeb?: string) {
  const app = express()
  app.disable('x-powered-by')
  app.use(cabecalhosDeSeguranca)

  // 10 kB bastam para os formulários; corpo maior é recusado com 413 antes das rotas
  app.use(express.json({ limit: '10kb' }))
  app.use('/api', exigirMesmaOrigem)
  app.use('/api/saude', rotasSaude)
  app.use('/api/auth', rotasAuth)
  app.use('/api/diagnostico', rotasDiagnostico) // temporária: ver rotas/diagnostico.ts

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
    const { status, type } = erro as { status?: unknown; type?: unknown }
    if (typeof status === 'number' && status >= 400 && status < 500) {
      // erro do pedido (JSON malformado, corpo grande): o corpo pode ter senha, então só o tipo vai para o log
      console.error(`Pedido recusado (${status}): ${String(type ?? 'sem tipo')}`)
      res
        .status(status)
        .json({ erro: status === 413 ? 'Pedido grande demais.' : 'Pedido inválido.' })
      return
    }
    console.error(erro)
    res.status(500).json({ erro: 'Erro interno. Tente de novo em instantes.' })
  }
  app.use(tratarErro)

  return app
}
