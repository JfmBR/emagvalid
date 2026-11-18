# AppHeader

Cabeçalho do app com marca e navegação principal.

- Acima dele, no app, vem a barra de acessibilidade do eMAG (`apps/web/src/componentes/BarraAcessibilidade.tsx`), cujo primeiro link, "Ir para o conteúdo [1]", faz o papel do antigo `a.pular`. A classe `a.pular` e esta prévia ficaram do protótipo; o app não usa mais.
- O `nav` principal tem `id="menu"` (destino do atalho 2).
- `header.topo` > `div.wrap` > `a.marca` (ícone de 28px + "AcessaWeb" em `brand`) + `nav[aria-label="Principal"]` com `btn txt`.
- Fora da conta: só "Entrar". Dentro: Nova avaliação, Histórico, saudação em `muted`, Sair.
- `wrap` centraliza em `content-max` (1120px) com margem mínima `space-16`.
