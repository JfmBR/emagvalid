# Handoff — fim do dia 19/11/2026

Antes de retomar, confira os arquivos, o `git status`, as checagens e os processos. Este registro é contexto, não prova.

## Objetivo

- **Projeto:** MVP do AcessaWeb (`PRODUCT.md`; guia em `docs/passo-a-passo-mvp.md`).
- **Feito até aqui:** Passos 3 a 6, as PRs #21 a #29 mescladas na `main`, e a PR #30 (Passo 7) aberta. Em 19/11:
  - entraram na `main`: os atalhos Alt + número e os ajustes de tema da barra (#27); o teto de 10 na fila, a pendente morta que vira ERRO depois de 10 min e o DNS do c-ares (#28); a tela "Minha conta" com "Excluir minha conta" (LGPD, #29);
  - ficou aberta a **PR #30** (`feat/tela-resultado`, 14 commits): o Passo 7 inteiro, com a nota, a Tela 5, o texto padrão do eMAG e a revisão humana. Ela atende o pedido 1 do João (resultado com as falhas e o porquê, sem depender da IA).
- **Próximo:** o João faz o merge da #30. Depois, confirmar com ele qual é o próximo passo (ver "Próxima ação").

## Estado verificado (19/11/2026)

| Item                | Valor                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` (origin)     | `4eb65d3` (merge da #29)                                                                                                                                                                                                      |
| PR aberta           | #30, `feat/tela-resultado`. CI `verificar` e `e2e` verdes no commit `f8f1f5b`; o commit deste handoff entra depois                                                                                                            |
| `npm run verificar` | exit 0 na #30: API 203 testes, web 83, build ok                                                                                                                                                                               |
| `npm run test:e2e`  | 24 de 24 na #30                                                                                                                                                                                                               |
| Banco local         | Migração `20261119142307_avaliacao_nota_e_revisao` aplicada. Contas `manual@gmail.com` (5 avaliações, 3 com nota; as 2 antigas ficam sem nota) e `teste.1794874572@exemplo.com` (não consta de onde veio)                     |
| Produção            | O próximo deploy leva ao Neon as migrações `20261118002249_avaliacao_url_final_pagina_grande` e `20261119142307_avaliacao_nota_e_revisao`. Depois dele, confirmar que o `Resolver` (DNS) funciona no Render e medir a memória |
| Processos           | Nenhum servidor aberto                                                                                                                                                                                                        |
| Branches locais     | `docs/fechamento-18-11`, `feat/excluir-conta`, `fix/barra-acessibilidade` e `fix/fila-e-pendentes` já entraram por squash (#26 a #29) e podem ser apagadas                                                                    |

## O que a PR #30 traz

- **Nota** (`apps/api/src/analise/nota.ts`): `100 × pesos aprovados ÷ pesos aplicáveis`, arredondada para baixo. A análise grava as regras aplicáveis e as em dúvida do axe-core.
- **Tela 5** (`apps/web/src/paginas/Resultado.tsx`, na rota `/avaliacoes/:id` ao concluir): nota, aviso "Não é certificação", "Como chegamos", abas, cartões por requisito e revisão humana gravada no banco (`POST /api/avaliacoes/:id/revisao`).
- **Texto padrão** (`apps/api/src/emag/textos.ts`): rascunho do Claude para as 45 recomendações, com as dúvidas decididas pelo João.
- **Leitura pelo leitor de tela:** ajustada depois do primeiro teste no Orca (`docs/design.md`, "Leitura pelo leitor de tela nas Telas 4 e 5").
- Decisões de 19/11 em `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D.

## Pedidos do João (18/11)

1. **Resultado com quais falhas e por quê:** na PR #30.
2. **Interatividade:** feita na #25 e na #27.
3. **Várias URLs na mesma aba:** um botão "+" na Tela 3 que acrescenta outro campo e põe na fila.
   - É o RF20 (prioridade baixa, "se houver tempo").
   - Conflita com a regra de uma análise pendente por conta e com o limite de 10 por hora (RNF10). Decidir no design.

## Pendências

**Teste manual do João**

- Escuta da Tela 5 no Orca, depois dos ajustes: do fim da análise até dentro de "Como chegamos", e o resto do roteiro (abas, caixas, erro ao marcar). Roteiro em `docs/design.md`, "Leitura pelo leitor de tela nas Telas 4 e 5". Use uma avaliação nova, porque as antigas não têm nota.
- Alt+1, Alt+2 e Alt+4 no Chrome e no Firefox do Linux (`docs/design.md`, barra de acessibilidade).
- Ouvir a barra de acessibilidade no Orca.

**Grupo**

- Revisar os 45 textos padrão em `apps/api/src/emag/textos.ts` (`07`, seção D, 19/11). Os nomes de 6.5 a 6.8 ainda vêm de um resumo, não do PDF oficial do eMAG.

**Para o mentor** (`projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção E):

- O tempo de acordar do Render (52,8 s) somado à análise passa dos 60 s do RNF06.
- Sites lentos dão DEMOROU (RNF06, R7).
- Avisar o cálculo da nota decidido (`07`, seção B) e o arredondamento para baixo.

**Riscos e pequenos ajustes adiados**

- O Chromium roda com `--no-sandbox` (relatório privado `../acessaweb-privado/relatorios/revisao-final-passo-6-2026-11-18.md`).
- A regra do tema existe em dois lugares (`apps/web/src/tema.ts` e `apps/web/public/tema-inicial.js`; o `tema.test.ts` confere que batem).
- Na Tela 5, a conta da nota lê a prioridade e o peso atuais, não os gravados (`shortcut:` em `apps/api/src/analise/resultado.ts`).

**Depois do MVP** (`07`, seção D, 16/11):

- o cadastro diz quando o e-mail já tem conta;
- `scrypt` com N=2^14;
- limpeza das sessões vencidas;
- confirmação de e-mail;
- imagem sem dependências de desenvolvimento;
- papel do banco só para a API.

## Bloqueios

Nenhum.

## Próxima ação

1. O João faz o merge da PR #30 (squash) e, se quiser, publica. Isso fecha o item "Publicar" do Passo 7.
2. Confirmar com o João o próximo passo. Pela ordem dos pedidos de 18/11, é o pedido 3 (RF20, botão "+"), começando pela decisão sobre a regra de uma pendente por conta. Pelo guia `docs/passo-a-passo-mvp.md`, é o Passo 8 (orientações da IA, Tela 6, 25–27/11), que agora já tem o texto padrão para usar quando a IA falhar.
