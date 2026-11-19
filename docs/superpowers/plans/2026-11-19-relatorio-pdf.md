# Relatório em PDF (Passo 9) — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** baixar o PDF de uma avaliação concluída pela Tela 5 e pela Tela 8, só para contas com plano pago (RF12, RF13, RF21).

**Architecture:** a API monta o HTML do relatório com uma função pura que escapa todo texto. Um Chromium sem JavaScript e sem rede transforma esse HTML em PDF na hora do pedido, um por vez. O front baixa o PDF por `fetch` e mostra os erros num `Aviso`.

**Tech Stack:** Express 5, Prisma 7, Playwright 1.64 (`page.pdf`), React 19, Vitest 5, supertest, Playwright Test.

**Spec:** `docs/superpowers/specs/2026-11-19-relatorio-pdf-design.md`

## Global Constraints

- Começa só depois do merge da PR #31 (a Tela 8, `Historico.tsx`, vem dela). Tarefa 0 rebaseia a branch.
- Nenhuma dependência nova. O PDF sai de `page.pdf()` do Playwright que já está em `apps/api`.
- Nomes do domínio e comentários em pt-BR; Prettier; oxlint sem aviso novo.
- Migração gerada com `--create-only`; o SQL vai ao João **antes** de aplicar. Nunca mexer direto no banco.
- O texto da página avaliada (seletor, trecho, descrição, URL) é dado não confiável: sempre escapado no HTML.
- Chromium do PDF: `javaScriptEnabled: false`, todo pedido de rede abortado, mesmos `args` de proxy inválido de `apps/api/src/analise/analisar.ts:138-149`.
- Botão bloqueado usa `aria-disabled="true"`, nunca `disabled`. Alvos de 44 px ou mais.
- Textos fixos do PDF e das mensagens: copiar exatamente os deste plano.
- `page.pdf` com `format: 'A4'`, `printBackground: true`, `displayHeaderFooter: true`, `tagged: true`, `outline: true` (as duas últimas existem desde a 1.42, conferido na doc da 1.64.1). O rodapé usa `<span class="pageNumber">` e `<span class="totalPages">`. A doc não diz se o rodapé exige `margin.bottom` ou `font-size`: comece com `margin: { top: '16mm', bottom: '20mm', left: '14mm', right: '14mm' }` e `font-size:9px` no template, e confira no PDF gerado.

## Review Focus

1. Trecho com `</style>`, `<script>`, aspas ou 1.000 caracteres sem espaço: sai escapado e quebra a linha, sem estourar a margem (teste na Tarefa 2).
2. Avaliação sem nenhuma falha (nota 100): a seção de falhas diz "Nenhuma falha automática encontrada." (teste na Tarefa 2).
3. O Chromium do PDF falha ou passa do teto de tempo: resposta 500 genérica, e o próximo pedido gera normalmente, ou seja, a trava "um por vez" é liberada (teste na Tarefa 3).
4. Clique duplo em "Baixar PDF": um pedido só (teste na Tarefa 5).
5. A sessão vence entre abrir a Tela 5 e clicar: 401 leva a tela ao estado de "não entrou", como nas outras telas (teste na Tarefa 5).

---

### Tarefa 0: preparar a branch (quem coordena)

- [ ] **Passo 1:** com a PR #31 mesclada: `git fetch && git rebase origin/main` na `feat/relatorio-pdf`. Esperado: só o commit do design e o deste plano por cima da `main`.
- [ ] **Passo 2:** `npm run verificar`. Esperado: exit 0.
- [ ] **Passo 3:** em `docs/handoff.md`, seção "Pendências", acrescentar o item "Automatizar parte da revisão humana (decisão do João, 19/11: depois do PDF)": aplicabilidade de 5.2, 5.3, 6.4–6.8, 1.6 e 3.8 pelo HTML da página; indícios de 1.9 (`target="_blank"` sem aviso), 6.7 (radios sem `fieldset`) e 6.8 (CAPTCHA conhecido). Commit `docs: anota a automação da revisão humana como pendência`.

### Tarefa 1: plano pago na conta e na sessão

**Files:**

- Modify: `apps/api/prisma/schema.prisma` (model `Usuario`)
- Create: `apps/api/prisma/migrations/<data>_usuario_plano_pago/migration.sql` (gerada)
- Modify: `apps/api/src/auth/sessao.ts` (`UsuarioDaSessao` e o `select` de `usuarioDaSessao`)
- Modify: `apps/api/src/rotas/auth.ts:35` (`publico`)
- Modify: `apps/web/src/sessao.tsx:3` (`Usuario`)
- Test: `apps/api/src/rotas/auth.test.ts`

