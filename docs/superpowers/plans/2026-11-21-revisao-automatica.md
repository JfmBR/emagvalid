# Automatizar parte da revisão humana — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** a análise lê o HTML da página e a revisão humana (Tela 5 e PDF) mostra, à parte, os itens que provavelmente não se aplicam, e no topo os itens com indício, sem mudar a nota.

**Architecture:** depois do axe, `analisar()` roda uma função própria em cada frame (`frame.evaluate`). O Node valida o retorno e grava duas colunas novas em `Avaliacao`. `resultadoDaAvaliacao` transforma os dados em motivo, indício e ordem. A Tela 5 e o PDF só mostram o que ele devolve.

**Tech Stack:** Playwright 1.64, axe-core 4.14, Prisma 7.10 (PostgreSQL 17), Express 5.3, React 19.3, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-11-21-revisao-automatica-design.md` (aprovado pelo João em 21/11/2026).

## Global Constraints

- Nada desta automação entra em `aplicaveis`, `violacoes`, `duvidas`, nas falhas ou em `calcularNota`.
- Nenhum item some: o grupo "Provavelmente não se aplicam nesta página (N)" fica visível, e só a pessoa marca.
- Itens possíveis no grupo: `1.6`, `3.8`, `5.2`, `5.3`, `6.4`, `6.5`, `6.6`, `6.7`, `6.8`. Itens com indício: `1.9`, `6.7`, `6.8`.
- No máximo 5 exemplos por indício. `seletor` e `trecho` sem `\u0000` e cortados em `MAX_TRECHO` (1.000). `total` inteiro de 0 a 10.000.
- No máximo 20 frames lidos. Erro de `evaluate` num frame carregado, ou mais de 20 frames: nenhum "não se aplica". Frame `chrome-error://` ou destacado: ignorado.
- Qualquer erro na detecção dá resultado vazio. A análise não falha por isso; no log vai só o nome do erro.
- Textos fixos (copiar exatamente):
  - motivos: os da tabela "Provavelmente não se aplica" do spec;
  - indícios: os da tabela "Indícios" do spec, com plural: "1 link abre…" e "N links abrem…"; "1 grupo de botões…" e "N grupos de botões…";
  - introdução do grupo: a do mockup da Tela 5 no spec.
- Saída de seletor e trecho sempre como texto: `escapar` no PDF, sem `innerHTML` na Tela 5.
- Nomes do domínio e comentários em pt-BR. Nenhuma dependência nova.
- Migração: gerar com `--create-only`, mostrar o SQL ao João e aplicar num comando separado, depois do ok.

## Review Focus

1. Página com milhares de links `target="_blank"` ou de radios: a contagem para em 10.000, e só os 5 primeiros exemplos geram seletor (teste em T2).
2. Página que troca `axe.utils.getSelector` ou `document.querySelectorAll`: a análise conclui e o retorno estranho é descartado (testes em T2).
3. Avaliação gravada antes desta mudança (colunas vazias): a aba e o PDF ficam iguais a hoje (testes em T4, T5 e T6).
4. Aviso com maiúsculas e acentos ("Abre em NOVA JANELA", "(abre numa nova aba)") não conta como indício de 1.9 (teste em T2).
5. Marcar um item do grupo não muda o "K de T" nem o rótulo da aba (teste em T6).

---

### Task 1: colunas novas em `Avaliacao` (migração)

**Files:**

- Modify: `apps/api/prisma/schema.prisma` (model `Avaliacao`, depois de `revisados`)
- Create: `apps/api/prisma/migrations/<data>_revisao_automatica/migration.sql` (gerado)

**Interfaces:**

- Produces: `Avaliacao.requisitosNaoAplicaveis: string[]` (`String[] @default([])`) e `Avaliacao.indicios: Prisma.JsonValue` (`Json @default("[]")`), com comentário em pt-BR citando RF09 e "não entram na nota".

- [ ] **Step 1:** carregar a skill `supabase-postgres-best-practices` e acrescentar os dois campos ao `schema.prisma`.
- [ ] **Step 2:** `npm run db:up`, depois `npx prisma migrate dev --create-only --name revisao_automatica -w apps/api`, ou o equivalente do script `db:migrate` com `--create-only`. Esperado: uma pasta nova com `ALTER TABLE "avaliacoes" ADD COLUMN ...` para as duas colunas, com os padrões, e nada mais.
- [ ] **Step 3: PARADA.** Mostrar o SQL ao João e esperar o ok.
- [ ] **Step 4:** depois do ok, aplicar num comando separado (`npm run db:migrate -w apps/api`). Esperado: "applied", e o `prisma generate` atualiza os tipos.
- [ ] **Step 5:** `npm run typecheck`. Esperado: exit 0.
- [ ] **Step 6:** commit `feat: colunas da revisão automática na avaliação`.

