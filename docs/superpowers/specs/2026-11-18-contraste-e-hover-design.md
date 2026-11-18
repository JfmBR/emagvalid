# Barra de acessibilidade, temas e resposta ao mouse — design (18/11/2026)

## Por quê

No teste manual de 18/11, o João sentiu falta de interatividade. Os botões não reagem ao mouse, e não há como aumentar o contraste para quem tem baixa visão. O AcessaWeb vende avaliação pelo eMAG, então a própria interface precisa dar o exemplo (RNF01). O capítulo 4 do eMAG 3.1 ("Elementos padronizados de acessibilidade digital") pede uma barra de acessibilidade com alto contraste, atalhos e um link para a página de acessibilidade. Fonte: https://emag.governoeletronico.gov.br/, seções 4.1 a 4.5.

## Objetivos

1. **Resposta ao mouse:** todo botão e link responde ao mouse (`:hover`) e ao clique (`:active`), em todas as telas.
2. **Barra de acessibilidade** (eMAG 4.3) no topo de todas as telas. Ela tem:
   - os atalhos "Ir para o conteúdo [1]", "Ir para o menu [2]" e "Ir para o rodapé [4]";
   - os botões "Alto contraste" e "Modo escuro";
   - o link "Acessibilidade".
3. **Alto contraste** nas cores do eMAG 4.2.
4. **Modo escuro** liga e desliga. Sem escolha salva, começa pelo tema do sistema.
5. **Página `/acessibilidade`** (eMAG 4.5), com os atalhos, os temas, o zoom do navegador e os testes que fazemos.
6. **Zoom de 200%** (eMAG, recomendação 4.3): todas as telas continuam legíveis e funcionando, sem rolagem horizontal.

## Fora do escopo

- **Botões A+/A-:** o eMAG 3.1 os retirou de propósito. A seção 1.3 diz "removendo as funcionalidades aumentar e diminuir fonte da barra de acessibilidade, pois os navegadores de internet já possuem estas funcionalidades nativas". No lugar, vale o objetivo 6. Decisão do João em 18/11, opção A.
- **Atalho de busca [3]:** o site não tem busca.
- **Mapa do site** (eMAG 4.4): é um elemento separado da barra, e o site tem poucas telas.

## Anti-objetivos

- O hover não pode baixar o contraste abaixo de 4,5:1 no texto nem de 3:1 nas bordas.
- O foco visível atual continua igual. O hover não pode ser o único sinal de que algo é clicável.
- O tema não pode piscar no tema errado ao abrir a página.
- Não pode haver dois links de pular para o conteúdo.

## Abordagens

- **Tema:**
  - A. Alto contraste (escolhida pelo João).
  - B. Só alternar entre claro e escuro.
  - C. As duas coisas.

  Depois, o João pediu também o modo escuro, a barra completa e a fonte. O resultado ficou A mais o modo escuro, que é a C, dentro da barra do eMAG.

- **Fonte:**
  - A. Seguir o eMAG, com o zoom do navegador e o teste de 200% (escolhida pelo João).
  - B. Botões A+/A-, o que contraria o eMAG 1.3.
- **Hover:** fica no `design-system/components/bundle.css`, para valer em todas as telas, em vez de entrar tela por tela.

## Como fica

**Temas** (`design-system/tokens.json` mais o gerador `scripts/gerar-tokens-css.mjs`)

- Entra o terceiro tema, `contraste`. O gerador o emite como `:root[data-theme='contraste']`, depois do bloco do escuro, com `color-scheme: dark`.
- Cores do eMAG 4.2:
  - `bg`, `surface`, `code-bg` e os fundos de aviso em `#000000`;
  - `ink`, `muted`, `line` e `line-strong` em `#ffffff`;
  - `accent` e `focus` em `#fff333`, com `accent-ink` em `#000000`;
  - `accent-soft` em `#333300`;
  - `alta` `#ff8a80`, `media` `#fff333` e `ok` `#69f0ae`, todas com 7:1 ou mais sobre o preto.
