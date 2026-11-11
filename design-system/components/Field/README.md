# Field

Campo de formulário com rótulo visível, dica e erro que diz como corrigir.

- `div.campo` > `label[for]` + `input` (ou `textarea`, em mono) + `p.dica` e/ou `p.erro-campo`, ligados por `aria-describedby`.
- Erro: `data-erro` no `.campo` deixa a borda `alta`; marque também `aria-invalid="true"`. O texto do erro dá o próximo passo (RF17): "Digite um e-mail válido, como nome@empresa.com.br."
- Altura mínima `input-min` (48px), borda de 2px, raio `radius-control`; no foco a borda vira `focus`.
- Use `autocomplete` e `inputmode` certos (`email`, `new-password`, `url`).
- Borda em repouso `line-strong` (3:1 ou mais nos dois temas). O protótipo usava `line` (1.4:1); esta é a correção.
