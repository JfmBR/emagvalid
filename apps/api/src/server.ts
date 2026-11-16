import { criarApp } from './app.js'

const porta = Number(process.env.PORT ?? 3000)

const servidor = criarApp(process.env.PASTA_WEB).listen(porta, () => {
  // única saída esperada no terminal: avisa onde a API subiu (ainda não há logger)
  // oxlint-disable-next-line no-console
  console.log(`API do emagvalid em http://localhost:${porta}`)
})

// No contêiner o node é o processo 1 e ignora o SIGTERM sem tratador: o Render esperaria e mataria à força
process.on('SIGTERM', () => {
  servidor.close(() => process.exit(0))
})
