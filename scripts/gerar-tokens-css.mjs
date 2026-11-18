// Gera design-system/tokens.css a partir de design-system/tokens.json.
// Uso: node scripts/gerar-tokens-css.mjs (rode de novo sempre que mudar o tokens.json)
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const pasta = resolve(dirname(fileURLToPath(import.meta.url)), '../design-system')
const tokens = JSON.parse(readFileSync(resolve(pasta, 'tokens.json'), 'utf8'))
const [claro, escuro, contraste] = tokens.color.themes.map((tema) => tema.id)

// Alias "{accent}" vira var(--accent); valor simples vale para todos os temas
const valor = (v) => String(v).replace(/^\{(.+)\}$/, 'var(--$1)')
const corDoTema = (token, tema) =>
  typeof token.value === 'string' ? token.value : (token.value[tema] ?? token.value[claro])
const linhas = (pares) => pares.map(([nome, v]) => `  --${nome}: ${valor(v)};`).join('\n')

const cores = (tema) => tokens.color.tokens.map((t) => [t.name, corDoTema(t, tema)])
const fontes = Object.entries(tokens.type.families).map(([nome, v]) => [`font-${nome}`, v])
const medidas = ['spacing', 'radius', 'shadow', 'size'].flatMap((familia) =>
  tokens[familia].tokens.map((t) => [t.name, t.value]),
)
// No escuro só entram as cores que mudam
const mudaNoEscuro = cores(escuro).filter(([, v], i) => v !== cores(claro)[i][1])
const mudaNoContraste = cores(contraste).filter(([, v], i) => v !== cores(claro)[i][1])

const css = `/* ${tokens.name} — gerado de tokens.json por scripts/gerar-tokens-css.mjs. Não edite à mão. */
:root {
${linhas([...cores(claro), ...fontes, ...medidas])}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme='${claro}']):not([data-theme='${contraste}']) {
  ${linhas(mudaNoEscuro).replaceAll('\n', '\n  ')}
  }
}

:root[data-theme='${escuro}'] {
${linhas(mudaNoEscuro)}
}

/* Alto contraste (eMAG 3.1, seção 4.2): vem por último e vence o tema do sistema */
:root[data-theme='${contraste}'] {
  color-scheme: dark;
${linhas(mudaNoContraste)}
}
`

writeFileSync(resolve(pasta, 'tokens.css'), css)
console.log('design-system/tokens.css gerado.')