**Interfaces:**

- Produces: `UsuarioDaSessao = { id: string; nome: string; email: string; planoPago: boolean }`; `GET /api/auth/eu` → `{ usuario: { nome, email, planoPago } }`; no front, `Usuario = { nome: string; email: string; planoPago: boolean }`.

- [ ] **Passo 1:** teste em `auth.test.ts`: "`/eu` devolve planoPago" (com a conta de plano ligado → `planoPago: true`; padrão → `false`). As respostas de `/entrar` e `/cadastro` também passam por `publico` e trazem `planoPago`.
- [ ] **Passo 2:** `npm test -w apps/api -- auth`. Esperado: FAIL.
- [ ] **Passo 3:** `planoPago Boolean @default(false) // RF21: ligado à mão pelo grupo nas contas de demonstração e da banca`. Rodar `npm run db:migrate -w apps/api -- --create-only --name usuario_plano_pago`. **Parar e mostrar o SQL ao João.** Aplicar só depois do ok dele.
- [ ] **Passo 4:** acrescentar `planoPago` ao tipo, ao `select` e ao `publico`. Corrigir os pontos do front que montam um `Usuario` (testes do `App.test.tsx` com `helena`, telas de entrar e cadastro) para o TypeScript fechar.
- [ ] **Passo 5:** `npm run verificar`. Esperado: exit 0.
- [ ] **Passo 6:** commit `feat: campo plano pago na conta e na sessão (RF21)`.

### Tarefa 2: HTML do relatório

**Files:**

- Create: `apps/api/src/relatorio/html.ts`
- Test: `apps/api/src/relatorio/html.test.ts`

**Interfaces:**

- Consumes: `resultadoDaAvaliacao` de `apps/api/src/analise/resultado.ts` (tipo do retorno).
- Produces:
  - `type DadosDoRelatorio = { pagina: string; nomeDaConta: string; avaliadaEm: Date; resultado: ReturnType<typeof resultadoDaAvaliacao> }`
  - `htmlDoRelatorio(dados: DadosDoRelatorio): string`: documento HTML completo, com CSS inline.
  - `rodapeDoRelatorio(geradoEm: Date): string`: o `footerTemplate`.
  - `dataBrasilia(data: Date): string`: "19/11/2026, 14:32", com `Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' })`.

Textos fixos:

- Topo: `AcessaWeb · Relatório de acessibilidade · eMAG 3.1`; `Avaliação de <dataBrasilia> · Preparado para: <nome>`.
- Aviso: `Esta nota é automática e não é certificação. Parte do eMAG só uma pessoa confere (seção "Revisão humana").`
- Seções (`<h2>`, nesta ordem): `Resumo`, `Falhas, da mais urgente para a menos`, `Revisão humana`, `Como chegamos na nota`.
- Resumo: `Nota <n>/100` ou `Sem nota (avaliação anterior ao cálculo da nota)`; `<x> falhas em <y> recomendações: <a> de prioridade alta, <m> média, <b> baixa`; `Revisão humana: <k> de <t> itens conferidos`.
- Caixa de falha: `<h3>` com `<número> <nome>` e `Prioridade <alta|média|baixa>`; `Por que é falha:`, `Como corrigir:`, `Onde (<n> ocorrências):` e, quando `revisaoHumana`, `Confirme à mão`.
- Sem falhas: `Nenhuma falha automática encontrada.`
- Revisão: `☑ conferido` ou `☐ a conferir`, e o texto de `conferir`.
- Fórmula: `Nota = 100 × soma dos pesos das recomendações aprovadas ÷ soma dos pesos das recomendações que se aplicam à página, arredondada para baixo. Peso pela prioridade: alta 3, média 2, baixa 1.`
- Rodapé: `Gerado pelo AcessaWeb em <dataBrasilia> · Nota automática, não é certificação · Página <pageNumber> de <totalPages>`.

- [ ] **Passo 1:** testes em `html.test.ts`:
  - `trecho e seletor saem escapados`: com o trecho `</style><script>alert("x")</script>` e o seletor `a[title='"']`, o HTML não contém `<script>alert` nem `</style><script>`, e contém `&lt;script&gt;`.
  - `nome da conta e página também são escapados` (`<b>`).
  - `seções na ordem do plano` (os índices dos quatro `<h2>` crescem).
  - `caixas na ordem dos cartões`: duas recomendações, alta antes de baixa.
  - `sem falhas diz "Nenhuma falha automática encontrada."`.
  - `sem nota omite "Como chegamos na nota" e diz "Sem nota"`.
  - `revisão mostra ☑ conferido e ☐ a conferir conforme feita`.
  - `trecho longo quebra`: o CSS contém `overflow-wrap: anywhere` para `code`/`pre`.
  - `rodapé tem pageNumber e totalPages`.
