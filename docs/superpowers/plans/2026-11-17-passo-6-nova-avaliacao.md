# Passo 6 · Nova avaliação e análise — Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`) para acompanhar o andamento.

**Objetivo:** quem entrou digita a URL de uma página pública, acompanha a análise na Tela 4 e as falhas ficam gravadas no banco.

**Arquitetura:** `POST /api/avaliacoes` valida a URL (inclusive contra SSRF), grava a avaliação como `NA_FILA` e a coloca numa fila em memória que roda **uma análise por vez** no servidor inteiro. A análise (`analisar.ts`, já existente) ganha limite de tempo e de tamanho, ambiente mínimo para o Chromium e conferência de endereço em cada pedido da página. A Tela 4 pergunta `GET /api/avaliacoes/:id` a cada 2 s.

**Tecnologias:** Express 5.3, Prisma 7.10 (PostgreSQL 17), Playwright 1.64 + `@axe-core/playwright` 4.14, React 19.3 + React Router, Vitest 5, Playwright Test. Sem dependência nova.

**Spec:** `docs/passo-a-passo-mvp.md` (Passo 6), `PRODUCT.md`, requisitos RF02, RF03, RF04, RF17, RNF06 e RNF10 em `projeto/contexto_agente/fontes/projeto/Plano_de_Projeto.md`, protótipo das Telas 3, 4 e 4b em `projeto/docs/prototipo/prototipo_emagvalid.html`, e as decisões do João de 17/11/2026 abaixo.

## Decisões já tomadas (João, 17/11/2026)

- Uma análise por vez no servidor inteiro; as outras ficam na fila (`NA_FILA`).
- Limite de 10 análises por hora por conta (RNF10).
- O tempo de acordar do Render fica como está.

## Decisões propostas neste plano (o João confere na revisão)

1. **Uma análise pendente por conta:** quem já tem uma análise `NA_FILA` ou `ANALISANDO` recebe 409 ao pedir outra. Isso impede que uma conta encha a fila.
2. **URL sem `https://`:** a API completa com `https://`. Só `http:` e `https:`, sem usuário e senha no endereço e sem porta fora do padrão.
3. **Redirecionamento (RF17):** a análise segue o redirecionamento, desde que o destino seja público, e grava o endereço final em `urlFinal`. A tela mostra o endereço avaliado.
4. **Página que pede login (RF17):** só se detecta pela resposta HTTP 401 ou 403. Uma página com caixa de login que responde 200 é analisada normalmente.
5. **Tamanho máximo (RNF10):** o HTML principal pode ter até 5 MB. Página grande (R7): acima de 3.000 elementos, a Tela 4 mostra o aviso e a análise continua. Os 3.000 são provisórios até a medição da Tarefa 9.
6. **Tempo máximo (RNF06):** 60 s para a análise inteira (abrir a página + axe).
7. **Falhas gravadas:** uma linha por requisito do eMAG e por ocorrência. Regra do axe sem requisito do eMAG não é gravada. No máximo 50 ocorrências por regra; o trecho é cortado em 1.000 caracteres. A nota (Passo 7) conta requisitos, não ocorrências, então o corte não muda a nota.
8. **Fila em memória:** quando o servidor reinicia (o Render hiberna), as análises `NA_FILA` e `ANALISANDO` viram `ERRO` com aviso para tentar de novo.
9. **Textos em pt-BR do axe:** `descricao` da falha vem da tradução `pt_BR` do próprio axe-core.
10. **Tela 4 sem "Cancelar":** o botão do protótipo fica fora. O Passo 6 não pede.
11. **Tela 4 ao concluir:** até o Passo 7, mostra só um resumo (quantas falhas e em quantos requisitos) e o botão "Nova avaliação".
12. **SSRF por lista de bloqueio, não de permitidos:** a regra pessoal do João pede lista de permitidos para URL vinda do usuário, mas o produto existe para analisar qualquer site público, então não dá para listar os domínios de antemão. O plano bloqueia as faixas internas, confere em cada pedido e, na dúvida, bloqueia. **O João confirma esta exceção.**
13. **Log de segurança:** URL recusada por ser interna e análise `BLOQUEADO` vão para o log com o id da conta e só o nome do host, sem o endereço completo.

## Restrições gerais

- Nomes do domínio e comentários em pt-BR; código no estilo existente (`apps/api/src/rotas/auth.ts`).
- Mudança no banco só por migração: `npm run db:migrate -w apps/api -- --name <nome>`. Carregue a skill `supabase-postgres-best-practices` antes.
- Ao escrever React, carregue `vercel-react-best-practices`; antes de entregar tela, `web-design-guidelines`.
- Interface eMAG 3.1/WCAG: teclado, foco visível, rótulo visível, alvos de 44 px, andamento anunciado sem roubar o foco (`aria-live="polite"`).
- Trechos da página analisada sempre como texto, nunca como HTML (RNF10). Nada de `dangerouslySetInnerHTML`.
- Erro para o cliente sem detalhe interno: mensagens fixas por código (Tarefa 5).
- Checagem final de cada tarefa: `npm run verificar` com exit 0.

