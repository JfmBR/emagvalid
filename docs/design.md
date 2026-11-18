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
- O app importa `tokens.css` e `bundle.css` em `apps/web/src/main.tsx`; o `index.css` guarda só o que o `design-system/` não cobre. Componentes React em `apps/web/src/componentes/` (`Botao`, `Campo`, `Selo`, `Aviso`, `Layout`).
- O `Layout` traz a barra de acessibilidade, o cabeçalho com a marca, o `main` e o rodapé. Ao trocar de tela, o foco vai para o `h1`; cada tela define o seu `<title>`.
- Barra de acessibilidade (`componentes/BarraAcessibilidade.tsx`, eMAG 3.1 seção 4.3), no topo de toda tela:
  - atalhos "Ir para o conteúdo [1]", "Ir para o menu [2]" e "Ir para o rodapé [4]" (`accesskey` 1, 2 e 4, para `#conteudo`, `#menu` e `#rodape`). O primeiro é o primeiro link da página e faz o papel do antigo "Pular para o conteúdo". Sem busca no site, não há atalho 3;
  - botões "Alto contraste" (eMAG 4.2) e "Modo escuro", com `aria-pressed`. A escolha fica no `localStorage` (`apps/web/src/tema.ts`) e vira o `data-theme` do `<html>` por um script clássico no `<head>` (`apps/web/public/tema-inicial.js`, que repete a regra do `tema.ts`), antes do CSS e do app, para a página não piscar no tema errado. O contraste vence o modo escuro, e clicar em "Modo escuro" desliga o contraste; sem escolha, a página segue o tema do sistema;
  - link "Acessibilidade", para a página `/acessibilidade` (eMAG 4.5): atalhos por navegador, temas, zoom e como testamos.
- Sem botões A+/A-: o eMAG 3.1 (seção 1.3) os tirou porque os navegadores já têm zoom. No lugar, toda tela continua legível e funcionando com 200% de zoom (recomendação 4.3), conferido no e2e com a janela em 640 px.

## Interação

Critérios do eMAG 3.1/WCAG 2.1 AA (RNF01, RNF02):

- Tudo funciona só com teclado, em ordem lógica, com foco sempre visível.
- Botões e links respondem ao mouse e ao clique (`bundle.css`); a resposta nunca é o único sinal de que algo é clicável.
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
