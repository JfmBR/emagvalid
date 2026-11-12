// Uso: npm run analisar -w apps/api -- <url>
import { requisitosDaRegra } from '../emag/requisitos.js'
import { analisar } from './analisar.js'

const url = process.argv[2]
if (!url) {
  console.error('Uso: npm run analisar -w apps/api -- <url>')
  process.exit(1)
}

const inicio = Date.now()
const violacoes = await analisar(url)
const escrever = (texto: string) => process.stdout.write(`${texto}\n`)

escrever(
  `${url}: ${violacoes.length} regra(s) com falha em ${((Date.now() - inicio) / 1000).toFixed(1)} s\n`,
)

for (const v of violacoes) {
  const emag = requisitosDaRegra(v.regra)
    .map((r) => `eMAG ${r.numero} ${r.nome} [${r.prioridade}]`)
    .join(' | ')
  escrever(`${v.regra} (${v.ocorrencias.length}x) → ${emag || 'fora da lista do eMAG'}`)
  escrever(`  ${v.ocorrencias[0]?.seletor}`)
}