## Foco da revisão

Casos que a especificação implica e que mais podem afetar quem usa. Cada um tem teste na tarefa indicada.

1. URL pública que redireciona para endereço interno (`127.0.0.1`, `169.254.169.254`) → `BLOQUEADO`, nada é aberto (Tarefa 3).
2. Servidor reinicia no meio da análise → avaliação vira `ERRO` com "tente de novo", não fica "Analisando" para sempre (Tarefa 5).
3. Dois cliques rápidos em "Avaliar página" → um pedido só (Tarefa 7) e, se chegar o segundo, 409 (Tarefa 6).
4. Endereço digitado sem `https://` (`www.loja.com.br`) → aceito como `https://www.loja.com.br/` (Tarefa 1).
5. Página com milhares de falhas iguais → no máximo 50 por regra, trecho cortado (Tarefa 5).

**Risco que fica (registrar como `shortcut:`):** _DNS rebinding_, quando um domínio responde um IP público na conferência e um IP interno quando o Chromium abre. A conferência em cada pedido (Tarefa 3) reduz o risco, mas não fecha a janela entre as duas consultas. Corrigir de vez exige um proxy próprio; fica para depois do MVP.

## Ondas (regra de `.claude/rules/parallel-subagent-driven-development.md`)

| Tarefa                       | Arquivos                                                                                                                                                 | Recursos                     | Depende de                     |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------ |
| 1 Endereço público           | `apps/api/src/analise/endereco.ts`, `endereco.test.ts`                                                                                                   | DNS real só no teste marcado | nenhuma                        |
| 2 Migração                   | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/*`                                                                                          | banco local (Docker)         | nenhuma                        |
| 3 Análise protegida          | `apps/api/src/analise/analisar.ts`, `analisar.test.ts`, `cli.ts`                                                                                         | Chromium, portas efêmeras    | 1                              |
| 4 Fila                       | `apps/api/src/analise/fila.ts`, `fila.test.ts`                                                                                                           | nenhum                       | nenhuma                        |
| 5 Executar avaliação         | `apps/api/src/analise/executar.ts`, `executar.test.ts`, `apps/api/src/server.ts`                                                                         | nenhum (db falso)            | 2, 3, 4                        |
| 6 Rotas                      | `apps/api/src/rotas/avaliacoes.ts`, `avaliacoes.test.ts`, `apps/api/src/app.ts`                                                                          | nenhum (db falso)            | 1, 5                           |
| 7 Tela 3                     | `apps/web/src/paginas/NovaAvaliacao.tsx`, `apps/web/src/api.ts`, `apps/web/src/App.tsx`, `apps/web/src/paginas/Inicial.tsx`, `apps/web/src/App.test.tsx` | nenhum                       | nenhuma (contrato da Tarefa 6) |
| 8 Tela 4                     | `apps/web/src/paginas/Analise.tsx`, `apps/web/src/App.tsx`, `apps/web/src/App.test.tsx`, `apps/web/e2e/avaliacao.spec.ts`                                | porta 4173 do e2e            | 7                              |
| 9 Medição, docs e prova real | `docs/architecture.md`, `docs/passo-a-passo-mvp.md`, constante da Tarefa 5                                                                               | banco local, porta 3000/5173 | todas                          |

Ondas: **A** = 1, 2, 4, 7 · **B** = 3, 8 · **C** = 5 · **D** = 6 · **E** = 9. Quem implementa não faz commit; quem coordena faz um commit por tarefa.

---

### Tarefa 1: Endereço público (SSRF, RNF10)

**Arquivos:**

- Criar: `apps/api/src/analise/endereco.ts`
- Teste: `apps/api/src/analise/endereco.test.ts`

**Interfaces:**

- Produz:
  - `prepararUrl(texto: string): { url: URL } | { erro: string }`
  - `ipBloqueado(ip: string): boolean`
  - `type TipoEndereco = 'publico' | 'interno' | 'inexistente'`
  - `classificarEndereco(hostname: string, resolver?: (host: string) => Promise<string[]>): Promise<TipoEndereco>`
  - `MSG_URL` (objeto com os textos abaixo, usado pela Tarefa 6)

- [ ] **Passo 1: testes que falham**

```ts
describe('prepararUrl', () => {
  it('completa com https:// e aceita http e https', () => {
    expect(ok(prepararUrl(' www.loja.com.br '))).toBe('https://www.loja.com.br/')
    expect(ok(prepararUrl('http://loja.com.br/a?b=1'))).toBe('http://loja.com.br/a?b=1')
  })
  it('recusa com a mensagem do campo', () => {
    expect(prepararUrl('')).toEqual({ erro: MSG_URL.vazia })
    expect(prepararUrl('ftp://loja.com.br')).toEqual({ erro: MSG_URL.invalida })
    expect(prepararUrl('https://' + 'a'.repeat(2050) + '.com')).toEqual({ erro: MSG_URL.invalida })
    expect(prepararUrl('https://ana:123@loja.com.br')).toEqual({ erro: MSG_URL.comSenha })
    expect(prepararUrl('https://loja.com.br:8080')).toEqual({ erro: MSG_URL.comPorta })
  })
})
describe('ipBloqueado', () => {
  it.each([
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '192.168.1.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '::1',
    'fc00::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:7f00:1',
  ])('%s bloqueado', (ip) => expect(ipBloqueado(ip)).toBe(true))
  it.each(['8.8.8.8', '200.160.2.3', '2001:4860:4860::8888'])('%s liberado', (ip) =>
    expect(ipBloqueado(ip)).toBe(false),
  )
})
describe('classificarEndereco', () => {
  it('interno se qualquer IP do nome for interno', async () => {
    expect(await classificarEndereco('x.teste', async () => ['8.8.8.8', '10.0.0.1'])).toBe(
      'interno',
    )
  })
  it('IP literal não passa pelo DNS', async () => {
    expect(
      await classificarEndereco('127.0.0.1', async () => {
        throw new Error('não chamar')
      }),
    ).toBe('interno')
  })
  it('nome que não resolve é inexistente', async () => {
    expect(
      await classificarEndereco('x.teste', async () => {
        throw Object.assign(new Error(), { code: 'ENOTFOUND' })
      }),
    ).toBe('inexistente')
  })
})
```

(`ok` é um ajudante do teste que devolve `resultado.url.href` ou falha.)

- [ ] **Passo 2:** `npx vitest run apps/api/src/analise/endereco.test.ts` → FALHA (módulo não existe).

- [ ] **Passo 3: implementar em `endereco.ts`**
  - `prepararUrl`: `trim`; vazio → `vazia`; sem `://` no começo, prefixa `https://`; mais de 2048 caracteres ou `new URL` falha ou protocolo diferente de `http:`/`https:` → `invalida`; `username` ou `password` → `comSenha`; `port !== ''` → `comPorta`.
  - `ipBloqueado`: `BlockList` de `node:net`. IPv4: `0.0.0.0/8`, `10.0.0.0/8`, `100.64.0.0/10`, `127.0.0.0/8`, `169.254.0.0/16`, `172.16.0.0/12`, `192.0.0.0/24`, `192.168.0.0/16`, `198.18.0.0/15`, `224.0.0.0/4`, `240.0.0.0/4`. IPv6: `::/128`, `::1/128`, `fc00::/7`, `fe80::/10`, `ff00::/8`, `2001:db8::/32`, `64:ff9b::/96`. Endereço `::ffff:` (IPv4 mapeado, nas duas formas) é convertido para IPv4 antes. Texto que não é IP → `true`.
  - `classificarEndereco`: tira os colchetes de IPv6; IP literal (`isIP`) → decide direto; senão `resolver` (padrão: `dns.promises.lookup(host, { all: true })` → endereços); erro `ENOTFOUND`/`ENODATA` → `inexistente`; outro erro → `interno` (na dúvida, bloqueia); algum IP bloqueado → `interno`.
  - Textos exatos:

```ts
export const MSG_URL = {
  vazia: 'Digite o endereço da página.',
  invalida: 'Digite um endereço completo, como https://www.suaempresa.com.br.',
  comSenha: 'Tire o usuário e a senha do endereço. Avaliamos só páginas públicas.',
  comPorta: 'Use o endereço sem número de porta (como :8080).',
  interno:
    'Esse endereço não é de uma página pública na internet. Use o endereço que abre em qualquer navegador.',
  inexistente: 'Não encontramos esse endereço. Confira se ele está escrito certo.',
}
```

- [ ] **Passo 4:** mesmo comando → PASSA.
- [ ] **Passo 5 (coordenador):** commit `feat: confere se a URL é de uma página pública (SSRF)`.

---

### Tarefa 2: Migração `urlFinal` e `paginaGrande`

**Arquivos:** `apps/api/prisma/schema.prisma` (modelo `Avaliacao`), migração nova.

**Interfaces:** Produz `Avaliacao.urlFinal: string | null` e `Avaliacao.paginaGrande: boolean` (padrão `false`).

- [ ] **Passo 1:** carregar a skill `supabase-postgres-best-practices`.
- [ ] **Passo 2:** no modelo `Avaliacao`, acrescentar `urlFinal String? // endereço depois dos redirecionamentos (RF17)` e `paginaGrande Boolean @default(false) // aviso da Tela 4 (R7)`.
- [ ] **Passo 3:** `npm run db:up && npm run db:migrate -w apps/api -- --name avaliacao_url_final_pagina_grande`. Esperado: migração criada e aplicada; o SQL só tem `ALTER TABLE "avaliacoes" ADD COLUMN` (sem `DROP`).
- [ ] **Passo 4:** `npm run typecheck` → exit 0.
- [ ] **Passo 5 (coordenador):** commit `feat: guarda o endereço final e o aviso de página grande da avaliação`.

---

### Tarefa 3: Análise protegida (RNF10, RF17, RNF06)

**Arquivos:**

- Modificar: `apps/api/src/analise/analisar.ts`, `apps/api/src/analise/cli.ts`
- Teste: `apps/api/src/analise/analisar.test.ts`

**Interfaces:**

- Consome: `classificarEndereco` (Tarefa 1).
- Produz:

```ts
export type CodigoErro = 'INDISPONIVEL' | 'DEMOROU' | 'NAO_HTML' | 'PEDE_LOGIN' | 'GRANDE_DEMAIS' | 'BLOQUEADO' | 'FALHOU'
export class ErroDeAnalise extends Error { constructor(readonly codigo: CodigoErro, causa?: unknown) }
export interface OpcoesAnalise {
  limiteMs?: number                                  // padrão 60_000, para a análise inteira
  conferirEndereco?: (hostname: string) => Promise<boolean> // padrão: classificarEndereco(h) === 'publico'
  aoCarregar?: (elementos: number) => void           // chamado uma vez, depois que a página abriu
}
export interface ResultadoAnalise { violacoes: Violacao[]; urlFinal: string }
export const TAMANHO_MAXIMO = 5 * 1024 * 1024
export function ambienteDoNavegador(env: NodeJS.ProcessEnv): Record<string, string>
export async function analisar(url: string, opcoes?: OpcoesAnalise): Promise<ResultadoAnalise>
```

- [ ] **Passo 1: testes que falham.** O servidor de teste passa a responder por caminho: `/` (HTML atual), `/texto` (`text/plain`), `/login` (401), `/sumiu` (404), `/vai` (302 para `/`), `/fora` (302 para `http://localhost:<porta>/`), `/lenta` (nunca responde), `/enorme` (HTML com mais de `TAMANHO_MAXIMO` bytes). Todos os testes passam `conferirEndereco: async (h) => h === '127.0.0.1'`.

```ts
it('acha a imagem sem alt com seletor, trecho e texto em pt-BR', ...)        // regra image-alt, seletor 'img', ajuda sem 'Images must'
it('segue o redirecionamento e devolve o endereço final', ...)               // `${url}/vai` → urlFinal === `${url}/`
it('redirecionamento para endereço não público → BLOQUEADO', ...)           // `${url}/fora` rejeita com codigo 'BLOQUEADO'
it('endereço inicial não público → BLOQUEADO sem abrir o navegador', ...)
it.each([['/texto','NAO_HTML'], ['/login','PEDE_LOGIN'], ['/sumiu','INDISPONIVEL'], ['/enorme','GRANDE_DEMAIS']])
  ('%s → %s', ...)
it('porta sem ninguém → INDISPONIVEL', ...)                                  // substitui o teste do ERR_CONNECTION_REFUSED
it('passou do limite de tempo → DEMOROU', ...)                               // `${url}/lenta`, limiteMs 1_500
it('avisa quantos elementos a página tem', ...)                              // aoCarregar recebe número > 0
it('o Chromium não recebe DATABASE_URL nem chaves', () => {
  const env = ambienteDoNavegador({ PATH: '/bin', HOME: '/h', LANG: 'pt_BR.UTF-8', DATABASE_URL: 'x', GEMINI_API_KEY: 'y' })
  expect(env).toEqual({ PATH: '/bin', HOME: '/h', LANG: 'pt_BR.UTF-8' })
})
```

- [ ] **Passo 2:** `npx vitest run apps/api/src/analise/analisar.test.ts` → FALHA.

- [ ] **Passo 3: implementar.** Antes, confirme no Context7 (Playwright 1.64 e `@axe-core/playwright` 4.14): `page.route`, `page.routeWebSocket`, `chromium.launch({ env })` e como passar o locale `axe-core/locales/pt_BR.json` ao `AxeBuilder`.
  - Confere o host da URL inicial; não público → `BLOQUEADO` antes do `launch`.
  - `chromium.launch({ env: ambienteDoNavegador(process.env) })`; `ambienteDoNavegador` copia só `PATH`, `HOME` e `LANG` (os que existirem).
  - Contexto com `serviceWorkers: 'block'`. `page.route('**/*')`: para `http:`/`https:`, confere o host (cache por análise); não público → `route.abort('blockedbyclient')`, senão `route.continue()`. Outros esquemas (`data:`, `blob:`) seguem. `page.routeWebSocket(/.*/, (ws) => ws.close())`.
  - Um `setTimeout(limiteMs)` fecha o navegador e marca `DEMOROU`; o `goto` usa o mesmo limite.
  - Resposta do `goto`: status 401/403 → `PEDE_LOGIN`; outro status ≥ 400 → `INDISPONIVEL`; `content-type` sem `text/html` nem `application/xhtml+xml` → `NAO_HTML`; `(await resposta.body()).length > TAMANHO_MAXIMO` → `GRANDE_DEMAIS`.
  - Erros do `goto`: `ERR_BLOCKED_BY_CLIENT` → `BLOQUEADO`; `Timeout` → `DEMOROU`; `ERR_NAME_NOT_RESOLVED`, `ERR_CONNECTION_*`, `ERR_ADDRESS_UNREACHABLE` → `INDISPONIVEL`; qualquer outro → `FALHOU`.
  - Depois do `load`: `aoCarregar(await pagina.locator('*').count())`; axe com locale pt-BR; `urlFinal = pagina.url()`.
  - Comentário `shortcut:` sobre DNS rebinding (ver "Foco da revisão") no lugar do `shortcut:` atual de SSRF.
  - `cli.ts`: usar `resultado.violacoes`, escrever também o número de elementos (via `aoCarregar`) e o `urlFinal`. A Tarefa 9 usa essa saída para medir.