### Task 2: detecção na página e validação do retorno

**Files:**

- Create: `apps/api/src/analise/revisaoAutomatica.ts`
- Create: `apps/api/src/analise/revisaoAutomatica.test.ts` (validação, sem navegador)
- Modify: `apps/api/src/analise/analisar.ts` (`ResultadoAnalise` e o fim do `try`)
- Modify: `apps/api/src/analise/analisar.test.ts` (páginas novas no servidor local e testes)

**Interfaces:**

- Produces, em `revisaoAutomatica.ts`:
  - `type NumeroIndicio = '1.9' | '6.7' | '6.8'`
  - `interface Indicio { numero: NumeroIndicio; total: number; exemplos: Ocorrencia[] }` (`Ocorrencia` de `analisar.ts`)
  - `interface RevisaoAutomatica { naoAplicaveis: string[]; indicios: Indicio[] }`
  - `const SEM_REVISAO_AUTOMATICA: RevisaoAutomatica` (listas vazias)
  - `const NAO_APLICAVEIS_POSSIVEIS = ['1.6', '3.8', '5.2', '5.3', '6.4', '6.5', '6.6', '6.7', '6.8']`
  - `function validarIndicios(bruto: unknown): Indicio[]`: descarta o que foge do formato e corta exemplos e textos. Também serve para ler a coluna `Json` em T4.
  - `function validarNaoAplicaveis(bruto: unknown): string[]`: só os de `NAO_APLICAVEIS_POSSIVEIS`, sem repetição, na ordem do eMAG.
  - `async function lerRevisaoAutomatica(pagina: Page): Promise<RevisaoAutomatica>`: nunca lança erro; em erro, devolve `SEM_REVISAO_AUTOMATICA` e registra no log só o nome do erro (`console.error('Revisão automática com erro:', ...diagnostico(erro))`, com o `diagnostico` de `executar.ts`, ou só `erro.name`, se importar de `executar.ts` criar ciclo).
- Produces, em `analisar.ts`: `ResultadoAnalise.revisaoAutomatica: RevisaoAutomatica`.

Como funciona `lerRevisaoAutomatica`:

- Para cada frame de `pagina.frames()` (até 20), pula o frame destacado (`isDetached()`) ou com `url()` começando por `chrome-error://`.
- Nos outros, roda `frame.evaluate(lerFrame)`. `lerFrame` é uma função autocontida, porque o Playwright a serializa: sem import e sem closure. Ela devolve:
  - `{ achou: { tabela, documento, audio, video, formulario }: boolean, indicios: { numero, total, exemplos }[] }`
  - as listas de seletores e extensões do spec;
  - o caminho por `window.axe?.utils?.getSelector?.(el) ?? ''`;
  - o trecho por `el.outerHTML.slice(0, 1000)`;
  - a contagem para em 10.000;
  - na comparação do aviso de 1.9, sem acentos (`normalize('NFD')` e remoção de `\p{M}`) e em minúsculas.
- No frame filho, o seletor ganha na frente o do `iframe`. Ele é calculado no frame pai sobre `await frame.frameElement()`, como o `target.join(' ')` do axe.
- Junta tudo: indícios do mesmo número somam `total` e concatenam exemplos até 5. Os "não se aplica" só valem se todos os frames lidos responderam e foram ≤ 20. Tira dos "não se aplica" todo número com indício.
- Tudo passa por `validarIndicios` e `validarNaoAplicaveis` antes de sair.

Em `analisar.ts`, depois do `analyze()`: `const revisaoAutomatica = await lerRevisaoAutomatica(pagina)`. Ela não pode jogar a análise no `catch`. Se o relógio estourar aqui, a função devolve vazio e a avaliação conclui com o resultado do axe (spec, "Segurança").

- [ ] **Step 1: testes de validação (`revisaoAutomatica.test.ts`)**

