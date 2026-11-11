# AcessaWeb · Grupo 3 · Projeto Integrador Conecta Jovem — documentação

Auditoria automatizada de acessibilidade pelo eMAG 3.1 (Trilha A — produto funcional). Esta pasta guarda a documentação do projeto; o código do MVP está na raiz deste mesmo repositório (`apps/`). Até 10/11/2026, documentação e código eram dois repositórios (`emagvalid-docs` e `emagvalid`).

## Pastas

| Pasta | Conteúdo |
|---|---|
| `docs/contexto_projeto/` | Documentos oficiais em .docx (TAP, Plano de Projeto v1, Persona v0.1, Artefatos e Cronograma) |
| `docs/Modelos/` | Modelos do programa (TAP, Plano de Projeto, Persona, Jornada) |
| `docs/rascunhos/` | Rascunhos em Markdown para colar nos .docx |
| `docs/prototipo/` | `beta/`: protótipo beta de 11/11/2026, guia do fluxo; `prototipo_emagvalid.html`: protótipo das 8 telas, base do teste de 30/10/2026 |
| `docs/imagem/` | Esquemas da jornada |
| `contexto_agente/` | Contexto dos agentes do Claude Code; comece por `00-indice.md` |

Agentes (`emagvalid` e `emagvalid-checagem`), regras de trabalho (`CLAUDE.md`) e modelo de PR ficam na raiz do repositório.

## Pasta privada

O repositório é público. Ficam fora dele, na pasta `acessaweb-privado/` ao lado de `projeto_integrador/` (cópia da pasta do grupo no Drive): os .docx da Persona v1.0, da Jornada v1.0, das entrevistas e do feedback do mentor; as planilhas RACI; o retrato da persona; a fonte `Entrevistas_PcD.md`; e `nomes.json`, que troca o nome de cada entrevistado pelo código (A1–A3, Ctx1–Ctx4). Como montar a pasta: `docs/instalacao.md`, na raiz.

## Depois de alterar um .docx

Na raiz do repositório:

```bash
python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py
python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar
```

O primeiro regenera `contexto_agente/fontes/` (sem nomes de entrevistados); o segundo confere que nada privado ficou no que é público e precisa sair com 0. Em seguida, peça ao agente `emagvalid` para revisar `contexto_agente/01`–`07`.
