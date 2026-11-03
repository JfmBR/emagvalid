# emagvalid · Grupo 3 · código do MVP

Auditoria automatizada de acessibilidade pelo eMAG 3.1 (Trilha A — produto funcional).

Este repositório guarda **só o código**. A documentação do projeto (TAP, Plano de Projeto, Persona, Jornada, requisitos e protótipo) fica no repositório `emagvalid-docs`, clonado numa pasta ao lado desta:

```
Projetos/
├── emagvalid-docs/   documentação
└── emagvalid/        código (este repositório)
```

## Situação em 03/11/2026
- Só a estrutura do repositório; ainda não há código.
- A construção começa em 16/11/2026 (sprint 1: telas principais e estrutura). Arquitetura e tecnologias entram no Plano de Projeto v1.1, em 13/11/2026.
- Tecnologias previstas no TAP: React e TypeScript; Node.js e Express; PostgreSQL; Playwright e axe-core; API de IA (fornecedor **a definir**).
- Repositório no GitHub e regras de branches e commits: **a definir** (Matheus, com apoio do mentor José Alves).

## Onde está cada coisa na documentação
| Assunto | Arquivo em `../emagvalid-docs/` |
|---|---|
| Visão geral do contexto (comece por aqui) | `contexto_agente/00-indice.md` |
| Escopo, objetivos e tecnologias previstas | `contexto_agente/01-projeto-emagvalid.md` |
| Equipe e mentores | `contexto_agente/02-equipe-e-mentores.md` |
| Prazos e status | `contexto_agente/03-cronograma-e-marcos.md` |
| Pendências e decisões | `contexto_agente/07-pendencias-e-decisoes.md` |
| Requisitos (RF e RNF, com prioridade) | `docs/rascunhos/Requisitos_Plano_de_Projeto_v1.0.md` |
| Telas e o que cada uma mostra | `docs/rascunhos/Prototipo_30-10_telas_e_teste.md` (Tela 1 a Tela 8) |
| Protótipo clicável | `docs/prototipo/prototipo_emagvalid.html` |

Os requisitos e as telas não são copiados para cá, para não existirem duas versões.

## Pastas e arquivos
| Caminho | Conteúdo |
|---|---|
| `CLAUDE.md` | Regras de trabalho do Claude Code neste repositório |
| `.claude/agents/` | Agente `emagvalid-dev` (apoio ao desenvolvimento) |
| `.github/pull_request_template.md` | Checklist que aparece em toda pull request nova |
