import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { enviar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Botao } from '../componentes/Botao.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { CampoSenha } from '../componentes/CampoSenha.tsx'
import { useSessao, type Usuario } from '../sessao.tsx'

type RespostaEntrar = { usuario: Usuario; erro: string }

// Tela 2 · Login (RF01)
export function Entrar() {
  const { usuario, definirUsuario } = useSessao()
  const navegar = useNavigate()
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setEnviando(true)
    const dados = Object.fromEntries(new FormData(evento.currentTarget))
    const { status, corpo } = await enviar<RespostaEntrar>('/api/auth/entrar', dados)
    setEnviando(false)
    if (status === 200 && corpo.usuario) {
      definirUsuario(corpo.usuario)
      void navegar('/')
      return
    }
    setErro(mensagemDeErro(status, corpo.erro))
  }

  return (
    <div className="tela estreito">
      <title>Entrar · AcessaWeb</title>
      <h1>Entrar</h1>
      {erro ? (
        <Aviso tipo="alerta" papel="alert">
          <p>{erro}</p>
        </Aviso>
      ) : null}
      <form className="painel" noValidate onSubmit={(evento) => void entrar(evento)}>
        <Campo rotulo="E-mail" name="email" type="email" autoComplete="email" spellCheck={false} />
        <CampoSenha rotulo="Senha" name="senha" autoComplete="current-password" />
        <p className="acoes">
          <Botao type="submit">{enviando ? 'Entrando…' : 'Entrar'}</Botao>
          <Link className="btn txt" to="/cadastro">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  )
}
