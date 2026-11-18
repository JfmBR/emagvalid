# Barra de acessibilidade, temas e resposta ao mouse — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Barra de acessibilidade do eMAG 3.1 (atalhos, alto contraste, modo escuro, página de acessibilidade), resposta ao mouse em botões e links e telas que aguentam zoom de 200%.

**Architecture:** Os temas são tokens (`tokens.json` → gerador → `tokens.css`) escolhidos pelo `data-theme` do `<html>`. O módulo `apps/web/src/tema.ts` lê e salva a escolha e decide o `data-theme`. `main.tsx` aplica o tema antes do render, e a barra (`BarraAcessibilidade.tsx`, no `Layout`) troca o tema. Hover e clique ficam no `bundle.css`.

**Tech Stack:** React 19, Vite, Vitest + Testing Library, Playwright + axe-core, CSS com variáveis.

**Spec:** `docs/superpowers/specs/2026-11-18-contraste-e-hover-design.md`

## Global Constraints

- **Cores do contraste (eMAG 4.2):**
  - fundo `#000000`, texto `#ffffff`, links e foco `#fff333`, linhas e contornos `#ffffff`;
  - links sublinhados em todos os estados;
  - todo par de texto e fundo com 7:1 ou mais.
- **Chaves do `localStorage`:** `acessaweb-contraste` (`sim` ou ausente) e `acessaweb-tema` (`claro`, `escuro` ou ausente). Toda leitura e escrita vai em `try/catch`.
- **Atalhos:** "Ir para o conteúdo [1]", "Ir para o menu [2]" e "Ir para o rodapé [4]", com `accessKey` 1, 2 e 4, para `#conteudo`, `#menu` e `#rodape`.
- **Sem botões A+/A- e sem atalho de busca [3].**
- **Sem dependência nova.**
- Nomes do domínio e comentários em pt-BR.
- Alvos de 44 px, foco visível de 3 px (como já está) e transição desligada com `prefers-reduced-motion`.
- `tokens.css` não se edita à mão: rode `node scripts/gerar-tokens-css.mjs`.

## Review Focus

1. **Navegador sem `localStorage`** (aba anônima com bloqueio): a página abre, os botões funcionam na visita e nada quebra (teste na Task 2).
2. **Modo escuro sem escolha salva num sistema escuro:** o botão já aparece pressionado, e o clique vai para o claro (teste na Task 2).
3. **Contraste ligado com o sistema em escuro:** o contraste vence. O `data-theme` é `contraste`, e o bloco escuro não sobrepõe (teste na Task 2 e axe na Task 4).
4. **Primeiro Tab da página:** cai em "Ir para o conteúdo [1]", e não há um segundo link de pular (e2e na Task 3).
5. **Zoom de 200%** (janela de 640 px) com a barra inteira: sem rolagem horizontal em nenhuma tela (e2e na Task 4).

---

### Task 1: Tema de alto contraste nos tokens e resposta ao mouse no CSS

**Files:**

- Modify: `design-system/tokens.json` (tema `contraste` em `color.themes` e valor `contraste` em cada token que muda)
- Modify: `scripts/gerar-tokens-css.mjs`
- Regenerate: `design-system/tokens.css`
- Modify: `design-system/components/bundle.css` (`.btn`, `a`)
- Modify: `design-system/README.md` (temas e hover)

**Interfaces:**

- Produces: `:root[data-theme='contraste']` em `tokens.css`, emitido depois de `:root[data-theme='escuro']`, com `color-scheme: dark`, e o seletor do escuro automático passa a ser `:root:not([data-theme='claro']):not([data-theme='contraste'])`.

- [ ] **Step 1:** Em `tokens.json`, acrescente `{ "id": "contraste", "name": "Alto contraste" }` aos temas e o valor `contraste` aos tokens:
  - `bg`, `surface`, `alta-bg`, `media-bg`, `ok-bg` e `code-bg`: `#000000`;
  - `ink`, `muted`, `line` e `line-strong`: `#ffffff`;
  - `accent`: `#fff333`;
  - `accent-ink`: `#000000`;
  - `accent-soft`: `#333300`;
  - `alta`: `#ff8a80`;
  - `media`: `#fff333`;
  - `ok`: `#69f0ae`.

  Token sem valor `contraste` usa o do claro (o `corDoTema` já faz isso).

