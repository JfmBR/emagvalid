import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'prisma/config'

// As variáveis ficam no .env da raiz do repositório (modelo em .env.example)
const arquivoEnv = fileURLToPath(new URL('../../.env', import.meta.url))
if (existsSync(arquivoEnv)) process.loadEnvFile(arquivoEnv)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
