import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { enviar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Botao } from '../componentes/Botao.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { useSessao } from '../sessao.tsx'

type Campos = Partial<Record<'url', string>>
type RespostaAvaliacao = { avaliacao: { id: string }; erro: string; campos: Campos }

// Tela 3 · Nova avaliação (RF02, RF17). Texto do protótipo beta (projeto/docs/prototipo/beta/).
export function NovaAvaliacao() {
  const { usuario, carregando, definirUsuario } = useSessao()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const formulario = useRef<HTMLFormElement>(null)
  const [erros, setErros] = useState<Campos>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)

  // depois de cada envio com erro, o foco vai para o primeiro campo errado
  useEffect(() => {
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [erros])

  if (!carregando && !usuario) return <Navigate to="/entrar" replace />

  async function avaliar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setEnviando(true)
    const dados = Object.fromEntries(new FormData(evento.currentTarget))
    const { status, corpo } = await enviar<RespostaAvaliacao>('/api/avaliacoes', dados)
    setEnviando(false)
    if (status === 401) {
      definirUsuario(null) // sessão expirou: a tela leva para /entrar
      return
    }
    if (status === 202 && corpo.avaliacao) {
      void navegar(`/avaliacoes/${corpo.avaliacao.id}`)
      return
    }
    setErros(corpo.campos ?? {})
    setErroGeral(corpo.campos ? '' : mensagemDeErro(status, corpo.erro))
  }

  return (
    <div className="tela estreito">
      <title>Nova avaliação · AcessaWeb</title>
      <div className="cabeca">
        <p className="sobre">Nova avaliação</p>
        <h1>Qual página você quer avaliar?</h1>
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
        onSubmit={(evento) => void avaliar(evento)}
      >
        <Campo
          rotulo="Endereço da página (URL)"
          name="url"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          defaultValue={parametros.get('url') ?? ''}
          dica="Ex.: https://www.suaempresa.com.br/contato"
          erro={erros.url}
        />
        <Aviso>
          <p>Uma página pública por vez. Páginas que pedem login ainda não são avaliadas.</p>
        </Aviso>
        <p className="acoes">
          <Botao type="submit">{enviando ? 'Enviando…' : 'Avaliar página'}</Botao>
        </p>
      </form>
    </div>
  )
}
