# ProgressSteps

Andamento da análise em três passos, anunciado sem roubar o foco (RNF06).

- `ol.passos[aria-live="polite"]` > `li` com `span.marca-p` (círculo de 28px, `aria-hidden`) + texto.
- Estados por `data-st`: sem atributo (a fazer, `muted`), `agora` (negrito, círculo girando em `accent`), `feito` (círculo cheio `ok`).
- O giro para com `prefers-reduced-motion: reduce`.
- Sempre um botão "Cancelar" (`btn sec`) abaixo.
