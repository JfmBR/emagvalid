import type { ReactNode } from 'react'

type Props = {
  variante:
    'alta' | 'media' | 'auto' | 'humana' | 'aprovada' | 'editada' | 'descartada' | 'pendente'
  // o texto carrega o significado ("Prioridade alta"); a cor nunca é a única pista
  children: ReactNode
}

export function Selo({ variante, children }: Props) {
  return <span className={`selo ${variante}`}>{children}</span>
}
