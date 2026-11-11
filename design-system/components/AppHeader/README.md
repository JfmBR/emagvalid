# AppHeader

Cabeçalho do app com marca, navegação principal e o link "Pular para o conteúdo".

- `a.pular` é o primeiro elemento da página; fica fora da tela e aparece no foco (a prévia mostra ele visível).
- `header.topo` > `div.wrap` > `a.marca` (ícone de 28px + "AcessaWeb" em `brand`) + `nav[aria-label="Principal"]` com `btn txt`.
- Fora da conta: só "Entrar". Dentro: Nova avaliação, Histórico, saudação em `muted`, Sair.
- `wrap` centraliza em `content-max` (1120px) com margem mínima `space-16`.
