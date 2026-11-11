# Toast

Confirmação curta e passageira de uma ação concluída.

- `div.toast[role=status][aria-live=polite]`, fixo embaixo e centralizado (a prévia mostra ele parado); cores invertidas (`ink` de fundo, `bg` de texto).
- Só para confirmar ("Edição salva. Revisadas: 3 de 5.", "PDF gerado."). Some sozinho em 4.2 s. Erro e aviso que exigem ação vão em Notice ou no campo, nunca em toast.
- Não leva o foco nem botão.
