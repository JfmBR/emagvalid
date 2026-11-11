# DataTable

Tabela de dados (conta da nota, falhas do relatório, histórico) dentro de área com rolagem horizontal.

- `div.rolar` > `table` com `thead` (`th[scope=col]` em `th`, `muted`), `tbody` e `tfoot` em negrito; algarismos tabulares; colunas numéricas com `.n` (à direita).
- A primeira célula da linha é `th[scope=row]`.
- `span.barra-sec` é uma barra de proporção decorativa (`aria-hidden`); o número em texto vem ao lado.
- Para esconder detalhes, use `details.conta` > `summary` (alvo de 44px).
- Linha recém-criada no histórico: `tr.novo` (fundo `accent-soft`).
