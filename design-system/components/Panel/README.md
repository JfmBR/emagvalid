# Panel

Bloco branco que agrupa o conteúdo de uma tela, abaixo do cabeçalho da tela.

- Tela: `section.tela` (vão `space-24`) > `div.cabeca` (`p.sobre` + `h1 tabindex="-1"`) + um ou mais `div.painel`.
- `painel`: `surface`, contorno 1px `line`, raio `radius-panel`, padding `space-24` (18px no celular).
- `.estreito` limita a `narrow-max` (560px) para formulários curtos; `.duas` põe painéis lado a lado e quebra abaixo de 300px.
- Ao trocar de tela, o foco vai para o `h1`.
