# emagvalid (código) · Grupo 3 — instruções para o Claude Code

Este repositório guarda o código do MVP. O contexto do projeto está no repositório de documentação, na pasta ao lado: comece por `../emagvalid-docs/contexto_agente/00-indice.md`. Se essa pasta não estiver acessível na sessão, peça ao João para adicioná-la. Agente: `.claude/agents/emagvalid-dev.md`.

## Documentação
- Requisitos, telas e protótipo ficam só em `../emagvalid-docs/` (ver a tabela do `README.md`). Consulte lá; não copie para cá.
- Não altere nada em `../emagvalid-docs/` a partir deste repositório. Se o código mostrar que um requisito precisa mudar, avise o João.

## Commits (regra do João, 28/10/2026)
- **Antes de qualquer alteração** em arquivos do repositório, rode `git status`. Se houver mudanças sem commit, faça um commit delas antes de começar, como ponto de restauração.
- Mensagem do commit em pt-BR, dizendo o que ele contém.
- Commit direto na `main` até o grupo definir as regras de branches (pendente: Matheus, com apoio do mentor José Alves). Não faça push sem pedido do João.
- Ao terminar, diga o que ficou sem commit: isso entra no commit antes da próxima alteração.

## Pull requests (regra do João, 29/10/2026)
- Ao abrir uma PR, dê `git pull` antes e preencha o checklist de `.github/pull_request_template.md`.
- Se, ao conferir o checklist, nada precisar mudar e nada estiver errado, pode dar merge sem esperar o João. Se algum item falhar, corrija ou avise o João antes do merge.

## Perguntas e pendências (regra do João, 29/10/2026)
- Ao apresentar ao João perguntas, pendências ou divergências, diga **de que arquivo e seção** saiu cada uma, com o caminho relativo e a seção ou a linha. Exemplo: `../emagvalid-docs/contexto_agente/07-pendencias-e-decisoes.md`, seção B.
- Vale também ao resumir o relatório de um agente: não perca os arquivos que ele citou.
- Se a informação estiver em mais de um arquivo, liste todos. Se não estiver em nenhum, diga "não consta nos arquivos".

## Código
- Escopo: só o que o TAP prevê. Varredura de várias páginas, app móvel e certificação de conformidade integral estão fora.
- A nota (0–100) e as orientações da IA complementam a avaliação humana; nunca as apresente como certificação.
- A interface segue o eMAG 3.1/WCAG: teclado, foco visível, rótulos, contraste e alvos de 44 px ou mais.
- Tecnologias: até o Plano de Projeto v1.1 (13/11/2026), use só as previstas no TAP. Dependência nova fora delas, pergunte antes.
- Segredos (chave da API de IA, senha do banco) ficam em `.env`, fora do git. Exemplo em `.env.example`, sem valores reais.
