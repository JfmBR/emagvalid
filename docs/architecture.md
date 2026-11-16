# Código e arquitetura

Estado em 10/11/2026: estrutura pronta, ainda sem telas nem regras do MVP. A arquitetura oficial está no Plano de Projeto v1.1 (11/11/2026); este arquivo descreve o que existe no código.

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
| `apps/api/src/app.ts`           | `criarApp()`: monta as rotas, o 404 de `/api`, o front-end pronto e o erro           |
| `apps/api/src/server.ts`        | Sobe a API na porta `PORT` (padrão 3000)                                             |
| `Dockerfile`, `.dockerignore`   | Imagem de produção: API, front-end pronto e Chromium (seção Publicação)              |
| `apps/api/src/rotas/`           | Uma rota por assunto (hoje só `saude.ts`)                                            |
| `apps/api/src/db.ts`            | Única conexão Prisma da API                                                          |
| `apps/api/prisma/schema.prisma` | Esquema (proposta inicial): `Usuario`, `Avaliacao`, `Falha`, `StatusAvaliacao`       |
| `apps/api/generated/`           | Cliente Prisma gerado (fora do git)                                                  |
| `design-system/`                | Sistema de design: tokens, CSS dos componentes, marca e ícones (`docs/design.md`)    |
| `projeto/`                      | Documentação do projeto (requisitos, telas, protótipo, contexto dos agentes)         |

## Fronteiras e fluxo

- O front-end só fala com a API por HTTP (`/api/...`); nunca importa Prisma nem código de `apps/api`. Uma regra de lint vai impor isso (`docs/quality.md`).
- A API concentra banco, análise (Playwright + axe-core) e IA (Gemini). Segredos só no `.env` (`DATABASE_URL`, `IA_API_KEY`).
- Fluxo previsto da avaliação: URL → validação → Playwright abre a página → axe-core → falhas mapeadas para o eMAG 3.1 → nota → sugestões da IA (só o trecho público com a falha), marcadas como sugestão → PDF (plano pago; bloqueado na amostra, RF21). Requisitos e público: Plano de Projeto v1.1.
- **Segurança (RNF04 e RNF10 do Plano v1.1):** a API vai abrir URLs informadas pelo usuário. Bloqueie endereços internos (localhost, redes privadas, metadados de nuvem) para evitar SSRF; limite tempo, tamanho da página e análises seguidas; mostre trechos da página como texto, nunca como HTML (XSS); consultas só pelo Prisma, sem SQL montado com texto do usuário (SQL injection).

## Dados e migrações

- Esquema em `apps/api/prisma/schema.prisma`; migrações em `apps/api/prisma/migrations/` (`20261105122347_inicial`).
- Mudança no esquema entra como migração (`npm run db:migrate -w apps/api`), revisada antes de aplicar. Nunca migrar durante o build ou por requisição.
- O DBeaver serve para ver e testar dados locais, não para mudar tabelas.

## Publicação

- Uma imagem só (`Dockerfile`, base `node:26-trixie-slim`) roda no Render, plano gratuito: a API serve `/api` e também o front-end pronto (`PASTA_WEB=/app/apps/web/dist`); qualquer rota fora de `/api` devolve o `index.html`. O Chromium do Playwright vai na imagem porque a análise roda no servidor.
- Banco no Neon (plano gratuito). Na partida, o contêiner roda `prisma migrate deploy` (aplica as migrações já revisadas, nunca cria novas) e depois sobe a API.
- Variáveis no painel do Render, nunca no repositório: `DATABASE_URL` (obrigatória).
- Medição local em 15/11/2026, com os limites do plano gratuito (`docker run --memory=512m --cpus=0.1`): example.com em 11,4 s; página de demonstração do W3C em 21,2 s, com pico de 242 MB. No Render (16/11/2026): a mesma página do W3C em 15,6 s; acordar depois de hibernar levou 52,8 s, e com o serviço acordado a página abre em 0,6 s. Acordar + análise passa dos 60 s do RNF06 (risco R7; ver `docs/passo-a-passo-mvp.md`, Passo 3). O diagnóstico usado para medir (`ANALISAR_AO_INICIAR`) foi retirado do código.
- Passo a passo dos painéis: `docs/instalacao.md`, seção "Publicar no Render e no Neon".

## Decisões

| Data       | Decisão                                                                    | Onde está                                                      |
| ---------- | -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 03/11/2026 | Prisma 7 (entre Prisma, SQL puro e Drizzle)                                | `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D |
| 05/11/2026 | Render + Neon, Gemini, nota com pesos, 60 s por análise                    | `07`, seção D                                                  |
| 10/11/2026 | Código e documentação num só repositório; dados de entrevistados fora dele | `07`, seção D                                                  |

## Manutenção

Atualize este arquivo quando mudar a stack, a estrutura de pastas, uma fronteira ou o esquema do banco. Decisão nova também vai para a seção D do `07`.
