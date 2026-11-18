import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { buscar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Selo } from '../componentes/Selo.tsx'
import { useSessao } from '../sessao.tsx'

type Avaliacao = {
  id: string
  url: string
  urlFinal: string | null
  status: 'NA_FILA' | 'ANALISANDO' | 'CONCLUIDA' | 'ERRO'
  etapa: 1 | 2 | 3 | null
  posicaoNaFila: number | null
  paginaGrande: boolean
  mensagemErro: string | null
  falhas: { requisitoEmag: string }[]
}
type RespostaAvaliacao = { avaliacao: Avaliacao; erro: string }

const INTERVALO_MS = 2_000
const passos = [
  'Carregando a página',
  'Verificando as recomendações do eMAG 3.1',
  'Preparando o resultado',
]

function plural(n: number, singular: string, mais: string) {
  return `${n} ${n === 1 ? singular : mais}`
}

// Tela 4 · Análise em andamento, erro e concluída (RF02, RF17, RNF06). Texto do protótipo beta.
export function Analise() {
  const { id = '' } = useParams()
  const { usuario, carregando, definirUsuario } = useSessao()
  const titulo = useRef<HTMLHeadingElement>(null)
  const [avaliacao, setAvaliacao] = useState<Avaliacao | null>(null)
  const [naoEncontrada, setNaoEncontrada] = useState(false)
  // mensagem de falha ao perguntar (rede, servidor); some quando uma pergunta dá certo
  const [aviso, setAviso] = useState('')

  // Pergunta à API a cada 2 s, uma de cada vez, até a análise terminar. O efeito é cancelado
  // ao sair da tela e pelo StrictMode (`ativo` descarta a resposta atrasada).
  useEffect(() => {
    if (!usuario) return
    let ativo = true
    async function acompanhar() {
      while (ativo) {
        const { status, corpo } = await buscar<RespostaAvaliacao>(
          `/api/avaliacoes/${encodeURIComponent(id)}`,
        )
        if (!ativo) return
        if (status === 401) return definirUsuario(null) // sessão expirou: a tela leva para /entrar
        if (status === 404) return setNaoEncontrada(true)
        if (status === 200 && corpo.avaliacao) {
          setAvaliacao(corpo.avaliacao)
          setAviso('')
          if (corpo.avaliacao.status === 'CONCLUIDA' || corpo.avaliacao.status === 'ERRO') return
        } else {
          setAviso(mensagemDeErro(status, corpo.erro))
        }
        await new Promise((retomar) => setTimeout(retomar, INTERVALO_MS))
      }
    }
    void acompanhar()
    return () => {
      ativo = false
    }
  }, [id, usuario, definirUsuario])

  const status = avaliacao?.status
  const terminou = naoEncontrada || status === 'CONCLUIDA' || status === 'ERRO'
  // o resultado chegou: o foco vai para o novo h1, para o leitor de tela anunciar
  useEffect(() => {
    if (terminou) titulo.current?.focus()
  }, [terminou])

  if (!carregando && !usuario) return <Navigate to="/entrar" replace />

  const falhas = avaliacao?.falhas ?? []
  const requisitos = new Set(falhas.map((falha) => falha.requisitoEmag)).size
  const etapa = avaliacao?.etapa ?? 0
  const fila = status === 'NA_FILA' ? (avaliacao?.posicaoNaFila ?? null) : null

  const erro = naoEncontrada || status === 'ERRO'
  const textoTitulo = naoEncontrada
    ? 'Avaliação não encontrada.'
    : status === 'ERRO'
      ? 'Não conseguimos avaliar essa página.'
      : status === 'CONCLUIDA'
        ? 'Análise concluída'
        : 'Avaliando a página'

  return (
    <div className="tela estreito">
      <title>{`${terminou ? textoTitulo : 'Analisando'} · AcessaWeb`}</title>
      <div className="cabeca">
        {erro ? (
          <p>
            <Selo variante="alta">Erro</Selo>
          </p>
        ) : status === 'CONCLUIDA' ? null : (
          <p className="sobre">Analisando</p>
        )}
        <h1 ref={titulo} tabIndex={-1}>
          {textoTitulo}
        </h1>
        {avaliacao && !erro ? <p className="meta">{avaliacao.url}</p> : null}
      </div>

      {aviso ? (
        <Aviso tipo="alerta" papel="status">
          <p>{aviso}</p>
        </Aviso>
      ) : null}

      {naoEncontrada ? (
        <p className="acoes">
          <Link className="btn" to="/avaliacoes/nova">
            Nova avaliação
          </Link>
        </p>
      ) : status === 'ERRO' ? (
        <div className="painel">
          <p>{avaliacao?.mensagemErro ?? mensagemDeErro(500)}</p>
          <p className="meta">Endereço digitado: {avaliacao?.url}</p>
          <p className="acoes">
            <Link
              className="btn"
              to={`/avaliacoes/nova?url=${encodeURIComponent(avaliacao?.url ?? '')}`}
            >
              Corrigir o endereço
            </Link>
          </p>
        </div>
      ) : status === 'CONCLUIDA' ? (
        <div className="painel">
          <p>
            {falhas.length === 0
              ? 'Não encontramos falhas automáticas. Ainda assim, faça a revisão humana.'
              : `Encontramos ${plural(falhas.length, 'falha', 'falhas')} em ${plural(requisitos, 'recomendação', 'recomendações')} do eMAG 3.1.`}
          </p>
          {avaliacao?.urlFinal && avaliacao.urlFinal !== avaliacao.url ? (
            <p className="meta">Avaliamos {avaliacao.urlFinal}</p>
          ) : null}
          <p className="acoes">
            <Link className="btn" to="/avaliacoes/nova">
              Nova avaliação
            </Link>
          </p>
        </div>
      ) : (
        <div className="painel">
          {fila !== null ? (
            <output>
              {fila === 0
                ? 'Na fila: a sua é a próxima.'
                : `Na fila: ${plural(fila, 'análise', 'análises')} antes da sua.`}
            </output>
          ) : null}
          <ol className="passos" aria-live="polite">
            {passos.map((texto, indice) => {
              const n = indice + 1
              const situacao = etapa > n ? 'feito' : etapa === n ? 'agora' : undefined
              return (
                <li
                  key={texto}
                  data-st={situacao}
                  aria-current={situacao === 'agora' ? 'step' : undefined}
                >
                  <span className="marca-p" aria-hidden="true">
                    {situacao === 'feito' ? '✓' : n}
                  </span>
                  <span>
                    {texto}
                    {situacao ? (
                      <span className="so-leitor">
                        {situacao === 'feito' ? ', concluído' : ', em andamento'}
                      </span>
                    ) : null}
                  </span>
                </li>
              )
            })}
          </ol>
          {avaliacao?.paginaGrande ? (
            <Aviso papel="status">
              <p>Por ser uma página grande, a análise pode demorar mais de 1 minuto.</p>
            </Aviso>
          ) : null}
        </div>
      )}
    </div>
  )
}
