# Handoff — fim do dia 19/11/2026 (terceira sessão)

Antes de retomar, confira os arquivos, o `git status`, as checagens e os processos. Este registro é contexto, não prova.

## Objetivo

- **Projeto:** MVP do AcessaWeb (`PRODUCT.md`; guia em `docs/passo-a-passo-mvp.md`).
- **Feito até aqui:** Passos 3 a 7 e a lista de URLs, com as PRs #21 a #31 mescladas na `main`. A #31 (RF20, Tela 8, link do eMAG em nova aba) entrou em 19/11.
- **Aberta:** a PR #32 (`feat/relatorio-pdf`), com o Passo 9 (PDF, RF12, RF13, RF21). Os checks `verificar` e `e2e` do CI passaram. Design em `docs/superpowers/specs/2026-11-19-relatorio-pdf-design.md`; plano em `docs/superpowers/plans/2026-11-19-relatorio-pdf.md`.
- **Próximo:** o João faz o merge da #32. Depois, automatizar parte da revisão humana (Pendências) ou o Passo 8 (IA).

## Estado verificado (19/11/2026)

| Item                        | Valor                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` (origin)             | `8a588fc` (merge da #31)                                                                                                                                                                                                                                                                                                                            |
| Branch `feat/relatorio-pdf` | Commits da `ac68905` (design) à `8dd2739` (achados menores do `/code-review`), no GitHub na PR #32, com o CI passando                                                                                                                                                                                                                               |
| `npm run verificar`         | exit 0 na branch: API 244 testes, web 108, build ok                                                                                                                                                                                                                                                                                                 |
| `npm run test:e2e`          | 30 de 30                                                                                                                                                                                                                                                                                                                                            |
| PDF de verdade              | Exemplo com 51 falhas: 8 páginas A4, "Página X de 8" no rodapé, trecho longo quebrando, `<script>` como texto, `pdfinfo` com `Tagged: yes` (`docs/quality.md`)                                                                                                                                                                                      |
| Banco local                 | Migração `20261119184305_usuario_plano_pago` aplicada, com o ok do João ao SQL. Nenhuma conta tem `planoPago` ligado                                                                                                                                                                                                                                |
| Produção                    | O próximo deploy leva ao Neon as migrações `20261118002249_avaliacao_url_final_pagina_grande`, `20261119142307_avaliacao_nota_e_revisao` e `20261119184305_usuario_plano_pago`. Depois dele: ligar `planoPago` nas contas de demonstração e da banca, confirmar o `Resolver` (DNS) no Render e medir a memória com a análise e o PDF ao mesmo tempo |
| Processos                   | Nenhum servidor aberto                                                                                                                                                                                                                                                                                                                              |
| Branches locais             | `docs/fechamento-18-11`, `feat/excluir-conta`, `feat/tela-resultado`, `fix/barra-acessibilidade`, `fix/fila-e-pendentes` e `feat/lista-de-urls` já entraram por squash (#26 a #31) e podem ser apagadas                                                                                                                                             |

## O que a branch `feat/relatorio-pdf` traz

Decisões do João (19/11), registradas em `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D:

- **Sem Tela 7:** "Baixar PDF" fica na Tela 5, junto da nota, com "K de T itens conferidos" e o atalho "Ir para a revisão humana", e em cada linha concluída da Tela 8.
- **Conteúdo:** cabeçalho, aviso de que não é certificação, resumo, uma caixa por recomendação com todas as ocorrências, revisão humana com o que foi conferido e "Como chegamos na nota". Sem nome de auditor.
- **Geração:** na hora do clique, um por vez, sem guardar. Chromium sem JavaScript e sem rede, teto de 20 s, 10 PDFs por hora por conta.
- **Plano pago:** campo `planoPago` na conta, ligado à mão. Sem ele, o botão fica bloqueado (`aria-disabled`, no Tab) com o aviso do RF21.
- **Correções do `/code-review`:**
  - o PDF espera a marcação da revisão ser gravada;
  - o arquivo baixado só é solto 1 s depois do clique (Safari e Firefox);
  - o teto de 20 s vale também para abrir o Chromium;
  - trecho vazio não vira caixa vazia;
  - a conta sem plano não lê a frase sobre o PDF;
  - o erro do PDF na Tela 8 fica num `div`;
  - a Tela 5 remonta ao trocar de avaliação.