```ts
it('validarIndicios descarta número fora da lista, total inválido e corta exemplos e textos', () => {
  const longo = 'a'.repeat(5000)
  const r = validarIndicios([
    { numero: '1.9', total: 7, exemplos: Array(6).fill({ seletor: 'a\u0000', trecho: longo }) },
    { numero: '3.6', total: 1, exemplos: [] },
    { numero: '6.7', total: -1, exemplos: [] },
    { numero: '6.8', total: 1.5, exemplos: [] },
    'lixo',
  ])
  expect(r).toHaveLength(1)
  expect(r[0]?.exemplos).toHaveLength(5)
  expect(r[0]?.exemplos[0]).toEqual({ seletor: 'a', trecho: 'a'.repeat(1000) })
})
it('validarNaoAplicaveis aceita só os 9 possíveis, sem repetição, na ordem do eMAG', () => {
  expect(validarNaoAplicaveis(['6.5', '1.6', '6.5', '3.6', 7])).toEqual(['1.6', '6.5'])
  expect(validarNaoAplicaveis('x')).toEqual([])
})
```

- [ ] **Step 2:** `npx vitest run src/analise/revisaoAutomatica.test.ts` em `apps/api`. Esperado: FAIL (módulo não existe).
- [ ] **Step 3:** implementar `revisaoAutomatica.ts`.
- [ ] **Step 4: páginas novas no servidor do `analisar.test.ts`**
  - `/vazia-de-objetos`: o `html` padrão.
  - `/com-tudo`: `<table>`, link `/edital.PDF`, `<audio>`, `iframe` do YouTube (`src="https://www.youtube.com/embed/x"`, bloqueado pela rede do teste, mas o elemento existe no frame principal) e `<form><input name="q"></form>`.
  - `/indicios`:
    - 7 links `target="_blank"` sem aviso;
    - 1 link com "Abre em NOVA JANELA" e 1 com `aria-label="Edital (abre numa nova aba)"`;
    - 1 grupo de radios fora de `fieldset` e 1 dentro;
    - `<div class="g-recaptcha"></div>` sem formulário.
  - `/form-no-iframe`: `<iframe src="/so-form">`, com `/so-form` contendo só `<input>`.
  - `/iframe-quebrado`: o `html` padrão mais `<iframe src="http://localhost:${porta}/x">`, bloqueado e virando `chrome-error://`.
  - `/sabotada`: um script que faz `window.axe = { utils: { getSelector: () => { throw 1 } } }` depois da carga e `Element.prototype.closest = () => { throw 1 }`.
  - `/muitos-blank`: 12.000 links `target="_blank"`.
- [ ] **Step 5: testes em `describe('analisar')`**

```ts
it('página sem tabela, documento, mídia nem formulário: 9 itens provavelmente não se aplicam', async () => {
  const { revisaoAutomatica } = await analisar(`${url}/vazia-de-objetos`, {
    conferirEndereco: soLocal,
  })
  expect(revisaoAutomatica.naoAplicaveis).toEqual([
    '1.6',
    '3.8',
    '5.2',
    '5.3',
    '6.4',
    '6.5',
    '6.6',
    '6.7',
    '6.8',
  ])
  expect(revisaoAutomatica.indicios).toEqual([])
})
it('cada objeto achado tira o item do grupo', async () => {
  const { revisaoAutomatica } = await analisar(`${url}/com-tudo`, { conferirEndereco: soLocal })
  expect(revisaoAutomatica.naoAplicaveis).toEqual([])
})
it('indícios de 1.9, 6.7 e 6.8 com contagem e até 5 exemplos; aviso com maiúsculas ou acento não conta', async () => {
  const { revisaoAutomatica: r } = await analisar(`${url}/indicios`, { conferirEndereco: soLocal })
  const por = (n: string) => r.indicios.find((i) => i.numero === n)
  expect(por('1.9')).toMatchObject({ total: 7 })
  expect(por('1.9')?.exemplos).toHaveLength(5)
  expect(por('1.9')?.exemplos[0]?.trecho).toContain('target="_blank"')
  expect(por('6.7')).toMatchObject({ total: 1 })
  expect(por('6.8')).toBeDefined()
  // indício vence: 6.8 sai do grupo; 6.7 tem indício (radio é campo), então nenhum 6.x fica
  expect(r.naoAplicaveis).not.toContain('6.8')
})
it('formulário dentro de iframe conta', async () => {
  const { revisaoAutomatica } = await analisar(`${url}/form-no-iframe`, {
    conferirEndereco: soLocal,
  })
  expect(revisaoAutomatica.naoAplicaveis).not.toContain('6.5')
})
it('iframe que não carregou é ignorado', async () => {
  const { revisaoAutomatica } = await analisar(`${url}/iframe-quebrado`, {
    conferirEndereco: soLocal,
  })
  expect(revisaoAutomatica.naoAplicaveis).toContain('6.5')
})
it('página que sabota o DOM ou o axe não derruba a análise nem muda a nota', async () => {
  const normal = await analisar(url, { conferirEndereco: soLocal })
  const sabotada = await analisar(`${url}/sabotada`, { conferirEndereco: soLocal })
  expect(sabotada.aplicaveis.sort()).toEqual(normal.aplicaveis.sort())
  expect(sabotada.revisaoAutomatica.naoAplicaveis).toEqual([]) // erro no frame: nada afirmado
})
it('contagem para em 10.000', async () => {
  const { revisaoAutomatica } = await analisar(`${url}/muitos-blank`, { conferirEndereco: soLocal })
  expect(revisaoAutomatica.indicios[0]).toMatchObject({ numero: '1.9', total: 10_000 })
})
```

