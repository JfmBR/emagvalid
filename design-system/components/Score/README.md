# Score

A nota da avaliação, de 0 a 100, com o aviso de que não é certificação.

- `div.nota` > `p.nota-num` (`score`, 64px 800, algarismos tabulares, `/100` em `small`) + coluna com selo `auto`, aviso em negrito e `p.meta` com a conta resumida.
- `aria-label="Nota 74 de 100"` no número, para o leitor de tela não ler "74 barra 100".
- Logo abaixo, `details.conta` "Como chegamos a 74" com a tabela da conta (ver DataTable).
- A nota nunca aparece sem a frase "Não é certificação".