- [ ] **Passo 4:** mesmo comando → PASSA; `npm run typecheck` → exit 0.
- [ ] **Passo 5 (coordenador):** commit `feat: protege a análise com limite de tempo e tamanho e endereço público em cada pedido`.

---

### Tarefa 4: Fila de uma análise por vez

**Arquivos:** criar `apps/api/src/analise/fila.ts` e `fila.test.ts`.

**Interfaces:** Produz `criarFila(processar: (id: string) => Promise<void>): { adicionar(id: string): void; posicao(id: string): number | null }`. `posicao` = quantas análises estão antes desta (0 = é a próxima ou já está rodando); `null` = não está na fila.

- [ ] **Passo 1: testes que falham**

```ts
it('roda uma por vez, na ordem de chegada', ...)        // processar com promessas controladas; nunca 2 rodando; ordem ['a','b','c']
it('posicao conta quem está antes', ...)               // rodando 'a', esperando 'b','c' → posicao('a')=0, ('b')=1, ('c')=2, ('x')=null
it('um erro em uma não para a fila', ...)              // 'a' rejeita, 'b' roda mesmo assim
```

- [ ] **Passo 2:** `npx vitest run apps/api/src/analise/fila.test.ts` → FALHA.
- [ ] **Passo 3:** implementar com um array e um laço assíncrono que só um chamador por vez inicia. O erro de `processar` vai para `console.error` (com `// oxlint-disable-next-line no-console`, como em `server.ts`) e a fila segue. Comentário `shortcut:` explicando que a fila vive na memória de uma instância só.
- [ ] **Passo 4:** mesmo comando → PASSA.
- [ ] **Passo 5 (coordenador):** commit `feat: cria a fila que roda uma análise por vez`.

