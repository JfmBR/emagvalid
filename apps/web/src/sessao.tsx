import { createContext, use, useEffect, useState, type ReactNode } from 'react'

export type Usuario = { nome: string; email: string; planoPago: boolean }

type Sessao = {
  usuario: Usuario | null
  // enquanto pergunta à API quem entrou; evita mostrar "Entrar" e trocar logo depois
  carregando: boolean
  definirUsuario: (usuario: Usuario | null) => void
}

const ContextoSessao = createContext<Sessao | null>(null)

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let ativo = true
    fetch('/api/auth/eu')
      .then((resposta) => (resposta.ok ? resposta.json() : null))
      .then((corpo: { usuario?: Usuario } | null) => {
        if (ativo) setUsuario(corpo?.usuario ?? null)
      })
      .catch(() => {})
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  return (
    <ContextoSessao value={{ usuario, carregando, definirUsuario: setUsuario }}>
      {children}
    </ContextoSessao>
  )
}

export function useSessao() {
  const sessao = use(ContextoSessao)
  if (!sessao) throw new Error('useSessao precisa estar dentro do ProvedorSessao')
  return sessao
}
