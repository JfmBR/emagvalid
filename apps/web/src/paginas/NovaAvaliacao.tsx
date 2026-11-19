import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { enviar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Botao } from '../componentes/Botao.tsx'
import { Campo } from '../componentes/Campo.tsx'
import { useSessao } from '../sessao.tsx'

// erros por campo: "urls.0", "urls.1"… (a posição do link na lista)
type Campos = Record<string, string>
type RespostaAvaliacao = { avaliacoes: { id: string }[]; erro: string; campos: Campos }

// Links por envio (RF20, decisão do João, 19/11/2026); a API confere o mesmo limite
const MAX_URLS = 10

// Tela 3 · Nova avaliação (RF02, RF17, RF20). Texto do protótipo beta (projeto/docs/prototipo/beta/).
export function NovaAvaliacao() {
  const { usuario, carregando, definirUsuario } = useSessao()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const formulario = useRef<HTMLFormElement>(null)
  const [erros, setErros] = useState<Campos>({})
  const [erroGeral, setErroGeral] = useState('')
  const [enviando, setEnviando] = useState(false)
  // cada campo tem uma chave fixa: remover o do meio não embaralha o que já foi digitado
  const [chaves, setChaves] = useState([0])
  const proximaChave = useRef(1)
  // campo que deve receber o foco depois de acrescentar ou remover
  const [focar, setFocar] = useState<string | null>(null)

  // depois de cada envio com erro, o foco vai para o primeiro campo errado
  useEffect(() => {
    formulario.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [erros])

  useEffect(() => {
    if (focar) document.getElementById(focar)?.focus()
  }, [focar])

  if (!carregando && !usuario) return <Navigate to="/entrar" replace />

  const varias = chaves.length > 1

  function acrescentar() {
    const chave = proximaChave.current
    proximaChave.current += 1
    setChaves((atuais) => [...atuais, chave])
    setErros({}) // os erros vêm pela posição; com a lista mudando, ficariam no campo errado
    setFocar(`url-${chave}`)
  }

  function remover(indice: number) {
    setFocar(`url-${chaves[indice - 1]}`)
    setChaves((atuais) => atuais.filter((_, i) => i !== indice))
    setErros({})
  }

  async function avaliar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (enviando) return
    setEnviando(true)
    const urls = new FormData(evento.currentTarget).getAll('urls')
    const { status, corpo } = await enviar<RespostaAvaliacao>('/api/avaliacoes', { urls })
    setEnviando(false)
    if (status === 401) {
      definirUsuario(null) // sessão expirou: a tela leva para /entrar
      return
    }
    if (status === 202 && corpo.avaliacoes?.length) {
      // um link: acompanha na Tela 4; vários: no histórico, com o andamento de cada um
      const [primeira] = corpo.avaliacoes
      void navegar(
        corpo.avaliacoes.length === 1 && primeira ? `/avaliacoes/${primeira.id}` : '/avaliacoes',
      )
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
        <h1>{varias ? 'Quais páginas você quer avaliar?' : 'Qual página você quer avaliar?'}</h1>
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
        {chaves.map((chave, indice) => (
          <div key={chave} style={{ display: 'grid', gap: 8 }}>
            <Campo
              id={`url-${chave}`}
              rotulo={
                indice === 0 ? 'Endereço da página (URL)' : `Endereço da página ${indice + 1} (URL)`
              }
              name="urls"
              inputMode="url"
              autoComplete={indice === 0 ? 'url' : 'off'}
              spellCheck={false}
              defaultValue={indice === 0 ? (parametros.get('url') ?? '') : ''}
              dica={indice === 0 ? 'Ex.: https://www.suaempresa.com.br/contato' : undefined}
              erro={erros[`urls.${indice}`]}
            />
            {indice > 0 ? (
              <p>
                <Botao variante="sec" onClick={() => remover(indice)}>
                  Remover <span className="so-leitor">a página {indice + 1}</span>
                </Botao>
              </p>
            ) : null}
          </div>
        ))}
        <p className="acoes" style={{ alignItems: 'center' }}>
          {chaves.length < MAX_URLS ? (
            <Botao variante="sec" onClick={acrescentar}>
              + Adicionar outra página
            </Botao>
          ) : null}
          <span className="dica">
            {chaves.length < MAX_URLS
              ? `${chaves.length} de ${MAX_URLS} páginas`
              : `Você chegou ao limite de ${MAX_URLS} páginas.`}
          </span>
        </p>
        <Aviso>
          <p>
            Até {MAX_URLS} páginas públicas por envio, analisadas uma por vez. Páginas que pedem
            login ainda não são avaliadas.
          </p>
        </Aviso>
        <p className="acoes">
          <Botao type="submit">
            {enviando ? 'Enviando…' : varias ? 'Avaliar páginas' : 'Avaliar página'}
          </Botao>
        </p>
      </form>
    </div>
  )
}
