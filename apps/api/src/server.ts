import { analisar } from './analise/analisar.js'
import { criarApp } from './app.js'

const porta = Number(process.env.PORT ?? 3000)

criarApp(process.env.PASTA_WEB).listen(porta, () => {
  // única saída esperada no terminal: avisa onde a API subiu (ainda não há logger)
  // oxlint-disable-next-line no-console
  console.log(`API do emagvalid em http://localhost:${porta}`)
  void analisarAoIniciar(process.env.ANALISAR_AO_INICIAR)
})

// Diagnóstico da publicação (Passo 3): mede uma análise no servidor e escreve no log.
// A URL vem só da variável de ambiente, nunca de um pedido, para não abrir SSRF (RNF10).
async function analisarAoIniciar(url: string | undefined) {
  if (!url) return
  const inicio = Date.now()
  try {
    const violacoes = await analisar(url, 60_000)
    // oxlint-disable-next-line no-console
    console.log(
      `Diagnóstico: ${url} analisada em ${((Date.now() - inicio) / 1000).toFixed(1)} s, ${violacoes.length} regra(s) com falha`,
    )
  } catch (erro) {
    console.error(
      `Diagnóstico: ${url} falhou em ${((Date.now() - inicio) / 1000).toFixed(1)} s`,
      erro,
    )
  }
}