Na `/sabotada`, se o `getSelector` sabotado só deixar o seletor vazio, sem erro no frame, ajuste a sabotagem para que o `evaluate` lance erro, por exemplo `Element.prototype.closest`. O que o teste prova é "erro no frame não derruba a análise e não afirma nada".

- [ ] **Step 6:** `npx vitest run src/analise` em `apps/api`. Esperado: todos passam, inclusive os 4 testes antigos de `analisar`.
- [ ] **Step 7:** commit `feat: detecção de aplicabilidade e indícios na análise`.

### Task 3: gravar na conclusão da avaliação

**Files:**

- Modify: `apps/api/src/analise/executar.ts:88-111`
- Modify: `apps/api/src/analise/executar.test.ts` (o `semNada` e o teste de conclusão)

**Interfaces:**

- Consumes: `ResultadoAnalise.revisaoAutomatica` (T2); colunas de T1.
- Produces: a avaliação concluída grava `requisitosNaoAplicaveis` e `indicios`.

- [ ] **Step 1:** no teste de conclusão existente, o mock devolve `revisaoAutomatica: { naoAplicaveis: ['1.6'], indicios: [{ numero: '1.9', total: 2, exemplos: [] }] }`. Acrescentar ao `toMatchObject` de `banco.atualizacoes[1]` os campos `requisitosNaoAplicaveis: ['1.6']`, `indicios: [{ numero: '1.9', total: 2, exemplos: [] }]` e `nota: 57`, este já existente e inalterado. `semNada` ganha `revisaoAutomatica: SEM_REVISAO_AUTOMATICA`.
- [ ] **Step 2:** rodar `npx vitest run src/analise/executar.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** gravar `requisitosNaoAplicaveis: revisaoAutomatica.naoAplicaveis` e `indicios: revisaoAutomatica.indicios` no `updateMany` de conclusão.
- [ ] **Step 4:** rodar de novo. Esperado: PASS.
- [ ] **Step 5:** commit `feat: grava a revisão automática ao concluir a avaliação`.

### Task 4: resultado com motivo, indício e ordem

**Files:**

- Modify: `apps/api/src/analise/resultado.ts`
- Modify: `apps/api/src/analise/resultado.test.ts`
- Modify: `apps/api/src/rotas/avaliacoes.test.ts` (fixtures com as colunas novas)
- Modify: `apps/api/src/relatorio/html.test.ts` (base do fixture com as colunas novas; os testes novos ficam em T5)

**Interfaces:**

- Consumes: `validarIndicios`, `validarNaoAplicaveis` e `Indicio` (T2).
- Produces:
  - `AvaliacaoConcluida` ganha `requisitosNaoAplicaveis: string[]` e `indicios: unknown`, lido por `validarIndicios`;
  - `CAMPOS_DO_RESULTADO` ganha os dois;
  - cada item de `revisao` ganha `naoSeAplica: string | null` e `indicio: { texto: string; exemplos: { seletor: string; trecho: string }[] } | null`;
  - textos em `MOTIVO_NAO_SE_APLICA: Record<string, string>` e `textoDoIndicio(i: Indicio): string`, no `resultado.ts` ou num vizinho em `emag/`.

Ordem da `revisao`: com indício, depois a lista principal, depois o grupo. Cada parte na ordem do eMAG. Número com indício nunca fica no grupo.

- [ ] **Step 1: testes**

```ts
it('revisão: indício no topo, depois a principal, e o grupo no fim, com o motivo', () => {
  const { revisao } = resultadoDaAvaliacao({
    ...base,
    requisitosNaoAplicaveis: ['1.6', '6.5'],
    indicios: [
      { numero: '6.7', total: 2, exemplos: [{ seletor: 'input', trecho: '<input type="radio">' }] },
    ],
  })
  expect(revisao[0]).toMatchObject({
    numero: '6.7',
    naoSeAplica: null,
    indicio: {
      texto: '2 grupos de botões de opção (radio) fora de <fieldset>.',
      exemplos: [{ seletor: 'input' }],
    },
  })
  expect(revisao.slice(-2).map((r) => r.numero)).toEqual(['1.6', '6.5'])
  expect(revisao.at(-1)?.naoSeAplica).toBe(
    'Não achamos formulário nem campo de preenchimento na página.',
  )
  expect(revisao).toHaveLength(16)
})
it('textos do indício no singular e plural; 6.8 sem contagem', () => {
  const t = (numero: '1.9' | '6.8', total: number) =>
    textoDoIndicio({ numero, total, exemplos: [] })
  expect(t('1.9', 1)).toBe('1 link abre em nova aba ou janela sem aviso no texto.')
  expect(t('1.9', 4)).toBe('4 links abrem em nova aba ou janela sem aviso no texto.')
  expect(t('6.8', 3)).toBe(
    'Achamos CAPTCHA conhecido na página (reCAPTCHA, hCaptcha ou Turnstile).',
  )
})
it('avaliação antiga (colunas vazias): revisão igual a hoje', () => {
  const { revisao } = resultadoDaAvaliacao({ ...base, requisitosNaoAplicaveis: [], indicios: [] })
  expect(revisao.map((r) => r.numero)).toEqual(itensDeRevisao([]).map((r) => r.numero))
  expect(revisao.every((r) => r.naoSeAplica === null && r.indicio === null)).toBe(true)
})
it('Json da coluna fora do formato não quebra', () => {
  expect(() =>
    resultadoDaAvaliacao({ ...base, requisitosNaoAplicaveis: [], indicios: 'x' }),
  ).not.toThrow()
})
```

`base` ganha `requisitosNaoAplicaveis: []` e `indicios: []`.

- [ ] **Step 2:** rodar `npx vitest run src/analise/resultado.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar.
- [ ] **Step 4:** atualizar os fixtures de `avaliacoes.test.ts` e `html.test.ts`. Rodar `npm test -w apps/api` e `npm run typecheck`. Esperado: tudo passa.
- [ ] **Step 5:** commit `feat: revisão humana com motivo, indício e ordem no resultado`.

