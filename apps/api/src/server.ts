import { criarApp } from './app.js'

const porta = Number(process.env.PORT ?? 3000)

criarApp().listen(porta, () => {
  // única saída esperada no terminal: avisa onde a API subiu (ainda não há logger)
  // oxlint-disable-next-line no-console
  console.log(`API do emagvalid em http://localhost:${porta}`)
})
