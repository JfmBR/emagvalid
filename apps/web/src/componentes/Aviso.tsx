import type { ReactNode } from 'react'

type Props = {
  tipo?: 'info' | 'alerta'
  // 'note' para informação fixa; 'status' quando o aviso aparece por causa de uma ação
  papel?: 'note' | 'status'
  children: ReactNode
}

// Ícones de design-system/assets/Icones, escondidos do leitor de tela: o texto basta sozinho
const iconeInfo = (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <circle cx="10" cy="10" r="9" fill="none" stroke="var(--accent)" strokeWidth="2" />
    <path d="M10 9v5M10 6v.5" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const iconeAlerta = (
  <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
    <path
      d="M10 2l9 16H1z"
      fill="none"
      stroke="var(--media)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M10 8v4M10 14.5v.5" stroke="var(--media)" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

export function Aviso({ tipo = 'info', papel = 'note', children }: Props) {
  return (
    <div className={tipo === 'alerta' ? 'aviso alerta' : 'aviso'} role={papel}>
      {tipo === 'alerta' ? iconeAlerta : iconeInfo}
      <div>{children}</div>
    </div>
  )
}