- [ ] **Step 2:** No gerador, leia o terceiro tema e emita o bloco `contraste` com as cores que mudam em relação ao claro, mais `color-scheme: dark`. Exclua o contraste do seletor escuro automático. Rode `node scripts/gerar-tokens-css.mjs` e confira que o `tokens.css` tem o bloco `contraste` por último.
- [ ] **Step 3:** No `bundle.css`, acrescente:
  - `.btn:not([disabled]):hover` com fundo `color-mix(in srgb, var(--accent) 85%, var(--ink))`;
  - `.btn.sec:not([disabled]):hover` e `.btn.txt:not([disabled]):hover` com fundo `var(--accent-soft)`;
  - `.btn.perigo:not([disabled]):hover` com fundo `var(--alta-bg)`;
  - `.btn:not([disabled]):active` com `transform: translateY(1px)`;
  - `a:hover` com `text-decoration-thickness: 3px`;
  - `[data-theme='contraste'] a` com `text-decoration: underline`;
  - `.btn` com `transition: background-color 120ms, color 120ms`, e `transition: none` dentro de `@media (prefers-reduced-motion: reduce)`.
- [ ] **Step 4:** Confira o contraste dos pares novos e escreva os valores no `design-system/README.md`, como o arquivo já faz:
  - `accent-ink` sobre o hover do botão principal, nos temas claro e escuro;
  - `accent` sobre `accent-soft` nos três temas;
  - `alta` sobre `alta-bg`.

  Rode `npm run format:check`. Saída esperada: sem aviso nos arquivos alterados.

- [ ] **Step 5: Commit** — `feat: cria o tema de alto contraste do eMAG e a resposta ao mouse nos botões`

### Task 2: Escolha do tema (`tema.ts`) aplicada antes do render

**Files:**

- Create: `apps/web/src/tema.ts`
- Create: `apps/web/src/tema.test.ts`
- Modify: `apps/web/src/main.tsx`

**Interfaces:**

- Produces:
  - `type Preferencias = { contraste: boolean; tema: 'claro' | 'escuro' | null }`
  - `lerPreferencias(): Preferencias`: sem armazenamento ou com valor estranho, devolve `{ contraste: false, tema: null }`.
  - `salvarPreferencias(p: Preferencias): void`: remove a chave quando o valor é `false` ou `null`.
  - `temaDaPagina(p: Preferencias): 'contraste' | 'claro' | 'escuro' | null`
  - `aplicarTema(p: Preferencias): void`: põe ou tira `document.documentElement.dataset.theme`.
  - `sistemaEscuro(): boolean`: `window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false`.

- [ ] **Step 1: Testes em `tema.test.ts`:**
  - `temaDaPagina({contraste:true, tema:'escuro'})` é `'contraste'`;
  - `temaDaPagina({contraste:false, tema:null})` é `null`;
  - salvar `{contraste:true, tema:'claro'}` e ler de volta dá o mesmo objeto;
  - salvar `{contraste:false, tema:null}` deixa as duas chaves ausentes;
  - com `Storage.prototype.getItem` e `setItem` lançando erro, `lerPreferencias()` devolve o padrão e `salvarPreferencias` não lança;
  - `localStorage['acessaweb-tema'] = 'roxo'` vira `tema: null`;
  - `aplicarTema({contraste:false, tema:null})` remove o `data-theme`.
- [ ] **Step 2:** Rode `npx vitest run src/tema.test.ts` em `apps/web`. Esperado: FAIL, porque o módulo não existe.
- [ ] **Step 3:** Implemente `tema.ts`. Em `main.tsx`, chame `aplicarTema(lerPreferencias())` antes do `createRoot`.
- [ ] **Step 4:** Rode o teste de novo. Esperado: PASS.
- [ ] **Step 5: Commit** — `feat: guarda a escolha de tema e aplica antes de abrir a tela`

### Task 3: Barra de acessibilidade no Layout

**Files:**

- Create: `apps/web/src/componentes/BarraAcessibilidade.tsx`
- Modify: `apps/web/src/componentes/Layout.tsx`: tira o link `.pular`, põe a barra no topo e acrescenta `id="menu"` no `nav` e `id="rodape"` no `footer`.
- Modify: `apps/web/src/index.css` (estilo `.barra-acessibilidade`)
- Test: `apps/web/src/App.test.tsx`, `apps/web/e2e/tela-inicial.spec.ts` (o teste "link pular para o conteúdo" passa a usar "Ir para o conteúdo [1]")

**Interfaces:**

- Consumes: `lerPreferencias`, `salvarPreferencias`, `aplicarTema`, `sistemaEscuro` e `Preferencias` (Task 2).
- Produces: `<BarraAcessibilidade />`, sem props, com `nav aria-label="Acessibilidade"`. O link "Acessibilidade" aponta para `/acessibilidade`, que a Task 4 cria.