- [ ] **Passo 2:** `npm test -w apps/api -- html`. Esperado: FAIL (módulo não existe).
- [ ] **Passo 3:** implementar. Uma função `escapar(texto: string): string` (troca `& < > " '`) aplicada a todo valor interpolado. A seção "Como chegamos" é a tabela de `verificacoes` com `<th scope="row">`, igual à Tela 5. A cor e a fonte vêm de `design-system/README.md`, com fonte do sistema e sem `@import`/URL externa.
- [ ] **Passo 4:** `npm test -w apps/api -- html`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat: HTML do relatório em PDF`.

### Tarefa 3: gerador do PDF

**Files:**

- Create: `apps/api/src/relatorio/pdf.ts`
- Test: `apps/api/src/relatorio/pdf.test.ts`

**Interfaces:**

- Produces:
  - `class GeradorOcupado extends Error`
  - `gerarPdf(html: string, rodape: string, limiteMs = 20_000): Promise<Buffer>`. Rejeita com `GeradorOcupado` se outro estiver em andamento. Rejeita com `Error` no teto de tempo ou na falha do Chromium. Fecha o navegador e libera a trava num `finally`.

- [ ] **Passo 1:** testes em `pdf.test.ts`, com Chromium de verdade, como `analisar.test.ts`:
  - `gera um PDF`: o resultado começa com `%PDF`.
  - `não busca nada na rede`: sobe um `http.createServer` local que conta os pedidos; um HTML com `<img src="http://127.0.0.1:<porta>/x">` e `<link rel="stylesheet" href=...>` → 0 pedidos.
  - `um por vez`: duas chamadas ao mesmo tempo → uma resolve, a outra rejeita com `GeradorOcupado`.
  - `libera a trava depois de falhar`: `gerarPdf(html, rodape, 1)` rejeita; a chamada seguinte, com o teto padrão, resolve.
- [ ] **Passo 2:** `npm test -w apps/api -- pdf`. Esperado: FAIL.
- [ ] **Passo 3:** implementar com uma variável `let gerando = false` no módulo (`shortcut: trava em memória de uma instância só, como a fila; com mais instâncias, trocar pela fila`). Opções de launch, de contexto e de `page.pdf` estão em Global Constraints. `context.route('**/*', (r) => r.abort())` antes de `setContent`; `setContent(html, { waitUntil: 'load' })`. O teto de tempo fecha o navegador, como o `encerrar` de `analisar.ts`.
- [ ] **Passo 4:** `npm test -w apps/api -- pdf`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat: gerador do PDF com Chromium sem JavaScript e sem rede`.

### Tarefa 4: rota `GET /api/avaliacoes/:id/pdf`

**Files:**

- Modify: `apps/api/src/rotas/avaliacoes.ts` (rota nova depois de `GET /:id`)
- Modify: `apps/api/src/auth/tentativas.ts` (`limitePdfPorConta`)
- Test: `apps/api/src/rotas/avaliacoes.test.ts` (novo `describe`)

**Interfaces:**

- Consumes: `htmlDoRelatorio`, `rodapeDoRelatorio` (Tarefa 2), `gerarPdf`, `GeradorOcupado` (Tarefa 3), `UsuarioDaSessao.planoPago` (Tarefa 1).
- Produces: `limitePdfPorConta = criarLimite(10, UMA_HORA)`; a rota acima.

Respostas, nesta ordem de checagem:

| Caso                                          | Status | Corpo `erro`                                                                        |
| --------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| sem login                                     | 401    | (do `exigirLogin`)                                                                  |
| id não é UUID, não existe ou é de outra conta | 404    | `Avaliação não encontrada.`                                                         |
| sem `planoPago`                               | 403    | `O relatório em PDF faz parte do plano pago.`                                       |
| status diferente de `CONCLUIDA`               | 409    | `Esta avaliação não tem resultado para gerar o relatório.`                          |
| 11º pedido da conta na hora                   | 429    | `Você chegou ao limite de 10 relatórios por hora. Tente de novo mais tarde.`        |
| `GeradorOcupado`                              | 503    | `Outro relatório está sendo gerado. Tente de novo em instantes.` + `Retry-After: 5` |
| outra falha do gerador                        | 500    | `Não conseguimos gerar o relatório. Tente de novo em instantes.`                    |
| ok                                            | 200    | o PDF                                                                               |