### Task 5: PDF

**Files:**

- Modify: `apps/api/src/relatorio/html.ts` (`resumo` e `revisao`)
- Modify: `apps/api/src/relatorio/html.test.ts`

**Interfaces:**

- Consumes: itens de `revisao` com `naoSeAplica` e `indicio` (T4).

Com o grupo vazio, a seção fica igual a hoje.

- [ ] **Step 1: testes**

```ts
it('K de T conta só a lista principal; o grupo vem depois, com subtítulo e motivo', () => {
  const html = gerar({ requisitosNaoAplicaveis: ['1.6'], revisados: ['1.6', '1.1'] })
  expect(html).toContain('Revisão humana: 1 de 15 itens conferidos')
  expect(html).toContain('Provavelmente não se aplicam nesta página')
  expect(html.indexOf('Não achamos tabela')).toBeGreaterThan(
    html.indexOf('Provavelmente não se aplicam'),
  )
})
it('indício com exemplos escapados', () => {
  const html = gerar({
    indicios: [
      {
        numero: '1.9',
        total: 1,
        exemplos: [{ seletor: 'a', trecho: '<a target="_blank"><script>x</script></a>' }],
      },
    ],
  })
  expect(html).toContain('Indício: 1 link abre em nova aba ou janela sem aviso no texto.')
  expect(html).toContain('&lt;script&gt;')
  expect(html).not.toContain('<script>x')
})
```