- [ ] **Step 1: Testes em `App.test.tsx`:**
  - "Alto contraste" começa com `aria-pressed="false"`. O clique muda para `true`, o `data-theme` vira `contraste` e `localStorage['acessaweb-contraste']` vira `'sim'`. Outro clique desfaz tudo.
  - "Modo escuro" sem escolha e `matchMedia` falso: o clique dá `aria-pressed="true"`, `data-theme` `escuro` e `acessaweb-tema` `escuro`.
  - Com `matchMedia` simulando o sistema escuro, "Modo escuro" já começa com `aria-pressed="true"`, e o clique salva `claro`.
  - Os links "Ir para o conteúdo [1]", "Ir para o menu [2]" e "Ir para o rodapé [4]" têm `href` `#conteudo`, `#menu` e `#rodape` e `accesskey` 1, 2 e 4.

  Limpe o `localStorage` e o `data-theme` no `beforeEach`.

- [ ] **Step 2:** Rode `npm test -w apps/web`. Esperado: FAIL nos testes novos.
- [ ] **Step 3:** Implemente a barra:
  - estado com `useState(lerPreferencias)`;
  - cada clique salva e aplica;
  - os botões usam o `Botao` com `variante="txt"` e `aria-pressed`;
  - o modo escuro fica pressionado quando `tema === 'escuro' || (tema === null && sistemaEscuro())`.

  O CSS da barra: `flex-wrap: wrap`, fundo `surface`, borda inferior `line` e links com 44 px de altura.

- [ ] **Step 4:** Rode `npm test -w apps/web`. Esperado: PASS.
- [ ] **Step 5:** Atualize o e2e de `tela-inicial.spec.ts`: o primeiro Tab foca "Ir para o conteúdo [1]", e o Enter leva o foco ao `main#conteudo`. Rode `npm run test:e2e`. Esperado: tudo passa.
- [ ] **Step 6: Commit** — `feat: cria a barra de acessibilidade com atalhos, contraste e modo escuro`

### Task 4: Página de acessibilidade, axe nos três temas e zoom de 200%

**Files:**

- Create: `apps/web/src/paginas/Acessibilidade.tsx`, no molde de `Privacidade.tsx`
- Modify: `apps/web/src/App.tsx` (rota `acessibilidade`)
- Create: `apps/web/e2e/acessibilidade.spec.ts`
- Modify: o CSS que quebrar no zoom (`index.css` ou `bundle.css`)
- Modify: `docs/design.md` (barra e página), `PRODUCT.md` (barra e zoom de 200% no escopo; A+/A- fora, com a seção 1.3 do eMAG) e `docs/passo-a-passo-mvp.md` (item feito, com data)

**Interfaces:**

- Consumes: a barra (Task 3) e os temas (Task 1).

- [ ] **Step 1:** Escreva `Acessibilidade.tsx` com `<title>Acessibilidade · AcessaWeb</title>`, `h1` "Acessibilidade" e as seções do design:
  - eMAG 3.1;
  - atalhos com as teclas por navegador;
  - alto contraste e modo escuro;
  - zoom de até 200%;
  - testes que fazemos.

  Acrescente a rota e, em `App.test.tsx`, um teste: clicar em "Acessibilidade" na barra mostra o `h1` "Acessibilidade".

- [ ] **Step 2: e2e em `acessibilidade.spec.ts`:**
  - Para cada tema (sem `data-theme`, com `acessaweb-tema=escuro` e com `acessaweb-contraste=sim`, postos por `addInitScript` no `localStorage`), as telas `/`, `/entrar`, `/cadastro`, `/privacidade` e `/acessibilidade` passam no axe sem violação `serious` nem `critical`. Use a mesma função `semViolacoesSerias` dos outros specs.
  - Com `page.setViewportSize({ width: 640, height: 900 })`, as mesmas telas têm `document.documentElement.scrollWidth <= innerWidth`.
  - Só com o teclado, Tab até "Alto contraste" e Enter deixam o `html` com `data-theme="contraste"`.
- [ ] **Step 3:** Rode `npm run test:e2e`. Corrija no CSS o que falhar (contraste ou rolagem horizontal) até passar.
- [ ] **Step 4:** Atualize `docs/design.md`, `PRODUCT.md` e `docs/passo-a-passo-mvp.md`. Rode `npm run verificar` (esperado: exit 0) e `npm run test:e2e` (esperado: tudo passa).
- [ ] **Step 5: Commit** — `feat: cria a página de acessibilidade e testa os três temas e o zoom de 200%`