---

### Tarefa 5: Executar a avaliação e gravar as falhas (RF03, RF04)

**Arquivos:**

- Criar: `apps/api/src/analise/executar.ts`, `executar.test.ts`
- Modificar: `apps/api/src/server.ts` (chamar `recuperarInterrompidas()` antes do `listen`)

**Interfaces:**

- Consome: `analisar`, `ErroDeAnalise`, `CodigoErro` (Tarefa 3), `criarFila` (Tarefa 4), `requisitosDaRegra` (`apps/api/src/emag/requisitos.ts`), `db`.
- Produz:

```ts
export const LIMITE_PAGINA_GRANDE = 3_000 // shortcut: provisório até a medição da Tarefa 9
export const MAX_OCORRENCIAS_POR_REGRA = 50
export const MAX_TRECHO = 1_000
export const MENSAGEM_ERRO: Record<CodigoErro | 'INTERROMPIDA', string>
export type FalhaNova = {
  requisitoEmag: string
  descricao: string
  prioridade: Prioridade
  seletor: string
  trecho: string
  revisaoHumana: boolean
}
export function falhasDaAnalise(violacoes: Violacao[]): FalhaNova[]
export const andamento: Map<string, { etapa: 1 | 2 | 3; paginaGrande: boolean }>
export async function executarAvaliacao(id: string): Promise<void>
export const fila: ReturnType<typeof criarFila> // criarFila(executarAvaliacao)
export async function recuperarInterrompidas(): Promise<number>
```