## Pedidos do João (18/11)

1. Resultado com quais falhas e por quê: feito (#30).
2. Interatividade: feito (#25 e #27).
3. Várias URLs na mesma aba: feito (#31).

## Pendências

**Teste manual do João**

- Escuta da Tela 5 no Orca, depois dos ajustes de leitura: do fim da análise até dentro de "Como chegamos", e o resto do roteiro (abas, caixas, erro ao marcar). Roteiro em `docs/design.md`, "Leitura pelo leitor de tela nas Telas 4 e 5". Use uma avaliação nova. Agora o Tab passa por "Baixar PDF" e "Ir para a revisão humana" antes de "Como chegamos".
- Ouvir a Tela 3 com vários campos e a Tela 8 no Orca (não foram ouvidas).
- Ouvir um PDF baixado no Orca ou no NVDA.
- Baixar o PDF no Firefox (a correção do `revokeObjectURL` não foi testada num navegador de verdade; o e2e usa o Chromium).
- Alt+1, Alt+2 e Alt+4 no Chrome e no Firefox do Linux (`docs/design.md`, barra de acessibilidade).

**Grupo**

- Revisar os 45 textos padrão em `apps/api/src/emag/textos.ts` (`07`, seção D, 19/11). Os nomes de 6.5 a 6.8 ainda vêm de um resumo, não do PDF oficial do eMAG. Esses textos também vão para o PDF.

**Para o mentor** (`07`, seção E):

- O tempo de acordar do Render (52,8 s) somado à análise passa dos 60 s do RNF06.
- Sites lentos dão DEMOROU (RNF06, R7).
- Avisar o cálculo da nota e o arredondamento para baixo.

**Achados menores do `/code-review` do PDF:** os 5 foram corrigidos com teste, a pedido do João (19/11). Ficou só a decisão de não registrar em log o 403 (sem plano) e o 429 do PDF: o plano é regra de produto, não acesso a dado de outra conta.

**Riscos e pequenos ajustes adiados**

- O Chromium roda com `--no-sandbox` (relatório privado `../acessaweb-privado/relatorios/revisao-final-passo-6-2026-11-18.md`). O do PDF também, mas sem JavaScript.
- A regra do tema existe em dois lugares (`apps/web/src/tema.ts` e `apps/web/public/tema-inicial.js`; o `tema.test.ts` confere que batem).
- Na Tela 5 e no PDF, a conta da nota lê a prioridade e o peso atuais, não os gravados (`shortcut:` em `apps/api/src/analise/resultado.ts`).
- O e2e "tema claro" fica perto do limite de 30 s com a máquina carregada.
- A lista de migrações em `docs/architecture.md` ("Dados e migrações") está desatualizada.

**Automatizar parte da revisão humana** (decisão do João, 19/11: depois do PDF):

- aplicabilidade pelo HTML da página: 5.2 e 5.3 (áudio e vídeo), 6.4 a 6.8 (formulário), 1.6 (tabela) e 3.8 (links para documentos);
- indícios: 1.9 (`target="_blank"` sem aviso), 6.7 (radios fora de `fieldset`) e 6.8 (CAPTCHA conhecido);
- nada disso entra na nota.

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

1. O João faz o merge da PR #32 (squash). Na PR ficaram abertos dois itens do checklist: o leitor de tela e o `03` com a situação do marco.
2. Depois do deploy: ligar `planoPago` nas contas de demonstração e medir a memória no Render.
3. Nova sessão: confira `git status`, a `main` e `npm run verificar`, e escolha com o João entre a automação da revisão humana e o Passo 8 (IA).