O 404 vem antes do 403, para não revelar a quem não tem plano se o id existe. O pedido conta no limite só depois do 409. No 503, o pedido é descontado (`limitePdfPorConta.descontar`), porque não foi culpa da pessoa. O erro do 500 vai para o `console.error` sem dados da conta.

Cabeçalhos do 200: `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="acessaweb-<hostname de urlFinal ?? url>-<AAAA-MM-DD de concluidaEm em America/Sao_Paulo>.pdf"`, `Cache-Control: no-store`.

- [ ] **Passo 1:** no `avaliacoes.test.ts`, o mock de `exigirLogin` passa a pôr `planoPago: req.get('x-plano') === 'sim'`. Fazer `vi.mock('../relatorio/pdf.js')` com `gerarPdf` falso (devolve `Buffer.from('%PDF-1.7 falso')`) e o `GeradorOcupado` real. Testes, um por linha da tabela, mais:
  - `200 com o nome do arquivo pelo urlFinal e pela data de Brasília` (`concluidaEm` em `2026-11-20T01:30:00Z` → `2026-11-19`);
  - `sem urlFinal usa url`;
  - `503 não gasta o limite`;
  - `o HTML enviado ao gerador traz o nome da conta`.
  - O `beforeEach` limpa `limitePdfPorConta`, como já faz com os outros limites.
- [ ] **Passo 2:** `npm test -w apps/api -- avaliacoes`. Esperado: FAIL nos novos.
- [ ] **Passo 3:** implementar. A consulta ao banco usa o mesmo `select` do `GET /:id` e o mesmo `resultadoDaAvaliacao`.
- [ ] **Passo 4:** `npm test -w apps/api`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat: rota do relatório em PDF com plano pago, limite e um por vez`.

### Tarefa 5: botão "Baixar PDF"

**Files:**

- Create: `apps/web/src/componentes/BaixarPdf.tsx`
- Test: `apps/web/src/componentes/BaixarPdf.test.tsx`, renderizado dentro de `ProvedorSessao`, com `fetch` simulado como o `simularApi` do `App.test.tsx`

**Interfaces:**

- Consumes: `useSessao().usuario.planoPago` (Tarefa 1).
- Produces: `BaixarPdf({ id, avisoBloqueioId }: { id: string; avisoBloqueioId?: string })`.
  - Com plano: um `Botao` "Baixar PDF". O clique faz `fetch('/api/avaliacoes/<id>/pdf')`, lê o `blob`, cria um `<a download>` temporário com o nome do `Content-Disposition` (se faltar, `relatorio.pdf`), clica nele e chama `URL.revokeObjectURL`.
  - Durante o download: `aria-busy="true"` e o texto `Gerando o PDF...`. Novos cliques são ignorados.
  - Sem plano: `Botao` com `aria-disabled="true"` e o texto `Baixar PDF (plano pago)`. A descrição (`aria-describedby`) aponta para `avisoBloqueioId`, se vier, ou para o próprio parágrafo: `O relatório em PDF faz parte do plano pago. No MVP não há cobrança: o grupo libera o plano nas contas de demonstração.` O clique não faz nada.
  - Erro: `Aviso tipo="alerta" papel="alert"` com `mensagemDeErro(status, erro)`. 401 → `definirUsuario(null)`.

- [ ] **Passo 1:** testes em `BaixarPdf.test.tsx` (stub de `URL.createObjectURL`/`revokeObjectURL`, que o jsdom não tem):
  - `com plano, baixa com o nome do Content-Disposition`;
  - `dois cliques seguidos mandam um pedido só`;
  - `sem plano: aria-disabled, descrição do plano pago e nenhum pedido ao clicar`;
  - `429 e 503 mostram a mensagem da API num alerta`;
  - `401 volta ao estado de não entrou` (o `useSessao().usuario` vira `null`).
- [ ] **Passo 2:** `npm test -w apps/web -- BaixarPdf`. Esperado: FAIL.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm test -w apps/web -- BaixarPdf`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat: botão Baixar PDF com estado bloqueado do plano pago`.

### Tarefa 6: Tela 5 com o botão e a contagem da revisão

**Files:**

- Modify: `apps/web/src/paginas/Resultado.tsx` (painel e `Abas`)
- Modify: `apps/web/src/paginas/RevisaoHumana.tsx`
- Test: `apps/web/src/App.test.tsx` (describe da Tela 5)

**Interfaces:**

- Consumes: `BaixarPdf` (Tarefa 5).
- Produces:
  - O estado `feitas: Set<string>` sobe de `RevisaoHumana` para `Resultado`. `RevisaoHumana` passa a receber `feitas` e `marcar(numero: string, feita: boolean)` por props e mantém o envio, os pedidos pendentes e o erro.
  - O estado `aba` sobe de `Abas` para `Resultado`, para o link abrir a aba.

Texto abaixo do botão, no painel da nota: `Revisão humana: <k> de <t> itens conferidos. Os outros saem no PDF como "a conferir".` seguido do link-botão `Ir para a revisão humana` (`Botao variante="txt"`). Quando k = t: `Revisão humana: todos os <t> itens conferidos.`, sem o link. O link abre a aba "Revisão humana" e põe o foco no botão da aba (`#aba-humana`).

