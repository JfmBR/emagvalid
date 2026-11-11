# AcessaWeb

Acessibilidade não é nota. É conseguir usar.

Sistema visual do AcessaWeb (Projeto emagvalid · Conecta Jovem · Grupo 3). A interface vem do protótipo clicável das 8 telas (`projeto/docs/prototipo/prototipo_emagvalid.html`, testado em 30/10/2026); a marca, a capa e o tom vêm do pitch (`Pitch_emagvalid_AcessaWeb.pdf`). Valores copiados das fontes, nada inventado; onde as fontes não decidem, este livro diz.

O AcessaWeb é uma ferramenta de acessibilidade, então a própria interface precisa ser exemplar: eMAG 3.1 e WCAG 2.1 AA (RNF01, RNF02).

## Princípios

1. **A nota apoia, não certifica.** Toda tela com nota diz "Não é certificação. A conclusão de conformidade é sua." (RF09, RNF07). O relatório credita a conclusão à pessoa auditora.
2. **A máquina sugere, a pessoa decide.** Conteúdo gerado pela IA fica em caixa tracejada (`AISuggestion`) com selo "Revise antes de usar" até alguém aprovar, editar ou descartar.
3. **Pessoa antes da regra.** A orientação explica o efeito em quem usa ("ouve só 'imagem'"), depois cita o requisito do eMAG.
4. **Plano e calmo.** Sem degradês, sem sombra (exceto a folha do relatório). A energia de cor fica para a marca.

## Público e voz

Interface para auditoras e auditores de acessibilidade (persona: Helena, analista, fictícia). O pitch fala de quem é afetado (Tiago, pessoa cega, fictício, a partir da entrevista Ctx1).

- Português do Brasil, simples, direto, em "você": "Qual página você quer avaliar?".
- Título de tela é pergunta ou afirmação curta; botão é verbo: "Avaliar página", "Baixar PDF".
- Erro diz o que aconteceu e o próximo passo (RF17): "Não conseguimos abrir essa página." + "Confira se o endereço começa com https://".
- Ajuda curta na própria tela (RF16), em `hint`.
- Pessoas com deficiência: "pessoa cega", "usa leitor de tela". Nunca "portador".
- Dados de exemplo são marcados como fictícios ("Prefeitura de Exemplo (fictícia)").
- Separador de metadados: `·`.

## Cor

Dois temas, os dois do protótipo: **Claro** e **Escuro** (`prefers-color-scheme`, com `data-theme` para forçar).

| Papel                     | Tokens                                                            | Uso                                                       |
| ------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| Base                      | `bg`, `surface`, `ink`, `muted`, `line`, `line-strong`            | Página, painéis, texto, divisórias                        |
| Ação                      | `accent`, `accent-ink`, `accent-soft`, `focus`                    | Botão principal, link, aba ativa, foco, aviso informativo |
| Prioridade alta / erro    | `alta`, `alta-bg`                                                 | Selo "Prioridade alta", erro de campo, Descartar          |
| Prioridade média / alerta | `media`, `media-bg`                                               | Selo "Prioridade média", aviso de pendência               |
| Aprovado / concluído      | `ok`, `ok-bg`                                                     | Selo "Aprovada", passo feito                              |
| Código / neutro           | `code-bg`                                                         | Trechos de HTML, selos neutros                            |
| Marca (pitch)             | `brand-navy`, `brand-mint`, `sun-yellow`, `sun-orange`, `sun-red` | Só anel, capa e apresentações; fora da interface          |

Regras:

- Todo par de texto do protótipo passa 4.5:1 nos dois temas (menor: `ok` sobre `ok-bg`, 5.7:1).
- Cor nunca é a única pista: prioridade e decisão sempre escritas no selo.
- Borda de campo usa `line-strong` (3.5:1 ou mais nos dois temas, WCAG 1.4.11). O protótipo usava `line` (1.4:1); ao portar telas do protótipo, troque. `line` fica só para divisórias.
- O app atual (`apps/web/src/index.css`) ainda usa outra paleta (`#1b4f9c`, foco `#b35c00`); ao construir as telas, troque pelos tokens daqui.