- [ ] **Step 2:** rodar `npx vitest run src/relatorio/html.test.ts`. Esperado: FAIL.
- [ ] **Step 3:** implementar: a lista principal com o indício e os exemplos (`<code>`, `escapar`); depois, se houver grupo, `<h3>Provavelmente não se aplicam nesta página</h3>` e a lista com motivo e ☑ ou ☐.
- [ ] **Step 4:** rodar `npx vitest run src/relatorio`. Esperado: PASS, inclusive `pdf.test.ts`.
- [ ] **Step 5:** commit `feat: grupo e indícios da revisão humana no PDF`.

### Task 6: Tela 5

**Files:**

- Modify: `apps/web/src/paginas/Resultado.tsx` (tipo `ResultadoAvaliacao['revisao']`, contagens das linhas 111, 118 a 124 e 254)
- Modify: `apps/web/src/paginas/RevisaoHumana.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/e2e/avaliacao.spec.ts` (fixture e um caso novo)

**Interfaces:**

- Consumes: o formato de `revisao` de T4.

Regras da tela:

- `principal = revisao.filter((i) => !i.naoSeAplica)`. O T da contagem, o "N itens para revisão humana" e o rótulo "Revisão humana (N)" usam `principal.length`. O K conta só as marcas da principal.
- No indício, sob o nome:
  - "Indício: {texto}" e, com exemplos, "Onde achamos:";
  - a lista de `<code>` com seletor e trecho, como as ocorrências do `Cartao.tsx`;
  - tudo isso entra no `aria-describedby` da caixa, antes do "conferir".
- O grupo:
  - título "Provavelmente não se aplicam nesta página (N)", no nível abaixo do contexto da aba;
  - o parágrafo de introdução do spec;
  - outra `<ul className="checks">` com o motivo na descrição da caixa.
- Sem grupo, a aba fica igual a hoje.

O mockup do spec dizia "Alguns deles:". Troquei por "Onde achamos:", porque o 6.8 tem um elemento só. _(Escolha do Claude.)_

- [ ] **Step 1: testes em `App.test.tsx`**, no padrão dos testes da Tela 5 que já existem
  - Fixture com `{ numero: '1.6', naoSeAplica: 'Não achamos tabela (<table>) na página.', indicio: null }` e `{ numero: '1.9', indicio: { texto: '2 links abrem…', exemplos: [{ seletor: 'a', trecho: '<a target="_blank">' }] } }`.
  - A aba se chama "Revisão humana (N-1)".
  - Existe um título "Provavelmente não se aplicam nesta página (1)".
  - A caixa de 1.9 tem descrição com "Indício: 2 links abrem…".
  - Marcar a caixa de 1.6 não muda "0 de …" na frase junto do "Baixar PDF".
- [ ] **Step 2:** rodar `npm test -w apps/web`. Esperado: FAIL.
- [ ] **Step 3:** implementar. Carregar antes as skills `vercel-react-best-practices` e `web-design-guidelines`.
- [ ] **Step 4:** rodar `npm test -w apps/web`. Esperado: PASS.
- [ ] **Step 5: e2e.** O fixture de `avaliacao.spec.ts` ganha `naoSeAplica: null, indicio: null` nos itens atuais e um item do grupo. Os testes que procuram "Revisão humana (2)" continuam com o nome certo. Um caso novo confere três coisas: o axe passa na aba com grupo e indício, o Tab chega às caixas do grupo e o foco fica visível.
- [ ] **Step 6:** `npm run test:e2e`. Esperado: todos passam.
- [ ] **Step 7:** commit `feat: Tela 5 com indícios no topo e grupo dos que não se aplicam`.

### Task 7: documentos e checagem final

**Files:**

- Modify: `docs/design.md` (Tela 5, revisão humana, e roteiro do leitor de tela)
- Modify: `docs/architecture.md` ("Dados e migrações": incluir as 3 últimas migrações, que estão desatualizadas)
- Modify: `docs/quality.md` (o que a detecção cobre e o que não cobre: player feito em JavaScript, conteúdo que carrega ao rolar, mais de 20 frames)
- Modify: `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D (linha de 21/11 com as decisões do spec)
- Modify: `docs/handoff.md`

- [ ] **Step 1:** atualizar os documentos.
- [ ] **Step 2:** `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar`. Esperado: exit 0.
- [ ] **Step 3:** `npm run verificar` e `npm run test:e2e`. Esperado: exit 0 nos dois.
- [ ] **Step 4:** `/code-review` na branch. Corrigir ou justificar cada achado.
- [ ] **Step 5:** commit `docs: revisão automática no design, arquitetura, qualidade e decisões`.
