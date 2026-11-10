# Setup e evidências

Registro da preparação do repositório para desenvolvimento com IA, pelo [Vibe Coding Toolkit](https://github.com/soumatheusgomes/vibe-coding-toolkit) (prompt 12, "Set up or update an existing project").

## Origem e contexto

- Toolkit: revisão `7ef68dd7b00ddfc5cd464458855e4ab66dd2128f` (08/11/2026), lida numa cópia temporária fora do projeto.
- Data: 09 e 10/11/2026. Máquina: Linux, Node.js 26.13, npm 11.20, Docker, gh. Cliente: Claude Code (Opus 5.5), sem Codex.
- Design e plano desta preparação: na pasta privada (`../acessaweb-privado/planejamento/`), porque citam nomes de entrevistados.

## Decisões e fontes

- Repositórios `emagvalid` e `emagvalid-docs` unificados em 10/11/2026 (ver `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D).
- A stack existente fica (React + Vite, Express, Prisma, oxlint). Os padrões do toolkit para projeto novo (Next.js, Drizzle, Zod, Pino, ESLint) não se aplicam.
- Mapeamento dos 9 documentos do manifesto: `README.md`, `PRODUCT.md`, `AGENTS.md`, `CLAUDE.md`, `docs/architecture.md`, `docs/design.md`, `docs/quality.md`, `docs/setup.md` criados ou adaptados; `docs/onboarding.md` → **`docs/instalacao.md`**, que já era o guia canônico (PR #4).

## Componentes

Situação: **validado** (rodou e foi observado), **configurado** (instalado, sem execução observada), **reusado** (já existia e funciona), **N/A** (não se aplica, com motivo), **bloqueado** (com condição para retomar), **pendente** (ainda nesta preparação).

| Componente                                                                | Escopo                 | Situação    | Evidência ou motivo                                                               |
| ------------------------------------------------------------------------- | ---------------------- | ----------- | --------------------------------------------------------------------------------- |
| Superpowers 7.0.0                                                         | global (plugin)        | reusado     | brainstorming, writing-plans e executing-plans usados nesta preparação            |
| Ponytail 5.3.3 (`full`)                                                   | global (plugin)        | reusado     | ativo nas sessões; citado no `AGENTS.md`                                          |
| Caveman 4.1.0                                                             | global (plugin)        | reusado     | ativo nas sessões; citado no `AGENTS.md`                                          |
| RTK 1.2.0                                                                 | global (hook)          | reusado     | saídas de comando compactadas nesta sessão; sem segundo wrapper                   |
| Context7                                                                  | global (plugin)        | pendente    | consulta real na Tarefa 9                                                         |
| Subagentes                                                                | projeto                | configurado | `.claude/rules/parallel-subagent-driven-development.md` + política no `AGENTS.md` |
| Graphify                                                                  | global (CLI) + projeto | pendente    | `.graphifyignore` e consulta na Tarefa 9                                          |
| Skills do projeto                                                         | projeto                | pendente    | Tarefa 9                                                                          |
| agent-browser                                                             | global                 | pendente    | Tarefa 10                                                                         |
| Chrome DevTools MCP                                                       | projeto                | pendente    | Tarefa 10                                                                         |
| e2e com axe                                                               | projeto                | pendente    | PR 3                                                                              |
| Regras de qualidade no oxlint                                             | projeto                | pendente    | PR 3                                                                              |
| Revisão de segurança (prompt 13)                                          | projeto                | pendente    | Tarefa 9                                                                          |
| Harness2 nativo (prompt 15) e avaliação (prompt 14)                       | projeto                | pendente    | Tarefa 13                                                                         |
| next-dev-loop, next-bundle-optimizer                                      | —                      | N/A         | o projeto usa Vite, não Next.js                                                   |
| shadcn                                                                    | —                      | N/A         | não há sistema de componentes adotado                                             |
| Sentry MCP                                                                | —                      | N/A         | nenhum serviço Sentry escolhido; teria conta e custo                              |
| gh-fix-ci                                                                 | —                      | N/A         | fluxo do Codex; no Claude Code, `gh run view --log-failed` cobre                  |
| Auditoria de segurança avançada (prompt 16)                               | —                      | N/A agora   | opcional; sugerida antes da publicação (04/12)                                    |
| Obsidian                                                                  | —                      | N/A         | sem necessidade concreta de memória externa                                       |
| Hooks novos                                                               | —                      | N/A         | RTK e plugins já registram os seus; nenhum hook de Git                            |
| Anthropic skills (docx, skill-creator…)                                   | global (sincronizadas) | reusado     | disponíveis na sessão; `docx` serve aos .docx do projeto                          |
| aia-harness, JEV, Codex                                                   | —                      | N/A         | aia-harness geraria um harness concorrente; JEV e Codex sem necessidade           |
| Vercel: view-transitions, optimize, deploy, cli-with-tokens, react-native | —                      | N/A         | sem pedido de animação; hospedagem é Render; sem app móvel                        |

## Documentação criada

`AGENTS.md`, `PRODUCT.md`, `docs/architecture.md`, `docs/design.md`, `docs/quality.md`, `docs/setup.md`; `CLAUDE.md` passa a importar o `AGENTS.md`.

## Checagens

Linha de base antes de qualquer mudança (10/11/2026, código em `92c37ff`): `npm ci`, `lint`, `format:check`, `typecheck`, `test` (2 + 2 testes) e `build` saíram com 0.

## Memória e harness

### Memória

| Camada                | Onde                                                                           | Como carrega                              |
| --------------------- | ------------------------------------------------------------------------------ | ----------------------------------------- |
| Índice curto          | `CLAUDE.md` → `AGENTS.md`                                                      | Carregado pelo Claude Code em toda sessão |
| Regras locais do João | `CLAUDE.local.md` (fora do git)                                                | Carregado junto com o `CLAUDE.md`         |
| Contexto do projeto   | `projeto/contexto_agente/00-indice.md` → `01`–`07` e `fontes/`                 | Sob demanda, pelo índice                  |
| Memória automática    | `~/.claude/projects/-home-joao-Documentos-projetos-projeto-integrador/memory/` | Pelo Claude Code, por pasta do projeto    |

Revalide quando mudar o layout das pastas, a equipe ou uma decisão da seção D do `07`. Fato superado se corrige no lugar, não se acumula.

Trabalho que atravessa sessões: registro curto no plano da tarefa, no formato do toolkit (`templates/task-handoff.md.template`): objetivo, estado verificado, checagens, pendências, bloqueios, recursos em uso e próxima ação.

## Pendências e próxima entrega

Preenchido ao fim da preparação (Tarefa 13).
