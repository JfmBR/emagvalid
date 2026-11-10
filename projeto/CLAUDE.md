# AcessaWeb · Grupo 3 — instruções para o Claude Code

Contexto do projeto: comece por `contexto_agente/00-indice.md`. Agentes em `.claude/agents/` (`emagvalid` redige; `emagvalid-checagem` só confere).

Este arquivo tem as regras do projeto e vale para todo o grupo. Preferências pessoais vão em `CLAUDE.local.md` na raiz, que está no `.gitignore`.

## Commits
- **Antes de qualquer alteração** em arquivos do repositório, rode `git status`. Se houver mudanças sem commit, faça um commit delas antes de começar, como ponto de restauração.
- Mensagem do commit em pt-BR, dizendo o que ele contém.
- Commit direto na `main`. Não faça push sem pedido explícito.
- Ao terminar, diga o que ficou sem commit: isso entra no commit antes da próxima alteração.

## Pull requests
- Ao abrir uma PR, dê `git pull` antes e preencha o checklist de `.github/pull_request_template.md`.
- Se algum item do checklist falhar, corrija antes do merge.

## Documentos .docx
- Edite os .docx em `docs/` **só quando pedido explicitamente**. `contexto_agente/fontes/` nunca se edita à mão: é gerado por `_gerar_fontes.py`.
- Ao editar: troque só o texto, sem mexer na formatação; rode `python -I contexto_agente/fontes/_gerar_fontes.py` e revise `contexto_agente/01`–`07`.
