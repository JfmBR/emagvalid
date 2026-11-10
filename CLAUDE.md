# AcessaWeb · Grupo 3 — instruções para o Claude Code

Este repositório guarda o código do MVP (na raiz: `apps/`) e a documentação do projeto (em `projeto/`). Contexto do projeto: comece por `projeto/contexto_agente/00-indice.md`. Agentes: `.claude/agents/emagvalid-dev.md` (código), `emagvalid.md` (redige documentos) e `emagvalid-checagem.md` (só confere).

## Documentação

- Requisitos, telas e protótipo ficam só em `projeto/` (ver a tabela do `README.md`). Consulte lá; não copie para o código.
- Ao trabalhar no código, não altere `projeto/`. Se o código mostrar que um requisito precisa mudar, avise o João.
- Os .docx em `projeto/docs/` só se editam quando o João pedir: troque só o texto, sem mexer na formatação. `projeto/contexto_agente/fontes/` nunca se edita à mão: é gerado por `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py`; depois de rodá-lo, revise `projeto/contexto_agente/01`–`07`.

## Privacidade (regra do João, 10/11/2026)

- O repositório é público. Integrantes e mentores aparecem com nome e sobrenome; entrevistados, só pelo código (A1–A3, Ctx1–Ctx4), nunca pelo nome.
- Não entram no repositório: links do Drive, do Google Docs, do Figma ou de artifacts; os .docx com dados de entrevistados; as planilhas RACI. Eles ficam na pasta privada `../acessaweb-privado/` (ver `docs/instalacao.md`).
- Antes de cada commit que mexa em `projeto/`, rode `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar`. Ele precisa sair com 0.

## Commits (regra do João, 28/10/2026)

- **Antes de qualquer alteração** em arquivos do repositório, rode `git status`. Se houver mudanças sem commit, faça um commit delas antes de começar, como ponto de restauração.
- Mensagem do commit em pt-BR, no formato `tipo: descrição curta` (ex.: `feat: adiciona tela de login`).
- Nunca faça commit direto na `main`. Cada tarefa vai numa branch curta, criada a partir da `main`, com o prefixo `feat/`, `fix/` ou `docs/` e um nome em pt-BR (ex.: `feat/tela-de-login`). Regra do grupo de 05/11/2026 (`projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção B, "Regras de branches e commits").
- Não faça push sem pedido do João.
- Ao terminar, diga o que ficou sem commit: isso entra no commit antes da próxima alteração.

## Pull requests (regra do João, 29/10/2026; atualizada em 10/11/2026)

- Ao abrir uma PR, dê `git pull` antes e preencha o checklist de `.github/pull_request_template.md`.
- A `main` é protegida no GitHub: a PR só entra com o check `verificar` do CI verde. O merge é sempre por squash, e a branch é apagada depois.
- Equipe atual: João Francisco, Luiz Felipe e Luis Otavio, sem revisor de PR. O João faz o merge como administrador, e só quando ele mandar.

## Perguntas e pendências (regra do João, 29/10/2026)

- Ao apresentar ao João perguntas, pendências ou divergências, diga **de que arquivo e seção** saiu cada uma, com o caminho relativo e a seção ou a linha. Exemplo: `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção B.
- Vale também ao resumir o relatório de um agente: não perca os arquivos que ele citou.
- Se a informação estiver em mais de um arquivo, liste todos. Se não estiver em nenhum, diga "não consta nos arquivos".

## Código

- Escopo: só o que o TAP prevê. Varredura de várias páginas, app móvel e certificação de conformidade integral estão fora.
- A nota (0–100) e as orientações da IA complementam a avaliação humana; nunca as apresente como certificação.
- A interface segue o eMAG 3.1/WCAG: teclado, foco visível, rótulos, contraste e alvos de 44 px ou mais.
- Tecnologias: até o Plano de Projeto v1.1 (13/11/2026), use só as previstas no TAP. Dependência nova fora delas, pergunte antes.
- Segredos (chave da API de IA, senha do banco) ficam em `.env`, fora do git. Exemplo em `.env.example`, sem valores reais.
- O esquema do banco (`apps/api/prisma/schema.prisma`) é proposta inicial; mudanças nele entram como migração (`npm run db:migrate -w apps/api`).
- Nomes do domínio em pt-BR (`avaliacao`, `falha`, `rotas/saude.ts`), como no código que já existe.
- Antes de dar uma tarefa por pronta, rode `npm run lint`, `npm run format:check`, `npm run typecheck` e `npm test`. O CI roda os mesmos e o build.