## Tipografia

Três famílias do Google Fonts, escolhidas por legibilidade:

- **Public Sans** (600–800) — títulos, nota, nome do app. Fonte do governo dos EUA, feita para serviço público.
- **Atkinson Hyperlegible** (400, 700) — todo o texto. Feita para pessoas com baixa visão: letras parecidas (I l 1, O 0) são bem diferentes.
- **IBM Plex Mono** (400, 500) — trechos de código e URLs.

Corpo 17px com entrelinha 1.55 (16px abaixo de 560px). `h1` fluido de 25.6 a 36.8px. Use `font-variant-numeric: tabular-nums` em notas e tabelas.

## Espaço, forma e tamanho

- Coluna central de até `content-max` (1120px); formulários curtos em `narrow-max` (560px).
- Telas empilham blocos com `space-24`; painéis têm padding `space-24`.
- Cantos: `radius-control` (8) em botões, campos e avisos; `radius-panel` (10) em painéis; `radius-pill` em selos.
- Alvo de toque mínimo `target-min` (44px); campos `input-min` (48px).
- Foco: anel de `focus-ring` (3px) em `focus`, afastado 3px, em todo elemento focável. Nunca remova.

## Interação

- Tudo funciona só com teclado, em ordem lógica.
- "Pular para o conteúdo" é o primeiro link; ao trocar de tela, o foco vai para o `h1`.
- Andamento anunciado com `aria-live="polite"`, sem roubar o foco (RNF06). Animação para com `prefers-reduced-motion`.
- Antes de entregar uma tela: e2e com axe, navegação só por teclado e teste com leitor de tela (Orca + Firefox; NVDA no Windows) — ver `docs/design.md`.

## Marca

- **Ícone do app** (`assets/Marca/acessaweb-icone.svg`): quadrado arredondado em `accent` com um visto branco. Ao lado do nome "AcessaWeb" em Public Sans 800, no cabeçalho e no favicon.
- **Anel** (`assets/Marca/acessaweb-anel.svg`): dois círculos de raios, amarelo em cima, laranja-avermelhado embaixo. Só sobre `brand-navy`, em capa, apresentação e materiais de divulgação. Não recolorir, girar ou usar dentro da interface do app.

## Iconografia

Só dois ícones, ambos em traço de 2px, 20px, dentro de avisos: `info` (círculo com i, em `accent`) e `alerta` (triângulo, em `media`). Sempre `aria-hidden="true"`, ao lado de texto que se explica sozinho. Ícone com função (botão só com ícone) precisa de nome acessível — é a falha que o AcessaWeb denuncia.

## Componentes

Classes de `components/bundle.css` (o CSS do protótipo, ligado aos tokens), sem JavaScript: Button, Field, Badge, Notice, Panel, AppHeader, Score, FailureItem, AISuggestion, ProgressSteps, Tabs, DataTable, ReportSheet, ReviewChecklist, Toast. Os nomes de classe estão em português, como no protótipo (`btn`, `campo`, `selo`, `painel`, `falha`).

## Neste repositório

Esta pasta é a fonte do sistema visual do app. Ela veio do sistema de design "AcessaWeb" montado no Claude a partir do protótipo e do pitch.

- `tokens.json` — os valores (cor nos temas Claro e Escuro, tipografia, espaço, raio, sombra, tamanho). Mude aqui primeiro.
- `tokens.css` — as variáveis CSS (`--accent`, `--space-24`…), gerado do `tokens.json` com `node scripts/gerar-tokens-css.mjs`. Não edite à mão.
- `components/bundle.css` — as classes da interface; usa as variáveis de `tokens.css`. `components/<Nome>/README.md` traz a regra de uso e `preview.html` um exemplo em HTML.
- `assets/` — ícone do app, anel da marca e os dois ícones de aviso, em SVG.

O app (`apps/web`) ainda não importa esta pasta: as telas novas passam a usar `tokens.css` e `components/bundle.css` quando forem construídas. As fontes vêm do Google Fonts (`@import` no `bundle.css`).
