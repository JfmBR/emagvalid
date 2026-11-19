import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { enviar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Botao } from '../componentes/Botao.tsx'
import { CampoSenha } from '../componentes/CampoSenha.tsx'
import { useSessao } from '../sessao.tsx'

type Campos = Partial<Record<'senha', string>>
type RespostaExcluir = { erro: string; campos: Campos }

// Minha conta: os dados da conta e a exclusão (LGPD, art. 18, VI: eliminação dos dados pessoais).
// Pede a senha para que outra pessoa com a sessão aberta não apague a conta (decisão do João, 19/11/2026).
export function Conta() {
  const { usuario, carregando, definirUsuario } = useSessao()
  const formulario = useRef<HTMLFormElement>(null)
  const tituloExcluida = useRef<HTMLHeadingElement>(null)
  const [erros, setErros] = useState<Campos>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [excluida, setExcluida] = useState(false)

  // senha errada: o foco volta ao campo, que já diz o que fazer
  useEffect(() => {
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [erros])

  // a tela muda sem trocar de rota: o foco vai ao título novo, para o leitor de tela anunciar
  useEffect(() => {
    if (excluida) tituloExcluida.current?.focus()
  }, [excluida])

  if (excluida) {
    return (
      <div className="tela estreito">
        <title>Conta excluída · AcessaWeb</title>
        <h1 ref={tituloExcluida} tabIndex={-1}>
          Conta excluída
        </h1>
        <p>Sua conta e todas as suas avaliações foram apagadas do AcessaWeb.</p>
        <p className="acoes">
          <Link className="btn sec" to="/">
            Voltar ao início
          </Link>
        </p>
      </div>
    )
  }

  if (!carregando && !usuario) return <Navigate to="/entrar" replace />

  async function excluir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setEnviando(true)
    const dados = Object.fromEntries(new FormData(evento.currentTarget))
    const { status, corpo } = await enviar<RespostaExcluir>('/api/auth/excluir-conta', dados)
    setEnviando(false)
    if (status === 204) {
      setExcluida(true)
      definirUsuario(null)
      return
    }
    if (status === 401) {
      definirUsuario(null) // sessão expirou: a tela leva para /entrar
      return
    }
    setErros(corpo.campos ?? {})
    setErroGeral(corpo.campos ? '' : mensagemDeErro(status, corpo.erro))
  }

  return (
    <div className="tela estreito">
      <title>Minha conta · AcessaWeb</title>
      <h1>Minha conta</h1>
      {usuario ? (
        <section className="painel">
          <h2>Seus dados</h2>
          <dl className="dados">
            <dt>Nome</dt>
            <dd>{usuario.nome}</dd>
            <dt>E-mail</dt>
            <dd>{usuario.email}</dd>
          </dl>
        </section>
      ) : null}
      <div className="cabeca">
        <h2 id="titulo-excluir">Excluir minha conta</h2>
        <p>
          Apaga para sempre a sua conta e todas as suas avaliações, com as falhas encontradas. Não
          dá para desfazer.
        </p>
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
        aria-labelledby="titulo-excluir"
        onSubmit={(evento) => void excluir(evento)}
      >
        <CampoSenha
          rotulo="Digite sua senha para confirmar"
          name="senha"
          autoComplete="current-password"
          erro={erros.senha}
        />
        <p className="acoes">
          <Botao type="submit" variante="perigo">
            {enviando ? 'Excluindo…' : 'Excluir minha conta'}
          </Botao>
        </p>
      </form>
    </div>
  )
}
