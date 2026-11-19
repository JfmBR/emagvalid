import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { buscar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Selo } from '../componentes/Selo.tsx'
import { useSessao } from '../sessao.tsx'
import { Ponto } from '../componentes/Ponto.tsx'
import { Resultado, type ResultadoAvaliacao } from './Resultado.tsx'

type Avaliacao = {
  id: string
  url: string
  urlFinal: string | null
  status: 'NA_FILA' | 'ANALISANDO' | 'CONCLUIDA' | 'ERRO'
  etapa: 1 | 2 | 3 | null
  posicaoNaFila: number | null
  paginaGrande: boolean
  mensagemErro: string | null
  concluidaEm: string | null
  resultado: ResultadoAvaliacao | null
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

// só a primeira letra: "eMAG" continua "eMAG"
const minusculaInicial = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1)

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

// Tela 4 · Análise em andamento e erro (RF02, RF17, RNF06), texto do protótipo beta. Concluída, vira a Tela 5.
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

  const etapa = avaliacao?.etapa ?? 0
  const fila = status === 'NA_FILA' ? (avaliacao?.posicaoNaFila ?? null) : null
  const nota = avaliacao?.resultado?.nota ?? null

  const erro = naoEncontrada || status === 'ERRO'
  const textoTitulo = naoEncontrada
    ? 'Avaliação não encontrada.'
    : status === 'ERRO'
      ? 'Não conseguimos avaliar essa página.'
      : status === 'CONCLUIDA'
        ? 'Resultado da avaliação'
        : 'Avaliando a página'

  return (
    <div className={status === 'CONCLUIDA' ? 'tela' : 'tela estreito'}>
      <title>{`${terminou ? textoTitulo : 'Analisando'} · AcessaWeb`}</title>
      <div className="cabeca">
        {erro ? (
          <p>
            <Selo variante="alta">Erro</Selo>
          </p>
        ) : (
          <p className="sobre">{status === 'CONCLUIDA' ? 'Resultado' : 'Analisando'}</p>
        )}
        {/* ao concluir, o foco vem para cá: o leitor de tela ouve a nota junto com o título */}
        <h1 ref={titulo} tabIndex={-1}>
          {textoTitulo}
          {status === 'CONCLUIDA' && nota !== null ? (
            <span className="so-leitor">: nota {nota} de 100</span>
          ) : null}
        </h1>
        {avaliacao && !erro ? (
          <p className="meta">
            {avaliacao.url}
            {avaliacao.concluidaEm ? (
              <>
                <Ponto />
                {dataHora(avaliacao.concluidaEm)}
              </>
            ) : null}
          </p>
        ) : null}
        {avaliacao?.urlFinal && avaliacao.urlFinal !== avaliacao.url && status === 'CONCLUIDA' ? (
          <p className="meta">Avaliamos {avaliacao.urlFinal}</p>
        ) : null}
      </div>

      {aviso ? (
        <Aviso tipo="alerta" papel="alert">
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
      ) : status === 'CONCLUIDA' && avaliacao?.resultado ? (
        <>
          <Resultado id={avaliacao.id} resultado={avaliacao.resultado} />
          <p className="acoes">
            <Link className="btn" to="/avaliacoes/nova">
              Nova avaliação
            </Link>
          </p>
        </>
      ) : (
        <div className="painel">
          {fila !== null ? (
            <output>
              {fila === 0
                ? 'Na fila: a sua é a próxima.'
                : `Na fila: ${plural(fila, 'análise', 'análises')} antes da sua.`}
            </output>
          ) : null}
          {/* Só a frase do passo atual é anunciada (a lista inteira relida a cada passo atropelava a fala).
              Ao concluir, este painel sai junto e o único anúncio é o foco no título. */}
          <output className="so-leitor">
            {etapa > 0
              ? `Passo ${etapa} de ${passos.length}: ${minusculaInicial(passos[etapa - 1] ?? '')}.`
              : ''}
          </output>
          <ol className="passos">
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