- [ ] **Passo 1:** testes no `App.test.tsx`, na Tela 5:
  - `mostra Baixar PDF e a contagem da revisão`;
  - `marcar um item muda a contagem sem recarregar`;
  - `"Ir para a revisão humana" abre a aba e leva o foco até ela`;
  - `com tudo conferido, diz "todos os N itens conferidos"`.
- [ ] **Passo 2:** `npm test -w apps/web`. Esperado: FAIL nos novos.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm run verificar`. Esperado: exit 0.
- [ ] **Passo 5:** commit `feat: Baixar PDF e contagem da revisão humana na Tela 5`.

### Tarefa 7: Tela 8 com "Baixar PDF" por linha

**Files:**

- Modify: `apps/web/src/paginas/Historico.tsx` (vem da PR #31)
- Test: o teste da Tela 8 que a PR #31 criou (`App.test.tsx`)

**Interfaces:**

- Consumes: `BaixarPdf` com `avisoBloqueioId` (Tarefa 5).

Cada linha concluída ganha `<BaixarPdf id=... />` ao lado de "Ver resultado". Sem plano, o parágrafo do plano pago aparece **uma vez**, acima da tabela, com um id fixo, e todos os botões apontam para ele por `avisoBloqueioId`. Assim o texto não se repete 20 vezes.

- [ ] **Passo 1:** testes: `linha concluída tem Baixar PDF; pendente ou com erro não tem`; `sem plano, o aviso aparece uma vez e descreve os botões`.
- [ ] **Passo 2:** `npm test -w apps/web`. Esperado: FAIL nos novos.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** `npm test -w apps/web`. Esperado: PASS.
- [ ] **Passo 5:** commit `feat: Baixar PDF no histórico`.

### Tarefa 8: e2e e documentos

**Files:**

- Modify: `apps/web/e2e/avaliacao.spec.ts` (e o spec da Tela 8 da PR #31)
- Modify: `docs/design.md`, `docs/architecture.md`, `docs/passo-a-passo-mvp.md` (Passos 9 e 10), `docs/quality.md`, `projeto/contexto_agente/07-pendencias-e-decisoes.md` (seção D, 19/11), `docs/handoff.md`

- [ ] **Passo 1:** e2e, com a API simulada por `page.route`, como os specs atuais:
  - `baixa o PDF na Tela 5` (`/api/auth/eu` com `planoPago: true`, rota do PDF devolvendo `%PDF` com `Content-Disposition`; espera o evento `download` e confere `suggestedFilename()`);
  - `sem plano, botão bloqueado e sem violações sérias do axe`.
- [ ] **Passo 2:** `npm run test:e2e`. Esperado: tudo passa.
- [ ] **Passo 3:** atualizar os documentos com o que o design lista em "Documentos a atualizar junto". No `07`, uma linha na seção D (19/11) com as decisões do design: sem Tela 7, conteúdo, geração na hora e um por vez, limite de 10 por hora.
- [ ] **Passo 4:** gerar um PDF de verdade com a API local (`npm run dev`, conta de teste com `planoPago` ligado pelo psql no container) e conferir:
  - o rodapé com a numeração;
  - a quebra do trecho longo;
  - a marcação: `pdfinfo` mostra `Tagged: yes`, se o poppler estiver instalado; se não estiver, diga isso.

  Registrar no `docs/quality.md`. A escuta no Orca fica como teste manual do João.

- [ ] **Passo 5:** `npm run verificar` e `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar`. Esperado: exit 0 nos dois.
- [ ] **Passo 6:** commit `docs: relatório em PDF nos documentos e no e2e`.
- [ ] **Passo 7:** `/code-review` no branch inteiro; corrigir ou justificar cada achado. Push e PR só com pedido do João.
