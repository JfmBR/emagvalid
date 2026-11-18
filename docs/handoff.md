# Handoff — Passo 6 implementado, falta a revisão final (17/11/2026)

Antes de retomar, confira os arquivos, o `git status`, as checagens e os processos. Este registro é contexto, não prova.

## Objetivo

- **Projeto:** MVP do AcessaWeb (`PRODUCT.md`; guia em `docs/passo-a-passo-mvp.md`).
- **Feito até aqui:** Passos 3, 4 e 5; PR #21 (senha com letra e número). Passo 6 (nova avaliação e análise, Telas 3 e 4) implementado na branch `feat/nova-avaliacao`, sem push.
- **Próximo:** revisão final de segurança da branch inteira do Passo 6, depois a PR.

## Estado verificado (17/11/2026)

| Item                | Valor                                                                                                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main` (origin)     | `7361b78` (merge da #21). Nenhuma PR aberta                                                                                                                                                                              |
| Branch              | `feat/nova-avaliacao`, HEAD `0e1297a`, 18 commits sobre `fbf2b10`; **ainda não tem a #21** (rebasear sobre a `main` antes da PR). Sem push                                                                               |
| Plano               | `docs/superpowers/plans/2026-11-17-passo-6-nova-avaliacao.md` (Tasks 1–9 feitas)                                                                                                                                         |
| `npm run verificar` | exit 0: API 148 testes, web 39, build ok                                                                                                                                                                                 |
| `npm run test:e2e`  | 8 de 8                                                                                                                                                                                                                   |
| Banco local         | migração nova `20261118002249_avaliacao_url_final_pagina_grande` aplicada; conta de teste `teste.passo6.32166@exemplo.com` com 1 avaliação real (`https://www.python.org/`, `CONCLUIDA`, 100 falhas), criada pelo agente |
| Produção            | sem mudança: a migração nova entra no Neon no próximo deploy                                                                                                                                                             |
| Processos           | nenhum servidor aberto; portas 3000, 5173 e 4173 livres                                                                                                                                                                  |
| Rascunho local      | `.superpowers/sdd/2026-11-17-passo-6-nova-avaliacao/` (fora do git): ledger `progress.md`, briefs, relatórios e diffs de cada tarefa                                                                                     |

## O que o Passo 6 entregou

- **API:** `POST /api/avaliacoes` e `GET /api/avaliacoes/:id` (`apps/api/src/rotas/avaliacoes.ts`); fila em memória com uma análise por vez e recuperação no boot (`analise/fila.ts`, `analise/executar.ts`); falhas gravadas por requisito do eMAG (até 50 por regra, trecho de até 1.000 caracteres).
- **Limites:** 10 análises por hora e uma pendente por conta; 30 pedidos por conta e 60 por IP em 15 min, contados antes do DNS.
- **Proteção da análise** (`analise/analisar.ts`, `analise/rede.ts`, `analise/endereco.ts`): endereço público conferido em cada pedido, em cada redirecionamento e na conexão (`lookup`), o que fecha o DNS rebinding; Chromium sem rede própria e sem `DATABASE_URL` no ambiente; tetos de 5 MB por recurso e 50 MB por análise, contados depois de descomprimir; 60 s no total.
- **Telas:** Tela 3 (`paginas/NovaAvaliacao.tsx`) e Tela 4 com fila, 3 passos, página grande, erro e concluída (`paginas/Analise.tsx`); sessão expirada leva a `/entrar`.
- **Prova real:** `http://localhost:3000` recusado no campo; `www.python.org` concluiu em ~30 s com 100 falhas no banco.
- Detalhes: `docs/architecture.md`; medições em `apps/api/src/analise/executar.ts` (`LIMITE_PAGINA_GRANDE` = 10.000).

## Decisões tomadas pelo agente durante a execução (o João revisa)

1. Quem implementa não commita; o coordenador commita por tarefa (regra do projeto).
2. `.superpowers/` no `.prettierignore`.
3. Mais faixas IPv6 bloqueadas (`::/96`, `::ffff:0:0:0/96`, `2002::/16`, `2001::/32`, `64:ff9b:1::/48`, `100::/64`).
4. Análise busca as páginas pelo Node (`node:http`/`https`) em vez do `route.fetch`, por causa de bomba de descompressão; isso também fechou o DNS rebinding.
5. Limitadores de 30/15 min por conta e 60/15 min por IP no POST, e nova ordem (recusas baratas antes do DNS).
6. Log de erro desconhecido com `name` e `code`, nunca a mensagem nem a URL.
7. Sessão expirada (401) nas Telas 3 e 4 leva a `/entrar`.
8. `axe-core ~4.14.0` declarado em `apps/api/package.json` (já vinha do `@axe-core/playwright`).
9. `LIMITE_PAGINA_GRANDE` de 3.000 para 10.000 (medição fraca: 5 páginas, um IP).

## Pendências

**Riscos abertos do Passo 6**

- **Sites lentos dão DEMOROU:** 5 de 11 páginas reais (gov.br, g1, Sebrae, Correios, BBC) passaram dos 60 s nesta rede; a análise espera o `load` e todo recurso passa pelo Node. Medir no Render. Mudar (por exemplo, analisar o que carregou depois de X s) mexe no RNF06 e no R7: decisão do João.
- Chromium com `--no-sandbox` (padrão do Playwright): uma exploração do renderer roda com o usuário da API (`docs/architecture.md`).
- Achados Minor adiados das revisões por tarefa (lista no ledger): stream não destruída no erro do descompressor; bytes comprimidos não contados; `deflate` cru abortado; `fila.ts` e `app.ts` logam o erro inteiro; avaliação presa em `ANALISANDO` se o banco cair no meio; `falhas` sem `orderBy` (Passo 7); 4xx além de 401/404 repete a cada 2 s na Tela 4.

**Do João**

- Registrar em `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D, as decisões de 17/11: fila com uma análise por vez; 10 análises por hora por conta; tempo de acordar do Render como está; "Excluir minha conta" depois do Passo 6; limites por IP de login e cadastro mantidos; exceção da lista de bloqueio contra SSRF. E a de 18/11: senha com maiúscula, minúscula, número e símbolo (#22), no lugar de "letra e número" (#21).
- Teste manual da branch depois da revisão final e do rebase (pedido do João, 18/11).

Feito em 18/11: linhas de `avaliacoes` e `falhas` conferidas pelo agente com `psql` (o João não usa mais o DBeaver; para ver os dados, `npm run db:studio -w apps/api`); conta `teste.passo6.32166@exemplo.com` apagada do banco local, com a avaliação e as falhas (cascade).

- Levar ao mentor o tempo de acordar do Render e o DEMOROU dos sites lentos (RNF06, R7).

**Depois do Passo 6:** função "Excluir minha conta" (LGPD). **Depois do MVP** (`07`, seção D, 16/11): o cadastro diz quando o e-mail já tem conta; `scrypt` com N=2^14; limpeza das sessões vencidas; confirmação de e-mail; imagem sem dependências de desenvolvimento; papel do banco só para a API.

## Bloqueios

Nenhum.

## Próxima ação

1. Revisão final da branch `feat/nova-avaliacao` (modelo mais capaz, skill `differential-review`), triando os Minor adiados do ledger; relatório em `../acessaweb-privado/relatorios/`. Uma rodada de correção e uma re-revisão.
2. Rebasear a branch sobre a `main` (`7361b78`), rodar `npm run verificar` e `npm run test:e2e`.
3. Com o pedido do João: push e PR com o checklist de `.github/pull_request_template.md`.
