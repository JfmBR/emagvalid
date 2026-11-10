# AcessaWeb · Grupo 3

Auditoria automatizada de acessibilidade pelo eMAG 3.1 (Trilha A — produto funcional).

Este repositório guarda o código do MVP e a documentação do projeto (TAP, Plano de Projeto, Persona, Jornada, requisitos e protótipo). Até 10/11/2026 eram dois repositórios separados, `emagvalid` e `emagvalid-docs`:

```
projeto_integrador/      (este repositório)
├── apps/                código: front-end e API
├── docs/                guias do código (instalação, passo a passo do MVP)
└── projeto/             documentação do projeto
```

Os arquivos com dados de entrevistados ficam fora do repositório, na pasta privada `acessaweb-privado/`, ao lado desta (ver [`docs/instalacao.md`](docs/instalacao.md)).

## Situação em 03/11/2026

- Estrutura pronta: front-end e API conversando, banco modelado (proposta), testes e CI. Ainda não há nenhuma tela ou regra do MVP.
- A construção começa em 16/11/2026 (sprint 1: telas principais e estrutura). Arquitetura e tecnologias entram no Plano de Projeto v1.1, em 13/11/2026.
- Decidido em 05/11/2026 (Plano de Projeto v1): IA com o Google Gemini, nota com pesos por prioridade nas 29 recomendações do eMAG cobertas pelo axe-core, hospedagem no Render com o banco no Neon (planos gratuitos) e regras de branches (`main` protegida, PR com CI verde, squash; desde 10/11/2026, merge pelo João como administrador).
- Passo a passo da construção, semana a semana: [`docs/passo-a-passo-mvp.md`](docs/passo-a-passo-mvp.md).

## Tecnologias

| Parte                  | O que usa                                                                        |
| ---------------------- | -------------------------------------------------------------------------------- |
| Front-end (`apps/web`) | React 19, TypeScript, Vite                                                       |
| API (`apps/api`)       | Node.js 26, Express 5, TypeScript                                                |
| Banco                  | PostgreSQL 17, com Prisma 7 (esquema em `apps/api/prisma/schema.prisma`)         |
| Análise das páginas    | Playwright e axe-core (instalados; ainda sem código)                             |
| Qualidade              | Vitest e Testing Library (testes), oxlint com regras de acessibilidade, Prettier |
| CI                     | GitHub Actions: lint, formatação, tipos, testes e build em todo push e PR        |

O esquema do banco é uma **proposta inicial** para os requisitos de prioridade alta; revisar no Plano v1.1.

## Como rodar

Pré-requisitos: [Node.js 26](https://nodejs.org) e, para o banco, [Docker Desktop](https://www.docker.com/products/docker-desktop/). Instalação passo a passo, com os links de download: [`docs/instalacao.md`](docs/instalacao.md).

```bash
npm install
cp .env.example .env
npm run dev
```

Abre o front-end em http://localhost:5173 e a API em http://localhost:3000. A tela inicial diz se a API está conectada.

Para usar o banco:

```bash
npm run db:up
npm run db:migrate -w apps/api
```

Para ver os dados, o grupo usa o [DBeaver Community](https://dbeaver.io). Crie uma conexão PostgreSQL com host `localhost`, porta `5432` e o banco, o usuário e a senha do `docker-compose.yml`. Use o DBeaver para ver e testar dados; mudanças nas tabelas só pelo `schema.prisma` e uma migração, senão o Prisma deixa de bater com o banco.

Para a análise com Playwright, baixe o navegador uma vez:

```bash
npx playwright install chromium
```

## Comandos

| Comando                          | O que faz                                         |
| -------------------------------- | ------------------------------------------------- |
| `npm run dev`                    | Sobe API e front-end juntos                       |
| `npm run dev:api` / `dev:web`    | Sobe só uma das partes                            |
| `npm test`                       | Roda os testes das duas partes                    |
| `npm run lint`                   | Procura erros, inclusive de acessibilidade no JSX |
| `npm run format`                 | Formata o código com o Prettier                   |
| `npm run typecheck`              | Confere os tipos do TypeScript                    |
| `npm run build`                  | Gera a versão de produção                         |
| `npm run db:up` / `db:down`      | Liga e desliga o PostgreSQL local (Docker)        |
| `npm run db:migrate -w apps/api` | Cria ou atualiza as tabelas a partir do esquema   |
| `npm run db:studio -w apps/api`  | Abre uma tela para ver os dados do banco          |

Antes de abrir uma PR, rode `npm run lint`, `npm run format` e `npm test`. O CI roda o mesmo.

## Pastas

| Caminho                            | Conteúdo                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/web/`                        | Front-end (telas)                                                                               |
| `apps/api/src/`                    | API: `app.ts` monta as rotas, `rotas/` tem uma por assunto                                      |
| `apps/api/prisma/`                 | Esquema do banco e migrações                                                                    |
| `docker-compose.yml`               | PostgreSQL local                                                                                |
| `.env.example`                     | Modelo das variáveis de ambiente (copie para `.env`)                                            |
| `.github/workflows/ci.yml`         | CI                                                                                              |
| `docs/instalacao.md`               | Guia de instalação das ferramentas (Windows e Linux)                                            |
| `docs/passo-a-passo-mvp.md`        | Passo a passo da construção do MVP                                                              |
| `.github/pull_request_template.md` | Checklist que aparece em toda pull request nova                                                 |
| `CLAUDE.md`                        | Regras de trabalho do Claude Code neste repositório                                             |
| `.claude/agents/`                  | Agentes `emagvalid-dev` (código), `emagvalid` (documentos) e `emagvalid-checagem` (conferência) |
| `projeto/`                         | Documentação do projeto (ver a tabela abaixo)                                                   |

## Documentos do repositório

| Arquivo                   | Para quê                                                           |
| ------------------------- | ------------------------------------------------------------------ |
| `PRODUCT.md`              | Produto, escopo do MVP e critérios de aceite                       |
| `AGENTS.md` / `CLAUDE.md` | Regras para os agentes de IA (o `CLAUDE.md` importa o `AGENTS.md`) |
| `docs/architecture.md`    | Stack, mapa do código, fronteiras e dados                          |
| `docs/design.md`          | Critérios de acessibilidade e de interface                         |
| `docs/quality.md`         | Comandos de checagem, testes e revisão                             |
| `docs/setup.md`           | Ferramentas de IA do projeto e evidências                          |
| `docs/instalacao.md`      | Preparar o computador (Windows e Linux)                            |

## Onde está cada coisa na documentação

| Assunto                                   | Arquivo em `projeto/`                                               |
| ----------------------------------------- | ------------------------------------------------------------------- |
| Visão geral do contexto (comece por aqui) | `contexto_agente/00-indice.md`                                      |
| Escopo, objetivos e tecnologias previstas | `contexto_agente/01-projeto-emagvalid.md`                           |
| Equipe e mentores                         | `contexto_agente/02-equipe-e-mentores.md`                           |
| Prazos e status                           | `contexto_agente/03-cronograma-e-marcos.md`                         |
| Pendências e decisões                     | `contexto_agente/07-pendencias-e-decisoes.md`                       |
| Requisitos (RF e RNF, com prioridade)     | `docs/rascunhos/Requisitos_Plano_de_Projeto_v1.0.md`                |
| Telas e o que cada uma mostra             | `docs/rascunhos/Prototipo_30-10_telas_e_teste.md` (Tela 1 a Tela 8) |
| Protótipo clicável                        | `docs/prototipo/prototipo_emagvalid.html`                           |

Os requisitos e as telas não são copiados para o código, para não existirem duas versões.
