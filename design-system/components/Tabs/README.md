# Tabs

Abas para alternar entre falhas automáticas e itens de revisão humana.

- Padrão ARIA: `div[role=tablist][aria-label]` > `button[role=tab][aria-selected][aria-controls]` + `div[role=tabpanel][aria-labelledby]`.
- Aba ativa: texto `ink` e sublinhado de 3px em `accent`; inativas em `muted` com `tabindex="-1"` (setas trocam de aba).
- O rótulo traz a contagem: "Falhas automáticas (10)".
- O estilo vem dos atributos `role`, sem classe.
