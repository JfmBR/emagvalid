# AcessaWeb · Grupo 3

Instruções para qualquer agente de IA neste repositório. O `CLAUDE.md` importa este arquivo e acrescenta só o que é do Claude Code.

## Produto e stack

- Produto, escopo e aceite: `PRODUCT.md`. Contexto completo do projeto: `projeto/contexto_agente/00-indice.md` (abra só o que a tarefa pedir).
- Sistema de design (cores, fontes, componentes, marca): `design-system/README.md`.
- Stack: npm workspaces; `apps/web` (React 19.3, Vite 8, TypeScript 7); `apps/api` (Node.js 26, Express 5.3, Prisma 7.10, PostgreSQL 17 no Docker); análise com Playwright 1.64 e axe-core 4.14; Vitest 5; oxlint 1.91; Prettier 3.9. Detalhes: `docs/architecture.md`.
- Preparação da máquina: `docs/instalacao.md`. Ferramentas de IA e evidências do setup: `docs/setup.md`.

## Comandos canônicos

- Instalar: `npm ci`
- Desenvolver: `npm run dev` (web em `localhost:5173`, API em `localhost:3000`); banco: `npm run db:up` e `npm run db:migrate -w apps/api`
- Lint: `npm run lint` · Formatação: `npm run format:check` · Tipos: `npm run typecheck`
- Testes: `npm test` (Vitest nas duas partes)
- Build: `npm run build`
- Documentação: `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar` (precisa sair com 0 antes de commit em `projeto/`)
- Tudo de uma vez (o mesmo que o CI roda): `npm run verificar`
- Telas no navegador, com axe e teclado: `npm run test:e2e`

## Acordos de trabalho

- Leia as instruções e o código envolvido antes de editar. Diga as suposições que mudam comportamento ou escopo.
- Faça a menor mudança que resolve o pedido inteiro. Reuse padrões, componentes e dependências que já existem; não crie abstração, opção ou dependência sem pedido.
- Defina antes como provar que funciona: teste para lógica nova e para cada correção (reproduza o erro primeiro). Mudança trivial não precisa de teste que só repete o código.
- Preserve validação, tratamento de erro, segurança, acessibilidade e mudanças locais de outras pessoas.
- Não transforme suposição em fato nem integração pendente em resultado. Instalar uma ferramenta não autoriza publicar, gastar ou mandar mensagem.
- Atualize o documento responsável junto com a mudança: escopo em `PRODUCT.md`, estrutura em `docs/architecture.md`, interface em `docs/design.md`, checagens em `docs/quality.md`, preparação em `docs/instalacao.md`.
- Escopo do MVP: só o que o TAP prevê. A nota (0–100) e as orientações da IA complementam a avaliação humana; nunca as apresente como certificação.
- A interface segue o eMAG 3.1/WCAG: teclado, foco visível, rótulos, contraste e alvos de 44 px ou mais. Uma ferramenta de acessibilidade não pode ser inacessível.
- Nomes do domínio em pt-BR (`avaliacao`, `falha`, `rotas/saude.ts`), como no código existente. Comentários em pt-BR.
- Segredos só no `.env` (fora do git); exemplo sem valores reais em `.env.example`.
- Tecnologias: até o Plano de Projeto v1.1 (13/11/2026), só as previstas no TAP. Dependência nova fora delas, pergunte antes.
- O esquema do banco (`apps/api/prisma/schema.prisma`) é proposta inicial; mudança nele entra como migração (`npm run db:migrate -w apps/api`), nunca direto no banco.

## Privacidade

- O repositório é público. Integrantes e mentores aparecem com nome e sobrenome; entrevistados, só pelo código (A1–A3, Ctx1–Ctx4).
- Não entram: links do Drive, do Google Docs, do Figma ou de artifacts; os .docx com dados de entrevistados; as planilhas RACI. Eles ficam na pasta privada `../acessaweb-privado/`.
- Relatórios de segurança e de avaliação do harness vão para `../acessaweb-privado/relatorios/`, nunca para o repositório.

## Continuidade

