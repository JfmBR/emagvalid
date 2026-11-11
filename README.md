# AcessaWeb · Grupo 3

Auditoria automatizada de acessibilidade de páginas web pelo eMAG 3.1. É o MVP do Grupo 3 no Projeto Integrador Conecta Jovem (Trilha A, produto funcional). O auditor informa a URL de uma página pública e recebe:

- as falhas, com o requisito do eMAG violado e o local exato;
- uma nota de 0 a 100;
- orientações de correção geradas por IA e revisadas por ele;
- um PDF e o histórico das avaliações.

A nota e a IA complementam a avaliação humana; não são certificação. Produto, escopo e aceite: [`PRODUCT.md`](PRODUCT.md).

## Situação em 10/11/2026

- A estrutura está pronta: front-end e API conversando, banco modelado (proposta inicial), testes, teste de ponta a ponta com axe e CI. Ainda não há tela nem regra do MVP.
- A construção começa em 16/11/2026, seguindo [`docs/passo-a-passo-mvp.md`](docs/passo-a-passo-mvp.md). O MVP deve estar publicado em 04/12/2026 (Render e Neon, planos gratuitos).
- Arquitetura e tecnologias entram no Plano de Projeto v1.1 (13/11/2026).
- Equipe: João Francisco, Luiz Felipe e Luis Otavio.

## Como rodar

Pré-requisitos: Node.js 26 e Docker. O passo a passo para Windows e Linux está em [`docs/instalacao.md`](docs/instalacao.md).

```bash
npm ci
cp .env.example .env
npm run dev
```

O front-end abre em http://localhost:5173 e a API em http://localhost:3000. A tela inicial diz se a API está conectada.

Para usar o banco: `npm run db:up` e depois `npm run db:migrate -w apps/api`. Para os testes no navegador, baixe o Chromium uma vez com `npx playwright install chromium`.

## Comandos

| Comando                          | O que faz                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`                    | Sobe API e front-end juntos (`dev:api` e `dev:web` sobem só uma parte)                    |
| `npm run verificar`              | Roda tudo o que o CI exige: lint, regras de qualidade, formatação, tipos, testes e build  |
| `npm test`                       | Testes das duas partes (Vitest)                                                           |
| `npm run test:e2e`               | Testa as telas no navegador, com axe (acessibilidade) e teclado                           |
| `npm run lint` / `format`        | Procura erros (inclusive de acessibilidade no JSX) / formata o código                     |
| `npm run db:up` / `db:down`      | Liga e desliga o PostgreSQL local (Docker)                                                |
| `npm run db:migrate -w apps/api` | Cria ou atualiza as tabelas a partir de `apps/api/prisma/schema.prisma`                   |
| `npm run db:studio -w apps/api`  | Abre uma tela para ver os dados do banco (o grupo também usa o DBeaver; ver a instalação) |

Antes de abrir uma PR, rode `npm run verificar`. O CI roda o mesmo, mais o `test:e2e`, em todo push e PR.

## Tecnologias

| Parte                  | O que usa                                                              |
| ---------------------- | ---------------------------------------------------------------------- |
| Front-end (`apps/web`) | React 19, TypeScript, Vite                                             |
| API (`apps/api`)       | Node.js 26, Express 5, TypeScript                                      |
| Banco                  | PostgreSQL 17 com Prisma 7                                             |
| Análise das páginas    | Playwright e axe-core (instalados; a análise ainda não foi construída) |
| IA                     | Google Gemini, plano gratuito (ainda não integrado)                    |
| Qualidade              | Vitest, Testing Library, Playwright + axe, oxlint, Prettier            |
| CI                     | GitHub Actions: jobs `verificar` (obrigatório) e `e2e`                 |

Detalhes, mapa do código e fronteiras: [`docs/architecture.md`](docs/architecture.md).

## Onde está cada coisa

```
projeto_integrador/
├── apps/web/       front-end (telas)
├── apps/api/       API, banco (prisma/) e, em breve, a análise
├── design-system/  sistema de design: tokens, CSS dos componentes, marca e ícones
├── docs/           guias do código: instalação, passo a passo, arquitetura, design, qualidade e setup
├── projeto/        documentação do projeto: contexto, requisitos, telas, protótipo, .docx oficiais
└── scripts/        checagens auxiliares e geração do tokens.css
```

| Para saber…                              | Abra                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Visão geral do projeto (comece por aqui) | `projeto/contexto_agente/00-indice.md`                                                |
| Prazos e situação dos marcos             | `projeto/contexto_agente/03-cronograma-e-marcos.md`                                   |
| Pendências e decisões                    | `projeto/contexto_agente/07-pendencias-e-decisoes.md`                                 |
| Requisitos (RF e RNF, com prioridade)    | `projeto/docs/rascunhos/Requisitos_Plano_de_Projeto_v1.0.md`                          |
| Telas e o que cada uma mostra            | `projeto/docs/rascunhos/Prototipo_30-10_telas_e_teste.md` e `projeto/docs/prototipo/` |
| Critérios de acessibilidade da interface | [`docs/design.md`](docs/design.md)                                                    |
| Cores, fontes e componentes da interface | [`design-system/README.md`](design-system/README.md)                                  |
| Checagens e testes                       | [`docs/quality.md`](docs/quality.md)                                                  |
| Regras para agentes de IA                | [`AGENTS.md`](AGENTS.md) (o `CLAUDE.md` importa este)                                 |
| Ferramentas de IA do projeto             | [`docs/setup.md`](docs/setup.md)                                                      |

O repositório é público. Os arquivos com dados de entrevistados ficam fora dele, na pasta privada `acessaweb-privado/`, ao lado de `projeto_integrador/`. Como montar essa pasta: [`docs/instalacao.md`](docs/instalacao.md). Até 10/11/2026, código e documentação eram dois repositórios (`emagvalid` e `emagvalid-docs`).

## Como contribuir

Cada tarefa vai numa branch curta a partir da `main` (`feat/`, `fix/` ou `docs/` + nome em pt-BR), com commits em pt-BR no formato `tipo: descrição curta`. A PR passa pelo checklist de [`.github/pull_request_template.md`](.github/pull_request_template.md) e pelo CI verde; o merge é por squash, feito pelo João.
