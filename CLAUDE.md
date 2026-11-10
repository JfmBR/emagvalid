@AGENTS.md

# Claude Code neste repositório

- Agentes em `.claude/agents/`: `emagvalid-dev` (código, contra os requisitos e o protótipo em `projeto/`), `emagvalid` (redige e revisa os documentos do projeto) e `emagvalid-checagem` (conferência só de leitura: prazos, seções, placeholders, divergências).
- Ao trabalhar no código, não altere `projeto/`. Se o código mostrar que um requisito precisa mudar, avise o João.
- Os .docx em `projeto/docs/` só se editam a pedido do João, trocando só o texto. `projeto/contexto_agente/fontes/` nunca se edita à mão: rode `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py` e revise `projeto/contexto_agente/01`–`07`.
- Delegação em ondas paralelas: `.claude/rules/parallel-subagent-driven-development.md`.
- Preferências pessoais do João ficam em `CLAUDE.local.md` (fora do git, só nesta máquina).
- Memória: este arquivo e o `AGENTS.md` são o índice curto; o detalhe fica em `projeto/contexto_agente/` (sob demanda) e na memória automática do Claude Code. Onde fica cada camada e quando revalidar: `docs/setup.md`, seção "Memória".
