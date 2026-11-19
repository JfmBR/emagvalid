# Handoff — fim do dia 19/11/2026 (segunda sessão)

Antes de retomar, confira os arquivos, o `git status`, as checagens e os processos. Este registro é contexto, não prova.

## Objetivo

- **Projeto:** MVP do AcessaWeb (`PRODUCT.md`; guia em `docs/passo-a-passo-mvp.md`).
- **Feito até aqui:** Passos 3 a 7, com as PRs #21 a #30 mescladas na `main`. A #30 (Passo 7: nota, Tela 5, texto padrão e revisão humana) entrou em 19/11.
- **Aberta:** a PR da branch `feat/lista-de-urls`, que atende o pedido 3 do João:
  - a lista de até 10 links na Tela 3 (RF20);
  - a Tela 8 (Histórico) adiantada do Passo 10, com "Mostrar mais" e "Avaliar de novo";
  - o link do eMAG abrindo em nova aba.
- **Próximo:** o João faz o merge dessa PR. Depois vem a **PR 2, o PDF** (Passo 9), que começa por um design curto com o João.

## Estado verificado (19/11/2026)

| Item                | Valor                                                                                                                                                                                                                         |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` (origin)     | `160a5ba` (merge da #30)                                                                                                                                                                                                      |
| PR aberta           | `feat/lista-de-urls` (RF20, Tela 8, link em nova aba). Design em `docs/superpowers/specs/2026-11-19-lista-de-urls-design.md`                                                                                                  |
| `npm run verificar` | exit 0 na branch: API 214 testes, web 93, build ok                                                                                                                                                                            |
| `npm run test:e2e`  | 28 testes. Na rodada completa, o "tema claro" caiu uma vez por tempo (33 s, com a máquina carregada); sozinho, passou em 7,8 s. O e2e da avaliação passou depois da última mudança (4 de 4)                                   |
| Banco local         | Sem migração nova nesta PR. Contas `manual@gmail.com` (5 avaliações) e `teste.1794874572@exemplo.com` (não consta de onde veio). As contas de teste desta sessão foram apagadas                                               |
| Produção            | O próximo deploy leva ao Neon as migrações `20261118002249_avaliacao_url_final_pagina_grande` e `20261119142307_avaliacao_nota_e_revisao`. Depois dele, confirmar que o `Resolver` (DNS) funciona no Render e medir a memória |
| Processos           | Nenhum servidor aberto                                                                                                                                                                                                        |
| Branches locais     | `docs/fechamento-18-11`, `feat/excluir-conta`, `feat/tela-resultado`, `fix/barra-acessibilidade` e `fix/fila-e-pendentes` já entraram por squash (#26 a #30) e podem ser apagadas                                             |

## O que a PR de `feat/lista-de-urls` traz

Decisões do João (19/11), registradas em `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D:

- **Tela 3:**
  - "+ Adicionar outra página", até 10 links por envio;
  - cada link vira uma avaliação separada, sem nota do conjunto;
  - com 2 ou mais links, a pessoa vai para o histórico.
- **Limites:**
  - 10 análises por hora por conta, e cada link conta uma;
  - fila geral de 30;
  - a lista que não cabe é recusada inteira;
  - a regra "uma pendente por conta" saiu do pedido e só volta com o pagamento (continua na exclusão da conta);
  - cada link conta no limite de tentativas, e as recusas sem DNS devolvem as tentativas.
- **Tela 8** (`/avaliacoes`, link "Histórico" no cabeçalho): data, página, nota, situação ao vivo, "Ver resultado", "Avaliar de novo" e "Mostrar mais" de 20 em 20.
- **Link para outro site** (o do eMAG, na Tela 5): abre em nova aba, com "(abre em nova aba)" no texto, como o eMAG 1.9 pede.

## PR 2 · PDF (Passo 9), a fazer

Já decidido (`07`, seção D, 19/11):

- A conta ganha o campo `planoPago` (padrão: não), ligado à mão pelo grupo nas contas de demonstração e da banca. Sem ele, o PDF aparece bloqueado, com o aviso do RF21. A migração é gerada com `--create-only`, e o SQL é mostrado ao João antes de aplicar.
- O PDF é gerado pelo Playwright (`page.pdf()`), sem biblioteca nova. O trecho da página avaliada entra sempre escapado, e o Chromium do PDF roda sem JavaScript e sem rede.
- O endpoint exige conta, ser dono, análise concluída e `planoPago`, e tem limite próprio, porque é caro.
- "Baixar PDF" entra no histórico e na Tela 5.

A decidir no design com o João: a Tela 7 (prévia) e o que entra no PDF antes das orientações da IA (Passo 8). A correção sai do texto padrão em `apps/api/src/emag/textos.ts`.

## Pedidos do João (18/11)

1. Resultado com quais falhas e por quê: feito (#30).
2. Interatividade: feito (#25 e #27).
3. Várias URLs na mesma aba: na PR aberta.

## Pendências

**Teste manual do João**

- Escuta da Tela 5 no Orca, depois dos ajustes de leitura: do fim da análise até dentro de "Como chegamos", e o resto do roteiro (abas, caixas, erro ao marcar). Roteiro em `docs/design.md`, "Leitura pelo leitor de tela nas Telas 4 e 5". Use uma avaliação nova.
- Ouvir a Tela 3 com vários campos e a Tela 8 no Orca (não foram ouvidas).
- Alt+1, Alt+2 e Alt+4 no Chrome e no Firefox do Linux (`docs/design.md`, barra de acessibilidade).

**Grupo**

- Revisar os 45 textos padrão em `apps/api/src/emag/textos.ts` (`07`, seção D, 19/11). Os nomes de 6.5 a 6.8 ainda vêm de um resumo, não do PDF oficial do eMAG.

**Para o mentor** (`07`, seção E):

- O tempo de acordar do Render (52,8 s) somado à análise passa dos 60 s do RNF06.
- Sites lentos dão DEMOROU (RNF06, R7).
- Avisar o cálculo da nota e o arredondamento para baixo.

**Riscos e pequenos ajustes adiados**

- O Chromium roda com `--no-sandbox` (relatório privado `../acessaweb-privado/relatorios/revisao-final-passo-6-2026-11-18.md`).
- A regra do tema existe em dois lugares (`apps/web/src/tema.ts` e `apps/web/public/tema-inicial.js`; o `tema.test.ts` confere que batem).
- Na Tela 5, a conta da nota lê a prioridade e o peso atuais, não os gravados (`shortcut:` em `apps/api/src/analise/resultado.ts`).
- O e2e "tema claro" fica perto do limite de 30 s com a máquina carregada.

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

1. O João faz o merge da PR de `feat/lista-de-urls` (squash).
2. Nova sessão: confira `git status`, a `main` e `npm run verificar`. Crie a branch `feat/relatorio-pdf` e comece pelo design curto do PDF com o João (Tela 7 e conteúdo), antes de codar.