- No contraste, os links ficam sublinhados em todos os estados.

**Estado do tema** (`apps/web/src/tema.ts`)

- Guarda duas escolhas no `localStorage`, sempre com `try/catch`:
  - `acessaweb-contraste`: `sim` ou ausente;
  - `acessaweb-tema`: `claro`, `escuro` ou ausente, que significa seguir o sistema.
- O `data-theme` da página sai assim:
  - com o contraste ligado, `contraste`;
  - senão, a escolha salva;
  - senão, nenhum, e a página segue o sistema.
- `main.tsx` aplica o tema antes do primeiro render.
- Com o modo escuro sem escolha, o estado do botão vem de `matchMedia('(prefers-color-scheme: dark)')`.

**Barra** (`apps/web/src/componentes/BarraAcessibilidade.tsx`, no topo do `Layout`)

- Atalhos: links com `accesskey` 1, 2 e 4 para `#conteudo`, `#menu` (o `nav` "Principal") e `#rodape` (o `footer`).
- "Ir para o conteúdo [1]" é o primeiro link da página e substitui o "Pular para o conteúdo" escondido.
- Botões "Alto contraste" e "Modo escuro" com `aria-pressed`. Usam o `Botao`, variante `txt`.
- Link "Acessibilidade" para `/acessibilidade`.
- Em tela estreita, a barra quebra linha.

**Resposta ao mouse** (`bundle.css`)

- `.btn` principal: fundo com `color-mix` do `accent` com o `ink`.
- `.btn.sec` e `.btn.txt`: fundo `accent-soft`.
- `.btn.perigo`: fundo `alta-bg`.
- Links: sublinhado mais grosso.
- `:active`: o botão desce 1 px.
- Botão desabilitado não reage.
- Transição de 120 ms só na cor, desligada com `prefers-reduced-motion`.

**Página `/acessibilidade`** (`apps/web/src/paginas/Acessibilidade.tsx`, no molde de `Privacidade.tsx`)

- Diz que o site segue o eMAG 3.1.
- Atalhos: Alt + número no Chrome e no Edge, Alt + Shift + número no Firefox, Ctrl + Option + número no Mac.
- Alto contraste e modo escuro.
- Zoom pelo navegador (Ctrl e +, até 200%).
- Testes que fazemos: axe automático, teclado e leitor de tela (NVDA e Orca).

**Esboço:**

```
Ir para o conteúdo [1] · Ir para o menu [2] · Ir para o rodapé [4]   [Alto contraste] [Modo escuro] Acessibilidade
[✓ AcessaWeb]                                                          Olá, Helena  [Sair]
```

## Como provar

- **Vitest:**
  - `tema.ts`: a ordem de prioridade, sem `localStorage` e com a escolha salva;
  - a barra: os botões alternam o `aria-pressed`, o `data-theme` e o que fica salvo;
  - a página `/acessibilidade` abre pela barra.
- **e2e:**
  - Tab leva primeiro a "Ir para o conteúdo [1]", e o Enter leva o foco ao `main`;
  - o alto contraste liga só com o teclado;
  - o axe não acha violação séria nas telas com o tema claro, o escuro e o contraste;
  - com a janela em 640 px de largura, que equivale a 200% de zoom em 1280 px, nenhuma tela rola na horizontal.
- `npm run verificar` e `npm run test:e2e`.

## Documentos

- `design-system/README.md`: os três temas e os estados de hover.
- `docs/design.md`: a barra e a página de acessibilidade.
- `PRODUCT.md`: a barra de acessibilidade e o zoom de 200% entram no escopo, e o A+/A- fica fora, com o motivo.

## Deixado para quem constrói

- Ajuste fino das cores fora do eMAG 4.2, desde que mantenha 7:1.
- O texto exato da página de acessibilidade.
- A quebra de linha da barra em tela estreita.