Textos exatos de `MENSAGEM_ERRO`:

```ts
INDISPONIVEL: 'Não conseguimos abrir essa página. Confira se o endereço está certo e se a página abre no seu navegador.',
DEMOROU: 'A página demorou demais para responder. Tente de novo daqui a alguns minutos.',
NAO_HTML: 'Esse endereço abre um arquivo, não uma página. Informe o endereço de uma página do site.',
PEDE_LOGIN: 'Essa página pede login. Por enquanto, avaliamos só páginas públicas.',
GRANDE_DEMAIS: 'A página é grande demais para analisar (mais de 5 MB). Tente outra página do site.',
BLOQUEADO: 'Esse endereço não é de uma página pública na internet. Use o endereço que abre em qualquer navegador.',
FALHOU: 'A análise falhou do nosso lado. Tente de novo em instantes.',
INTERROMPIDA: 'A análise foi interrompida porque o servidor reiniciou. Tente de novo.',
```

- [ ] **Passo 1: testes que falham.** `vi.mock('../db.js')` com `avaliacao.findUnique/update/updateMany`, `falha.createMany` e `$transaction` (recebe array e resolve); `vi.mock('./analisar.js')` com `analisar` controlado e o `ErroDeAnalise` real (`vi.importActual`).

```ts
it('uma falha por requisito e ocorrência, com prioridade e revisão humana', ...)
  // regra 'image-alt' (1 ocorrência) → requisitoEmag do mapeamento, prioridade do requisito,
  // revisaoHumana === (cobertura === 'parcial')
it('ignora regra sem requisito do eMAG', ...)                         // regra 'regra-inventada' → []
it('no máximo 50 ocorrências por regra e trecho de até 1.000 caracteres', ...)
it('conclui: grava falhas, urlFinal e CONCLUIDA; andamento passa por 1, 2 e 3', ...)
it('página com mais de LIMITE_PAGINA_GRANDE elementos marca paginaGrande', ...)
it('erro conhecido grava ERRO com a mensagem do código', ...)          // ErroDeAnalise('PEDE_LOGIN') → MENSAGEM_ERRO.PEDE_LOGIN
it('erro desconhecido grava a mensagem FALHOU, sem detalhe interno', ...)
it('recuperarInterrompidas troca NA_FILA e ANALISANDO por ERRO INTERROMPIDA', ...)
```

