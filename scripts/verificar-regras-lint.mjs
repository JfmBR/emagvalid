// Autoteste das regras de qualidade do oxlint: cria arquivos que DEVEM falhar e
// confere que cada regra acusa. Uso: npm run lint:autoteste
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pasta = mkdtempSync(join(tmpdir(), 'regras-lint-'))

const arquivos = {
  'apps/web/src/acessa-banco.ts':
    "import { PrismaClient } from '@prisma/client'\nexport const banco = PrismaClient\n",
  'apps/api/src/loga.ts': "console.log('depuração esquecida')\n",
  'apps/api/src/longo.ts':
    Array.from({ length: 351 }, (_, n) => `export const a${n} = ${n}`).join('\n') + '\n',
}

try {
  copyFileSync(join(raiz, '.oxlintrc.json'), join(pasta, '.oxlintrc.json'))
  for (const [caminho, conteudo] of Object.entries(arquivos)) {
    mkdirSync(dirname(join(pasta, caminho)), { recursive: true })
    writeFileSync(join(pasta, caminho), conteudo)
  }
  let saida = ''
  try {
    saida = execFileSync(join(raiz, 'node_modules/.bin/oxlint'), ['-c', '.oxlintrc.json', 'apps'], {
      cwd: pasta,
      encoding: 'utf8',
    })
  } catch (erro) {
    saida = String(erro.stdout) // oxlint sai com 1 quando acha erro, que é o esperado aqui
  }
  for (const regra of ['max-lines', 'no-console', 'no-restricted-imports']) {
    assert.ok(saida.includes(regra), `a regra ${regra} não acusou o arquivo de teste:\n${saida}`)
  }
  console.log('ok: max-lines, no-console e no-restricted-imports acusam o que devem')
} finally {
  rmSync(pasta, { recursive: true, force: true })
}
