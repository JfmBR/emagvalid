# AcessaWeb · Grupo 3 · Projeto Integrador Conecta Jovem

Auditoria automatizada de acessibilidade pelo eMAG 3.1 (Trilha A — produto funcional).

## Pastas
| Pasta | Conteúdo |
|---|---|
| `docs/contexto_projeto/` | Documentos oficiais em .docx (TAP, Persona, Jornada, entrevistas, Artefatos e Cronograma) |
| `docs/Modelos/` | Modelos do programa (TAP, Plano de Projeto, Persona, Jornada) e planilha didática da Matriz RACI e Plano de Comunicação |
| `docs/rascunhos/` | Rascunhos em Markdown para colar nos .docx, protótipo do Plano de Projeto v1.0 (.docx) e rascunho da Matriz RACI do grupo (.xlsx) |
| `docs/prototipo/` | Protótipo clicável das 8 telas (HTML), base do teste de 30/10/2026 |
| `docs/imagem/` | Retrato da persona e esquemas da jornada |
| `contexto_agente/` | Contexto dos agentes do Claude Code; comece por `00-indice.md` |
| `.claude/agents/` | Agentes `emagvalid` e `emagvalid-checagem` |
| `CLAUDE.md` | Regras de trabalho do Claude Code (commits, PRs e edição dos .docx); preferências pessoais ficam em `CLAUDE.local.md`, fora do git |
| `.github/pull_request_template.md` | Checklist que aparece em toda pull request nova |

## Depois de alterar um .docx
```bash
python3 -I contexto_agente/fontes/_gerar_fontes.py
```
Regenera `contexto_agente/fontes/`. Em seguida, peça ao agente `emagvalid` para revisar `contexto_agente/01`–`07`.

## Código do MVP
O código fica em outro repositório, [`emagvalid`](https://github.com/JfmBR/emagvalid) (público desde 05/11/2026), clonado numa pasta ao lado desta: as duas ficam em `projeto_integrador/` (`projeto_integrador/emagvalid` para o código e `projeto_integrador/emagvalid_docs` para os documentos). Ele consulta os requisitos, as telas e o protótipo daqui por `../emagvalid_docs/`; nada disso é copiado para lá.
