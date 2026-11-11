# Código e arquitetura

Estado em 10/11/2026: estrutura pronta, ainda sem telas nem regras do MVP. A arquitetura oficial entra no Plano de Projeto v1.1 (13/11/2026); este arquivo descreve o que existe no código.

## Stack real

| Parte              | Tecnologia (versão no `package-lock.json`)                                           |
| ------------------ | ------------------------------------------------------------------------------------ |
| Monorepo           | npm workspaces (`apps/web`, `apps/api`), Node.js 26 (`.nvmrc`)                       |
| Front-end          | React 19.3, Vite 8.3, TypeScript 7.0                                                 |
| API                | Express 5.3, TypeScript, `tsx` em desenvolvimento                                    |
| Banco              | PostgreSQL 17 (Docker local; Neon em produção), Prisma 7.10 com `@prisma/adapter-pg` |
| Análise de páginas | Playwright 1.64 e `@axe-core/playwright` 4.14 (instalados na API, ainda sem código)  |
| Testes             | Vitest 5.1, Testing Library (front-end, jsdom)                                       |
| Qualidade          | oxlint 1.91 (com `jsx-a11y`), Prettier 3.9, GitHub Actions                           |

## Mapa do código

| Caminho                         | Papel                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| `apps/web/src/App.tsx`          | Tela provisória: confirma que o front-end fala com a API (`/api/saude`)              |
| `apps/web/vite.config.ts`       | Servidor em `5173` com proxy de `/api` para `localhost:3000`; configuração do Vitest |
| `apps/api/src/app.ts`           | `criarApp()`: monta as rotas, o 404 de `/api` e o tratamento de erro                 |
| `apps/api/src/server.ts`        | Sobe a API na porta `PORT` (padrão 3000)                                             |
| `apps/api/src/rotas/`           | Uma rota por assunto (hoje só `saude.ts`)                                            |
| `apps/api/src/db.ts`            | Única conexão Prisma da API                                                          |
| `apps/api/prisma/schema.prisma` | Esquema (proposta inicial): `Usuario`, `Avaliacao`, `Falha`, `StatusAvaliacao`       |
| `apps/api/generated/`           | Cliente Prisma gerado (fora do git)                                                  |
| `design-system/`                | Sistema de design: tokens, CSS dos componentes, marca e ícones (`docs/design.md`)    |
| `projeto/`                      | Documentação do projeto (requisitos, telas, protótipo, contexto dos agentes)         |

## Fronteiras e fluxo

- O front-end só fala com a API por HTTP (`/api/...`); nunca importa Prisma nem código de `apps/api`. Uma regra de lint vai impor isso (`docs/quality.md`).
- A API concentra banco, análise (Playwright + axe-core) e IA (Gemini). Segredos só no `.env` (`DATABASE_URL`, `IA_API_KEY`).
- Fluxo previsto da avaliação: URL → validação → Playwright abre a página → axe-core → falhas mapeadas para o eMAG 3.1 → nota → orientações da IA (só o trecho público com a falha) → revisão humana → PDF.
- **Risco a tratar ao implementar:** a API vai abrir URLs informadas pelo usuário. Bloqueie endereços internos (localhost, redes privadas, metadados de nuvem) para evitar SSRF, e limite tempo e tamanho da página.

## Dados e migrações

- Esquema em `apps/api/prisma/schema.prisma`; migrações em `apps/api/prisma/migrations/` (`20261105122347_inicial`).
- Mudança no esquema entra como migração (`npm run db:migrate -w apps/api`), revisada antes de aplicar. Nunca migrar durante o build ou por requisição.
- O DBeaver serve para ver e testar dados locais, não para mudar tabelas.

## Decisões

| Data       | Decisão                                                                    | Onde está                                                      |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 03/11/2026 | Prisma 7 (entre Prisma, SQL puro e Drizzle)                                | `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D |
| 05/11/2026 | Render + Neon, Gemini, nota com pesos, 60 s por análise                    | `07`, seção D                                                  |
| 10/11/2026 | Código e documentação num só repositório; dados de entrevistados fora dele | `07`, seção D                                                  |

## Manutenção

Atualize este arquivo quando mudar a stack, a estrutura de pastas, uma fronteira ou o esquema do banco. Decisão nova também vai para a seção D do `07`.
