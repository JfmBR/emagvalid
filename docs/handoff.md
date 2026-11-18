# Handoff — fim do dia 18/11/2026

Antes de retomar, confira os arquivos, o `git status`, as checagens e os processos. Este registro é contexto, não prova.

## Objetivo

- **Projeto:** MVP do AcessaWeb (`PRODUCT.md`; guia em `docs/passo-a-passo-mvp.md`).
- **Feito até aqui:** Passos 3 a 6 e as PRs #21 a #25, todas mescladas na `main`. Em 18/11 entraram:
  - a senha forte (#22);
  - a correção de um teste instável (#23);
  - o Passo 6 (#24);
  - a barra de acessibilidade do eMAG com alto contraste, modo escuro e resposta ao mouse (#25).
- **Próximo:** o pedido 1 do João, que é o resultado com as falhas e o porquê (Passo 7 mais o texto padrão do Passo 8). Faça o design com o João antes de codar.

## Estado verificado (18/11/2026)

| Item                | Valor                                                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main` (origin)     | `6eaabef` (merge da #25). Nenhuma PR aberta, a não ser esta de docs                                                                                                             |
| CI da #25           | `verificar` e `e2e` verdes                                                                                                                                                      |
| `npm run verificar` | exit 0 na #25: API 157 testes, web 55, build ok                                                                                                                                 |
| `npm run test:e2e`  | 19 de 19. Os testes de tema rodam o axe em 5 telas num teste só e ficam perto dos 30 s com a máquina carregada (uma falha por tempo, depois passou)                             |
| Banco local         | Contas `manual@gmail.com` (teste do João, 2 avaliações concluídas) e `teste.1794874572@exemplo.com` (não consta de onde veio)                                                   |
| Produção            | O próximo deploy leva ao Neon a migração `20261118002249_avaliacao_url_final_pagina_grande`. Depois dele, confirmar que o `Resolver` (DNS) funciona no Render e medir a memória |
| Processos           | Nenhum servidor aberto                                                                                                                                                          |
| Branches locais     | `feat/nova-avaliacao`, `feat/contraste-e-hover`, `fix/senha-forte` e `fix/teste-cadastro-instavel` já foram mescladas e podem ser apagadas                                      |

## Pedidos do João (18/11), na ordem combinada

1. **Resultado com quais falhas e por quê**, sem depender da IA:
   - é o Passo 7 (Tela 5: nota, "como chegamos", cartões por requisito com local e trecho);
   - mais o texto padrão do Passo 8 ("por que é falha" e um exemplo de correção, escritos pelo grupo).
2. **Interatividade:** feita na #25.
3. **Várias URLs na mesma aba:** um botão "+" na Tela 3 que acrescenta outro campo e põe na fila.
   - É o RF20 (prioridade baixa, "se houver tempo").
   - Conflita com a regra de uma análise pendente por conta e com o limite de 10 por hora (RNF10). Decidir no design.

## Pendências

**Teste manual do João**

- Alt+1, Alt+2 e Alt+4 no Chrome e no Firefox do Linux. No Chrome, Alt+número pode trocar de aba; se trocar, ajustar o texto de `apps/web/src/paginas/Acessibilidade.tsx`.
- Ouvir a barra de acessibilidade no Orca.

**Para o mentor** (`projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção E):

- O tempo de acordar do Render (52,8 s) somado à análise passa dos 60 s do RNF06.
- Sites lentos dão DEMOROU (RNF06, R7).

**Riscos e pequenos ajustes adiados**

- **Passo 6** (relatório privado `../acessaweb-privado/relatorios/revisao-final-passo-6-2026-11-18.md`, seções 5 e 7):
  - a fila global não tem teto;
  - a Tela 4 de uma pendente morta pergunta para sempre;
  - o `EAI_AGAIN` em `apps/api/src/analise/rede.ts` virou código morto;
  - o Chromium roda com `--no-sandbox`.
- **Barra (#25):**
  - os temas forçados não mudam o `color-scheme` (a barra de rolagem e a caixa "Mostrar senha" seguem o sistema);
  - depois do primeiro clique em "Modo escuro", não há botão para voltar a "seguir o sistema";
  - duas abas não se sincronizam;
  - o zoom de 200% com a conta aberta não tem e2e;
  - a regra do tema existe em dois lugares (`apps/web/src/tema.ts` e `apps/web/public/tema-inicial.js`).

**Depois do Passo 6:** função "Excluir minha conta" (LGPD).

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

1. Brainstorming e design do pedido 1 (Tela 5 com as falhas e o texto padrão), com a aprovação do João antes de codar.
2. Depois, o pedido 3 (RF20, botão "+"), começando pela decisão sobre a regra de uma pendente por conta.
