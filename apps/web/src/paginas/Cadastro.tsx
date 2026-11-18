import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { enviar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Botao } from '../componentes/Botao.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { CampoSenha } from '../componentes/CampoSenha.tsx'
import { useSessao, type Usuario } from '../sessao.tsx'

type Campos = Partial<Record<'nome' | 'email' | 'senha', string>>
type RespostaCadastro = { usuario: Usuario; erro: string; campos: Campos }

// Tela 2 · Cadastro (RF01, RNF03: avisa antes o que será pedido)
export function Cadastro() {
  const { usuario, definirUsuario } = useSessao()
  const navegar = useNavigate()
  const formulario = useRef<HTMLFormElement>(null)
  const [erros, setErros] = useState<Campos>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // depois de cada envio com erro, o foco vai para o primeiro campo errado
  useEffect(() => {
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [erros])

  if (usuario) return <Navigate to="/" replace />

  async function criarConta(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setEnviando(true)
    const dados = Object.fromEntries(new FormData(evento.currentTarget))
    const { status, corpo } = await enviar<RespostaCadastro>('/api/auth/cadastro', dados)
    setEnviando(false)
    if (status === 201 && corpo.usuario) {
      definirUsuario(corpo.usuario)
      void navegar('/')
      return
    }
    setErros(corpo.campos ?? {})
    setErroGeral(corpo.campos ? '' : mensagemDeErro(status, corpo.erro))
  }

  return (
    <div className="tela estreito">
      <title>Criar conta · AcessaWeb</title>
      <div className="cabeca">
        <h1>Criar conta</h1>
        <p>Vamos pedir só 3 dados: nome, e-mail e senha.</p>
      </div>
      {erroGeral ? (
        <Aviso tipo="alerta" papel="alert">
          <p>{erroGeral}</p>
        </Aviso>
      ) : null}
      <form
        ref={formulario}
        className="painel"
        noValidate
        onSubmit={(evento) => void criarConta(evento)}
      >
        <Campo rotulo="Nome" name="nome" autoComplete="name" erro={erros.nome} />
        <Campo
          rotulo="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          spellCheck={false}
          erro={erros.email}
        />
        <CampoSenha
          rotulo="Senha"
          name="senha"
          autoComplete="new-password"
          dica="Mínimo de 8 caracteres, com letra maiúscula, minúscula, número e símbolo."
          erro={erros.senha}
        />
        <p className="acoes">
          <Botao type="submit">{enviando ? 'Criando conta…' : 'Criar conta'}</Botao>
          <Link className="btn txt" to="/entrar">
            Já tenho conta
          </Link>
        </p>
      </form>
      <p>
        <Link to="/privacidade">Veja que dados guardamos e o que vai para a IA</Link>
      </p>
    </div>
  )
}