- [ ] **Passo 2:** `npx vitest run apps/api/src/analise/executar.test.ts` → FALHA.
- [ ] **Passo 3: implementar.**
  - `executarAvaliacao`: busca a avaliação (sumiu → retorna); `andamento.set(id, { etapa: 1, paginaGrande: false })`; `status: 'ANALISANDO'`; `analisar(url, { aoCarregar })`. O `aoCarregar` passa para a etapa 2 e marca `paginaGrande` se `elementos > LIMITE_PAGINA_GRANDE`. Depois: etapa 3; numa `$transaction`, `falha.createMany` + `update` (`CONCLUIDA`, `concluidaEm`, `urlFinal`, `paginaGrande`). Em erro: `update` para `ERRO` com `MENSAGEM_ERRO[codigo]` (ou `FALHOU`) e `console.error` só do código (em `BLOQUEADO`, também o id da conta e o host, decisão 13). Sempre `andamento.delete(id)` no fim.
  - `descricao` = `violacao.ajuda` (já em pt-BR pela Tarefa 3).
- [ ] **Passo 4:** mesmo comando → PASSA; `npm run typecheck` → exit 0.
- [ ] **Passo 5 (coordenador):** commit `feat: executa a avaliação na fila e grava as falhas por requisito do eMAG`.

---

### Tarefa 6: Rotas `POST /api/avaliacoes` e `GET /api/avaliacoes/:id` (RF02, RNF10)

**Arquivos:**

- Criar: `apps/api/src/rotas/avaliacoes.ts`, `avaliacoes.test.ts`
- Modificar: `apps/api/src/app.ts` (`app.use('/api/avaliacoes', rotasAvaliacoes)`, depois de `/api/auth`)

**Interfaces:**

- Consome: `prepararUrl`, `classificarEndereco`, `MSG_URL` (Tarefa 1); `fila`, `andamento` (Tarefa 5); `exigirLogin` (`auth/sessao.ts`).
- Produz o contrato que as Telas 3 e 4 usam:
  - `POST /api/avaliacoes` `{ url }` → `202 { avaliacao: { id } }` · `400 { erro: 'Confira os campos marcados.', campos: { url } }` · `401` · `409 { erro }` · `429 { erro }`
  - `GET /api/avaliacoes/:id` → `200 { avaliacao: { id, url, urlFinal, status, etapa, posicaoNaFila, paginaGrande, mensagemErro, falhas } }` · `404 { erro: 'Avaliação não encontrada.' }`. `etapa` e `posicaoNaFila` são `null` quando não se aplicam; `falhas` só traz itens quando `CONCLUIDA` (`requisitoEmag, descricao, prioridade, seletor, trecho, revisaoHumana`).

- [ ] **Passo 1: testes que falham.** Mocks: `../db.js` (avaliação em memória: `create`, `count`, `findFirst`), `../analise/executar.js` (`fila.adicionar` espião, `fila.posicao`, `andamento`), `../analise/endereco.js` parcial (`classificarEndereco` controlado, resto real), `../auth/sessao.js` (`exigirLogin` lê o cabeçalho de teste `x-usuario`; sem ele, 401).

