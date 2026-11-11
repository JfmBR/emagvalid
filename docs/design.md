# Design e acessibilidade

O AcessaWeb é uma ferramenta de acessibilidade: a própria interface precisa ser exemplar.

## Direção

- Referência de fluxo e de textos: o protótipo beta, `projeto/docs/prototipo/beta/` (abra o `index.html`; `dashboard.png` mostra as telas principais). É um guia do caminho, não especificação: o visual segue `design-system/` (paleta, fontes e componentes do beta não entram), e o que o beta mostra fora do MVP não se implementa (`PRODUCT.md`, "Fora do escopo"). Telas do MVP que o beta não tem (login, histórico, revisão das orientações da IA) seguem o protótipo anterior, `projeto/docs/prototipo/prototipo_emagvalid.html` e `projeto/docs/rascunhos/Prototipo_30-10_telas_e_teste.md`. O arquivo do Figma está no Índice de links do Drive do grupo.
- Linguagem simples, em pt-BR, com ajuda curta na própria tela (RF16) e mensagens de erro com o próximo passo (RF17).
- A nota e as orientações da IA aparecem sempre como apoio à avaliação humana, nunca como certificação (RF09, RNF07).

## Sistema de design

- Fonte única do visual: `design-system/` (tokens, componentes, marca e ícones). Comece pelo `design-system/README.md`.
- Valores em `design-system/tokens.json`; depois de mudar, rode `node scripts/gerar-tokens-css.mjs` para atualizar o `tokens.css`.
- Ao construir uma tela, use `design-system/tokens.css` e as classes de `design-system/components/bundle.css`. Não crie cor, fonte ou espaçamento fora dos tokens.
- A tela provisória (`apps/web/src/index.css`) ainda usa a paleta antiga; troque pelos tokens ao portar as telas do protótipo.
- A tela provisória já traz o link "Pular para o conteúdo", `main` com foco programático e um `<output>` que o leitor de tela anuncia quando o estado da API muda.

## Interação

Critérios do eMAG 3.1/WCAG 2.1 AA (RNF01, RNF02):

- Tudo funciona só com teclado, em ordem lógica, com foco sempre visível.
- Todo campo tem rótulo visível; todo erro é anunciado e diz como corrigir.
- Contraste mínimo de 4,5:1 no texto (3:1 em texto grande e componentes).
- Alvos de clique de 44 × 44 px ou mais, com espaço entre eles.
- Imagens com texto alternativo; ícones decorativos escondidos do leitor de tela.
- Andamento da análise anunciado sem roubar o foco (RNF06).
- Sem depender só de cor para passar informação (prioridade das falhas, nota).

## Layout e revisão

- Antes de entregar uma tela: rode o e2e com axe (`docs/quality.md`), use a skill `web-design-guidelines` e navegue só com teclado.
- Teste com leitor de tela: Orca + Firefox no Linux; NVDA no Windows, que é o da persona. Faça ao menos uma rodada com o NVDA antes de 04/12.
- O agente pode abrir a tela com `agent-browser` e ler a árvore de acessibilidade; isso não substitui o teste com leitor de tela de verdade.

## Manutenção

Atualize quando mudar o protótipo, um componente compartilhado ou um critério. Mudança de tela que contrarie o protótipo deve ser avisada ao João.