- Durante um trabalho autorizado, responda perguntas de status e siga. Pare se o João pedir pausa, cancelar ou mudar o objetivo.
- Um bloqueio para só o que depende dele; termine o que é independente e seguro.
- Não repita uma tentativa idêntica sem evidência nova. Ao retomar de um registro, confira os arquivos, o `git status`, as checagens e os processos reais antes de confiar nele.
- Trabalho que atravessa sessões ganha um registro curto (objetivo, estado verificado, checagens, pendências, próxima ação) no plano da tarefa; modelo em `docs/setup.md`.

## Git e colaboração

- Antes de alterar arquivos, rode `git status`; se houver mudanças sem commit, faça um commit de restauração.
- Nunca commit direto na `main`. Branch curta a partir da `main`: `feat/`, `fix/` ou `docs/` + nome em pt-BR. Mensagem em pt-BR: `tipo: descrição curta`.
- Ao terminar, diga o que ficou sem commit.
- Push, PR e merge só com pedido do João. Ao abrir uma PR, dê `git pull` antes e preencha o checklist de `.github/pull_request_template.md`. A `main` é protegida (check `verificar` do CI); o merge é por squash, feito pelo João como administrador. Equipe atual: João Francisco, Luiz Felipe e Luis Otavio.
- Ao apresentar perguntas ou pendências ao João, cite o arquivo e a seção de onde saíram; se não estiver em nenhum, diga "não consta nos arquivos".
- Sem hooks de Git, bloqueios de push ou exigência de worktree.

## Ferramentas

- **Superpowers:** use as skills de processo (brainstorming, planos, TDD, depuração, verificação) na medida do tamanho da tarefa.
- **Ponytail** (nível `full`): menor mudança completa. **Caveman:** conversa concisa em pt-BR; código, documentação e commits em pt-BR normal. Desligam com `stop ponytail` e `stop caveman`.
- **Context7:** documentação atual de bibliotecas (Prisma 7, Express 5, Vite, Playwright…). Uma consulta por conceito; nunca envie segredos ou código privado.
- **RTK:** já age por hook global; não prefixe comandos à mão. `rtk proxy <comando>` mostra a saída original.
- **Graphify:** use o grafo (`graphify-out/`, local) para perguntas de estrutura; regenere com o comando de `docs/setup.md`. Grafo velho é evidência fraca.
- **Skills do projeto** (`.claude/skills/`, travadas em `skills-lock.json`): `web-design-guidelines` antes de entregar tela; `vercel-react-best-practices` e `vercel-composition-patterns` ao escrever React; `supabase-postgres-best-practices` em esquema, SQL e migração; `differential-review` em mudança sensível de segurança; `writing-guidelines` ao revisar documentação; `find-skills` só quando faltar uma capacidade concreta.
- **Navegador:** `agent-browser` para abrir e usar as telas e ler a árvore de acessibilidade; Chrome DevTools MCP para console, rede e desempenho. Só em `localhost`, nunca em produção nem com sessões pessoais. Quando usar cada um: `docs/quality.md`.
- Revisão de segurança: `docs/prompts/revisao-de-seguranca.md`, só leitura, relatório privado.

## Delegação e revisão

- Delegue só quando isolar contexto, especializar ou paralelizar trabalho independente compensar. Tarefa simples se faz direto.
- Escolha o modelo mais leve que cumpre o critério de aceite: buscas e inventários, leve; implementação delimitada e revisão de comportamento, intermediário; arquitetura, segurança, dados pessoais, migração e diagnóstico ambíguo, o mais capaz. Não troque de provedor nem ative cobrança.
- Cada tarefa delegada recebe objetivo, contexto mínimo, arquivos permitidos, critério de aceite e checagens. Um escritor por arquivo; lockfile, configuração compartilhada e Git ficam com quem coordena. Revisores só leem. Protocolo de ondas: `.claude/rules/parallel-subagent-driven-development.md`.
- Confira o diff e rode as checagens antes de aceitar o resultado de um subagente.
- Mudança não trivial recebe revisão independente, com escopo pelo risco real; pare quando os achados relevantes estiverem resolvidos ou decididos e as checagens passarem. Número de rodadas não prova correção.
