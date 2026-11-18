# Alto contraste e resposta ao passar o mouse — design (18/11/2026)

## Por quê

No teste manual de 18/11, o João sentiu falta de interatividade: os botões não reagem ao mouse, e não há como aumentar o contraste para quem tem baixa visão. O AcessaWeb vende acessibilidade; a própria interface precisa dar esse exemplo (RNF01). O eMAG 3.1 prevê a opção de alto contraste na barra de acessibilidade.

## Objetivos

- Todo botão e link responde ao mouse (`:hover`) e ao clique (`:active`), em todas as telas, sem mexer em cada tela.
- Um botão "Alto contraste" no cabeçalho, em todas as telas, liga e desliga um tema de alto contraste. A escolha fica salva no navegador.

## Fora do escopo

- Alternar claro e escuro (opção B): o site continua seguindo o sistema operacional quando o alto contraste está desligado.
- Barra de acessibilidade completa do eMAG (atalhos numerados, aumentar fonte).
- Animações além de uma transição curta de cor.

## Anti-objetivos

- O estado de hover não pode baixar o contraste do texto abaixo de 4,5:1, nem o da borda abaixo de 3:1.
- O hover não pode ser o único sinal de que algo é clicável; o foco visível atual continua igual.
- O tema não pode piscar no tema errado ao abrir a página.

## Abordagens

- **A. Tema de alto contraste (escolhida pelo João):** fundo preto, texto branco, links, botões e foco em amarelo. Atende quem tem baixa visão.
- **B. Alternar claro e escuro:** mais barato, porque os dois temas já existem, mas o escuro não é alto contraste.
- **C. As duas coisas:** mais completo, porém com mais botões no cabeçalho.

Hover: no `design-system/components/bundle.css` (uma regra vale para todas as telas), em vez de por tela.

## Como fica

**Tokens.** `design-system/tokens.json` ganha um terceiro tema, `contraste`. O gerador `scripts/gerar-tokens-css.mjs` emite `:root[data-theme='contraste']` depois do bloco escuro, com todas as cores que mudam em relação ao claro, e `color-scheme: dark`. Cores propostas, todas com 7:1 ou mais sobre o preto: `bg` e `surface` `#000000`; `ink` e `muted` `#ffffff`; `line` e `line-strong` `#ffffff`; `accent` e `focus` `#ffff00`; `accent-ink` `#000000`; `accent-soft` `#333300`; `alta` `#ff8a80`; `media` `#ffd54f`; `ok` `#69f0ae`; fundos de aviso e `code-bg` `#000000`, com a borda em branco.

**Hover e clique** (`bundle.css`):

- `.btn` principal: fundo um pouco mais escuro (`color-mix` do `accent` com o `ink`).
- `.btn.sec`, `.btn.txt`: fundo `accent-soft`.
- `.btn.perigo`: fundo `alta-bg`.
- Links: sublinhado mais grosso.
- `:active`: o botão desce 1 px.
- Botão desabilitado não reage.
- Transição de 120 ms só na cor, desligada com `prefers-reduced-motion`.

**Botão.** Em `Layout.tsx`, no cabeçalho, antes de "Entrar" e "Olá", e visível mesmo enquanto a sessão carrega. Texto fixo "Alto contraste" e `aria-pressed` ligado ou desligado. É o leitor de tela que anuncia o estado. Usa o componente `Botao` (variante `txt`).

**Salvar a escolha.** Fica no `localStorage`, na chave `acessaweb-contraste`, com `try/catch`: sem armazenamento, o botão funciona só na visita. O tema é aplicado em `main.tsx` antes do primeiro render (`document.documentElement.dataset.theme`), para não piscar. Desligar remove o `data-theme`, e o site volta a seguir o sistema.

**Esboço do cabeçalho:**

```
[✓ AcessaWeb]                    [Alto contraste]  Olá, Helena  [Sair]
```

## Como provar

- **Vitest:** o botão alterna `aria-pressed`, o `data-theme` da página e o `localStorage`; ao abrir com a escolha salva, a página já começa em contraste.
- **e2e:** liga o alto contraste só com o teclado; o axe não acha violações sérias nas telas, com e sem contraste.
- **Contraste conferido:** pares texto e fundo do tema novo e dos estados de hover.
- `npm run verificar` e `npm run test:e2e`.

## Documentos

- `design-system/README.md`: tema de alto contraste e estados de hover.
- `docs/design.md`: botão de contraste no cabeçalho.

## Deixado para quem constrói

- Ajuste fino das cores, desde que mantenha 7:1 no texto e 3:1 nas bordas.
- Posição exata do botão quando o cabeçalho quebra linha em tela estreita.
