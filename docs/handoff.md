# Handoff — Passo 6 revisado e em PR (18/11/2026)

Antes de retomar, confira os arquivos, o `git status`, as checagens e os processos. Este registro é contexto, não prova.

## Objetivo

- **Projeto:** MVP do AcessaWeb (`PRODUCT.md`; guia em `docs/passo-a-passo-mvp.md`).
- **Feito até aqui:** Passos 3, 4 e 5; #21 e #22 (senha com maiúscula, minúscula, número e símbolo); #23 (teste instável do cadastro). Passo 6 (nova avaliação e análise, Telas 3 e 4) revisado, rebaseado e em PR.
- **Próximo:** os pedidos do João de 18/11 (abaixo), um design de cada vez.

## Estado verificado (18/11/2026)

| Item                | Valor                                                                                                                                        |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` (origin)     | `11db56f` (merge da #23)                                                                                                                     |
| Branch              | `feat/nova-avaliacao`, 22 commits sobre `11db56f`, com push e PR aberta                                                                      |
| Plano               | `docs/superpowers/plans/2026-11-17-passo-6-nova-avaliacao.md` (Tasks 1–9 feitas)                                                             |
| Revisão final       | `../acessaweb-privado/relatorios/revisao-final-passo-6-2026-11-18.md`: 3 Important corrigidos, re-revisão com 1 Minor novo, também corrigido |
| `npm run verificar` | exit 0: API 157 testes, web 39, build ok                                                                                                     |
| `npm run test:e2e`  | 8 de 8                                                                                                                                       |
| Teste manual        | feito pelo João em 18/11: `python.org` (100 falhas) e `acessaweb.onrender.com` (0 falhas), as duas `CONCLUIDA`                               |
| Produção            | sem mudança: a migração `20261118002249_avaliacao_url_final_pagina_grande` entra no Neon no próximo deploy                                   |
| Rascunho local      | `.superpowers/sdd/2026-11-17-passo-6-nova-avaliacao/` (fora do git): ledger `progress.md`, briefs, relatórios                                |

## O que o Passo 6 entregou

- **API:** `POST /api/avaliacoes` e `GET /api/avaliacoes/:id` (`apps/api/src/rotas/avaliacoes.ts`); fila em memória com uma análise por vez e recuperação no boot (`analise/fila.ts`, `analise/executar.ts`); falhas gravadas por requisito do eMAG (até 50 por regra; trecho e seletor de até 1.000 caracteres, sem caractere nulo).
- **Limites:** 10 análises por hora e uma pendente por conta (pendente com mais de 15 min que saiu da fila não conta); 30 pedidos por conta e 60 por IP em 15 min, contados antes do DNS.
- **Proteção da análise** (`analise/analisar.ts`, `analise/rede.ts`, `analise/endereco.ts`): endereço público conferido em cada pedido, em cada redirecionamento e na conexão, o que fecha o DNS rebinding; DNS pelo `Resolver` (c-ares, fora do threadpool, 3 s por consulta); no máximo 50 hosts por análise; Chromium sem rede própria e sem `DATABASE_URL` no ambiente; tetos de 5 MB por recurso e 50 MB por análise; 60 s no total.
- **Telas:** Tela 3 (`paginas/NovaAvaliacao.tsx`) e Tela 4 com fila, 3 passos, página grande, erro e concluída (`paginas/Analise.tsx`).
- Detalhes: `docs/architecture.md`.

## Pedidos do João (18/11/2026), na ordem proposta

1. **Resultado com os erros e o porquê:** é o Passo 7 (Tela 5) mais o texto padrão do Passo 8 ("por que é falha" e exemplo, sem IA). A IA só complementa; o resultado não pode depender dela.
2. **Interatividade:** resposta visual ao passar o mouse nos botões; botão para alterar o contraste (pessoas com baixa visão).
3. **Várias URLs na mesma aba:** botão "+" na Tela 3 que cria outro campo e põe na fila. É o RF20 (prioridade baixa, "se houver tempo"); conflita com "uma pendente por conta" e com o limite de 10 por hora (RNF10).

## Pendências

**Riscos abertos**

- **Sites lentos dão DEMOROU:** 5 de 11 páginas reais passaram dos 60 s nesta rede. Medir no Render. Mudar mexe no RNF06 e no R7: decisão do João.
- Chromium com `--no-sandbox`: uma exploração do renderer lê o ambiente da API (`docs/architecture.md`).
- Da revisão final (relatório privado, seções 5 e 7): fila global sem teto; Tela 4 de uma pendente morta pergunta para sempre; `EAI_AGAIN` em `analise/rede.ts` virou código morto; depois do deploy, confirmar que o `Resolver` resolve nomes no Render e medir o pico de memória.

**Do João**

- Registrar em `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D, as decisões de 17/11: fila com uma análise por vez; 10 análises por hora por conta; tempo de acordar do Render como está; "Excluir minha conta" depois do Passo 6; limites por IP de login e cadastro mantidos; exceção da lista de bloqueio contra SSRF. E a de 18/11: senha com maiúscula, minúscula, número e símbolo (#22), no lugar de "letra e número" (#21).
- Levar ao mentor o tempo de acordar do Render e o DEMOROU dos sites lentos (RNF06, R7).
- Mesclar a PR do Passo 6.

**Depois do Passo 6:** função "Excluir minha conta" (LGPD). **Depois do MVP** (`07`, seção D, 16/11): o cadastro diz quando o e-mail já tem conta; `scrypt` com N=2^14; limpeza das sessões vencidas; confirmação de e-mail; imagem sem dependências de desenvolvimento; papel do banco só para a API.

## Bloqueios

Nenhum.

## Próxima ação

1. Design do pedido 1 (Tela 5 com falhas e texto padrão), com aprovação do João antes de codar.
2. Depois, os pedidos 2 e 3, um design de cada vez.
