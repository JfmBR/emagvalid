# AISuggestion

Caixa com a orientação gerada pela IA, que a pessoa auditora aprova, edita ou descarta.

- `div.ia`: contorno tracejado de 2px em `accent` (diferente de painel: avisa que é conteúdo de máquina), raio `radius-panel`, padding `space-20`.
- Ordem: título + selo `pendente` "Revise antes de usar" (troca por `aprovada`/`editada`/`descartada`) → "Por que é falha" (efeito na pessoa) → "Exemplo de correção" em `pre.codigo` → ações Aprovar / Editar / Descartar.
- Editar abre um `campo` com `textarea` em mono.
- A IA só cita requisitos da lista fechada do eMAG (RF07, RF08). Nada vai para o PDF sem decisão humana; sem decisão, sai como "pendente".