```ts
it('sem login → 401', ...)
it('URL inválida → 400 no campo url', ...)                       // { url: 'ftp://x' } → campos.url === MSG_URL.invalida
it('endereço interno ou inexistente → 400 com a mensagem certa', ...)
it('cria NA_FILA com a URL preparada, enfileira e responde 202', ...)  // 'www.loja.com.br' grava 'https://www.loja.com.br/'
it('com análise pendente → 409', ...)        // 'Você já tem uma análise em andamento. Espere ela terminar para começar outra.'
it('11ª análise na mesma hora → 429', ...)   // 'Você chegou ao limite de 10 análises por hora. Tente de novo mais tarde.'
it('GET de avaliação de outra conta ou id que não é UUID → 404', ...)
it('GET em andamento traz etapa, posição e paginaGrande; concluída traz as falhas', ...)
```

- [ ] **Passo 2:** `npx vitest run apps/api/src/rotas/avaliacoes.test.ts` → FALHA.
- [ ] **Passo 3: implementar.** A ordem no POST é: `prepararUrl` → `classificarEndereco` → pendente (`count` com `status in [NA_FILA, ANALISANDO]`) → limite (`count` com `criadaEm >= agora - 1 h`, máximo 10) → `create` → `fila.adicionar(id)`. Conta pelo banco, não pela memória, para o limite valer depois de o Render reiniciar. Endereço `interno` → `console.error` com `Endereço interno recusado: conta <usuarioId>, host <hostname>` (decisão 13). GET: UUID inválido → 404 sem ir ao banco; `findFirst({ where: { id, usuarioId } })`, então a avaliação de outra conta também dá 404.
- [ ] **Passo 4:** mesmo comando → PASSA; `npm run verificar` → exit 0.
- [ ] **Passo 5 (coordenador):** commit `feat: cria as rotas da nova avaliação com fila e limite por conta`.

---

### Tarefa 7: Tela 3 · Nova avaliação

**Arquivos:**

- Criar: `apps/web/src/paginas/NovaAvaliacao.tsx`
- Modificar: `apps/web/src/api.ts` (`buscar`), `apps/web/src/App.tsx` (rota `avaliacoes/nova`), `apps/web/src/paginas/Inicial.tsx` (botão para quem entrou), `apps/web/src/App.test.tsx`

**Interfaces:**

- Consome: o contrato da Tarefa 6.
- Produz: `buscar<T>(caminho: string): Promise<Resposta<Partial<T>>>` (GET, mesmo formato de `enviar`); rota `/avaliacoes/nova`, que aceita `?url=` para vir preenchida.

- [ ] **Passo 1: testes que falham** (em `App.test.tsx`, com `simularApi`):

```ts
it('sem login, /avaliacoes/nova leva para /entrar', ...)
it('quem entrou vê "Nova avaliação" na Tela 1', ...)                    // link para /avaliacoes/nova
it('envia a URL e vai para a Tela 4', ...)                              // POST 202 { avaliacao: { id: 'a1' } } → rota /avaliacoes/a1
it('erro do campo aparece no campo e recebe o foco', ...)               // 400 campos.url
it('409 e 429 aparecem no aviso de erro', ...)
it('?url= vem preenchido', ...)
it('dois cliques mandam um pedido só', ...)
```

- [ ] **Passo 2:** `npm test -w apps/web` → FALHA.
- [ ] **Passo 3: implementar** no padrão de `Cadastro.tsx` (`enviando`, foco no primeiro campo inválido, `Aviso` com `papel="alert"`). Sem login (depois de `carregando`): `<Navigate to="/entrar" replace />`. Textos do protótipo: `<title>Nova avaliação · AcessaWeb</title>`, sobretítulo "Nova avaliação", h1 "Qual página você quer avaliar?", campo "Endereço da página (URL)" (`inputMode="url"`, `autoComplete="url"`, `spellCheck={false}`), dica "Ex.: https://www.suaempresa.com.br/contato", `Aviso`: "Uma página pública por vez. Páginas que pedem login ainda não são avaliadas.", botão "Avaliar página" / "Enviando…". Tela 1 com login: `<Link className="btn" to="/avaliacoes/nova">Nova avaliação</Link>`.
- [ ] **Passo 4:** `npm test -w apps/web` → PASSA.
- [ ] **Passo 5 (coordenador):** commit `feat: cria a Tela 3 para pedir a avaliação de uma URL`.

---

### Tarefa 8: Tela 4 · Análise em andamento, erro (4b/4c) e concluída

**Arquivos:**

- Criar: `apps/web/src/paginas/Analise.tsx`, `apps/web/e2e/avaliacao.spec.ts`
- Modificar: `apps/web/src/App.tsx` (rota `avaliacoes/:id`), `apps/web/src/App.test.tsx`

**Interfaces:** consome `buscar` (Tarefa 7) e o `GET` da Tarefa 6.

- [ ] **Passo 1: testes que falham** (Vitest com `vi.useFakeTimers({ shouldAdvanceTime: true })`):

