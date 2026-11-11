# Button

Botão de ação com quatro variantes: principal, secundário, texto e perigo.

- Classes: `btn` (principal: fundo `accent`, texto `accent-ink`), `btn sec` (contorno), `btn txt` (só texto, para navegação e ações leves), `btn perigo` (contorno `alta`, para Descartar).
- Altura mínima `target-min` (44px), raio `radius-control`, borda de 2px, texto `label` (700).
- Um só `btn` principal por grupo; ele vem primeiro em `.acoes` (linha com vão de 10px que quebra).
- O rótulo diz a ação com verbo: "Avaliar página", "Baixar PDF", "Corrigir o endereço". Setas de texto (← →) só em navegação.
- Botão que repete o mesmo texto em vários itens (ex.: "Ver orientação") leva `aria-label` com o item: "Ver orientação do requisito 3.6".
- `disabled` só baixa a opacidade para 0.5; prefira deixar habilitado e explicar o erro.