```ts
it('NA_FILA mostra quantas análises estão antes', ...)       // 'Na fila: 2 análises antes da sua.'
it('ANALISANDO marca a etapa atual com aria-current="step"', ...)
it('pergunta de novo a cada 2 s e para quando conclui', ...)  // fetch chamado de novo após 2_000 ms; depois de CONCLUIDA não chama mais
it('paginaGrande mostra o aviso de demora', ...)
it('ERRO mostra a mensagem da API e "Corrigir o endereço" leva à Tela 3 preenchida', ...)
it('CONCLUIDA mostra o resumo e "Nova avaliação"', ...)       // 3 falhas em 2 requisitos
it('404 mostra "Avaliação não encontrada."', ...)
```

e no e2e (API falsa por `page.route`, como em `conta.spec.ts`): Tela 3 → Tela 4 → concluída, só com teclado, e `semViolacoesSerias` na Tela 3, na Tela 4 em andamento e na Tela 4 com erro.

- [ ] **Passo 2:** `npm test -w apps/web` → FALHA.
- [ ] **Passo 3: implementar.** `useEffect` com `setTimeout` de 2.000 ms encadeado; o efeito é cancelado ao sair da tela e no StrictMode. Textos: `<title>Analisando · AcessaWeb</title>`, sobretítulo "Analisando", h1 "Avaliando a página", meta com a URL. Passos em `<ol aria-live="polite">`: "Carregando a página", "Verificando as recomendações do eMAG 3.1", "Preparando o resultado". Fila: "Na fila: {n} análise(s) antes da sua." (singular e plural certos). Página grande: `Aviso` "Por ser uma página grande, a análise pode demorar mais de 1 minuto." Erro: `Selo` "Erro", h1 "Não conseguimos avaliar essa página.", a `mensagemErro`, "Endereço digitado:" + URL, botão "Corrigir o endereço" → `/avaliacoes/nova?url=<url>`. Concluída: h1 "Análise concluída", "Encontramos {n} falhas em {m} recomendações do eMAG 3.1." (0 falhas: "Não encontramos falhas automáticas. Ainda assim, faça a revisão humana."), "Avaliamos {urlFinal}" quando difere da URL, link "Nova avaliação". Ao mudar de estado (erro, concluída), o foco vai para o novo h1. Erro de rede (status 0): continua perguntando e mostra `mensagemDeErro(0)`.
- [ ] **Passo 4:** `npm test -w apps/web` e `npm run test:e2e` → PASSAM.
- [ ] **Passo 5:** skill `web-design-guidelines` sobre `NovaAvaliacao.tsx` e `Analise.tsx`; corrigir o que for achado.
- [ ] **Passo 6 (coordenador):** commit `feat: cria a Tela 4 com o andamento, a fila e os erros da análise`.

---

### Tarefa 9: Medição, documentação e prova com URL real

**Arquivos:** `docs/architecture.md`, `docs/passo-a-passo-mvp.md`, `apps/api/src/analise/executar.ts` (só `LIMITE_PAGINA_GRANDE`).

- [ ] **Passo 1: medir.** `npm run analisar -w apps/api -- <url>` em 5 páginas públicas reais (uma do governo, uma de pequena empresa, uma grande de notícias). Anotar elementos e tempo. Ajustar `LIMITE_PAGINA_GRANDE` para o número acima do qual a análise passou de ~30 s; registrar as medições no comentário.
- [ ] **Passo 2: prova real.** `npm run db:up`, `npm run dev`; entrar, analisar uma URL real pela Tela 3 e ver a Tela 4 até concluir. Testar também `http://localhost:3000`, que deve recusar no campo. **Feito quando:** `SELECT status, url_final, pagina_grande FROM avaliacoes` e `SELECT count(*) FROM falhas` mostram a análise e as falhas. O João confere no DBeaver (último item do Passo 6).
- [ ] **Passo 3: docs.** `docs/architecture.md`: fila, SSRF, limites e o _shortcut_ de DNS rebinding. `docs/passo-a-passo-mvp.md`: marcar os itens do Passo 6 que foram feitos.
- [ ] **Passo 4: revisão de segurança.** Skill `differential-review` sobre a branch inteira (mudança sensível: SSRF e dados do usuário); relatório em `../acessaweb-privado/relatorios/`. Resolver ou levar ao João os achados relevantes.
- [ ] **Passo 5:** `npm run verificar` e `npm run test:e2e` → exit 0.
- [ ] **Passo 6 (coordenador):** commit `docs: registra a fila, a proteção da análise e a medição de página grande`.

## Fora deste plano

- Registrar as decisões de 17/11/2026 em `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D: é tarefa de documentação (agente `emagvalid`), a pedido do João.
- Nota e Tela 5 (Passo 7), orientações da IA (Passo 8), botão "Cancelar" da Tela 4, função "Excluir minha conta" (depois do Passo 6).
