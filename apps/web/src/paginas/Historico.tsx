import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { buscar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { BaixarPdf } from '../componentes/BaixarPdf.tsx'
import { Botao } from '../componentes/Botao.tsx'
import { useSessao } from '../sessao.tsx'

type Status = 'NA_FILA' | 'ANALISANDO' | 'CONCLUIDA' | 'ERRO'
type Item = {
  id: string
  url: string
  status: Status
  criadaEm: string
  nota: number | null
  etapa: 1 | 2 | 3 | null
  posicaoNaFila: number | null
}
type Resposta = { avaliacoes: Item[]; proximo: string | null; erro: string }

const INTERVALO_MS = 2_000
const pendente = (item: Item) => item.status === 'NA_FILA' || item.status === 'ANALISANDO'
const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

function situacao(item: Item) {
  if (item.status === 'CONCLUIDA') return 'Concluída'
  if (item.status === 'ERRO') return 'Não avaliada'
  if (item.status === 'ANALISANDO') return `Analisando (passo ${item.etapa ?? 1} de 3)`
  if (item.posicaoNaFila === null) return 'Na fila'
  return item.posicaoNaFila === 0
    ? 'Na fila: a sua é a próxima'
    : `Na fila: ${item.posicaoNaFila} antes da sua`
}

// A primeira página que chega de novo troca as linhas pelo id; as carregadas por "Mostrar mais" ficam
function mesclar(atuais: Item[] | null, novas: Item[]) {
  if (!atuais) return novas
  const ids = new Set(novas.map((item) => item.id))
  return [...novas, ...atuais.filter((item) => !ids.has(item.id))]
}

// Tela 8 · Histórico de avaliações (RF14, RF20). Layout do protótipo de 28/10 (Tela 8).
export function Historico() {
  const { usuario, carregando, definirUsuario } = useSessao()
  const [itens, setItens] = useState<Item[] | null>(null)
  const [proximo, setProximo] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const [carregandoMais, setCarregandoMais] = useState(false)
  // houve pendente nesta visita: quando todas terminam, o leitor de tela ouve um aviso
  const [acompanhou, setAcompanhou] = useState(false)
  // linha que recebe o foco depois de "Mostrar mais"
  const [focar, setFocar] = useState<string | null>(null)

  // Carrega a primeira página e, enquanto houver pendente, pergunta de novo a cada 2 s, uma de cada
  // vez. As pendentes estão sempre entre as 20 mais novas (10 por hora por conta).
  useEffect(() => {
    if (!usuario) return
    let ativo = true
    async function acompanhar() {
      // o cursor do "Mostrar mais" vem só da primeira resposta; as seguintes só atualizam as linhas
      let primeira = true
      while (ativo) {
        const { status, corpo } = await buscar<Resposta>('/api/avaliacoes')
        if (!ativo) return
        if (status === 401) return definirUsuario(null) // sessão expirou: a tela leva para /entrar
        if (status === 200 && corpo.avaliacoes) {
          const novas = corpo.avaliacoes
          setAviso('')
          setItens((atuais) => mesclar(atuais, novas))
          if (primeira) setProximo(corpo.proximo ?? null)
          primeira = false
          if (!novas.some(pendente)) return
          setAcompanhou(true)
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
  }, [usuario, definirUsuario])

  useEffect(() => {
    if (focar) document.getElementById(`linha-${focar}`)?.focus()
  }, [focar])

  if (!carregando && !usuario) return <Navigate to="/entrar" replace />

  async function mostrarMais() {
    if (!proximo || carregandoMais) return
    setCarregandoMais(true)
    const { status, corpo } = await buscar<Resposta>(
      `/api/avaliacoes?antes=${encodeURIComponent(proximo)}`,
    )
    setCarregandoMais(false)
    if (status === 401) return definirUsuario(null)
    if (status !== 200 || !corpo.avaliacoes) return setAviso(mensagemDeErro(status, corpo.erro))
    const novas = corpo.avaliacoes
    // a primeira página pode ter mudado enquanto isso (pergunta a cada 2 s): sem repetir linha
    setItens((atuais) => {
      const ids = new Set((atuais ?? []).map((item) => item.id))
      return [...(atuais ?? []), ...novas.filter((item) => !ids.has(item.id))]
    })
    setProximo(corpo.proximo ?? null)
    setFocar(novas[0]?.id ?? null)
  }

  const emAndamento = itens?.filter(pendente).length ?? 0
  // só muda quando o número muda: o leitor de tela não ouve cada célula da tabela
  const resumo =
    emAndamento > 0
      ? `${emAndamento} ${emAndamento === 1 ? 'análise em andamento' : 'análises em andamento'}.`
      : acompanhou
        ? 'Todas as análises terminaram.'
        : ''

  return (
    <div className="tela">
      <title>Histórico de avaliações · AcessaWeb</title>
      <div
        className="cabeca"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h1>Histórico de avaliações</h1>
        <Link className="btn" to="/avaliacoes/nova">
          Nova avaliação
        </Link>
      </div>
      <output className="so-leitor">{resumo}</output>
      {aviso ? (
        <Aviso tipo="alerta" papel="alert">
          <p>{aviso}</p>
        </Aviso>
      ) : null}
      {itens === null ? null : itens.length === 0 ? (
        <div className="painel">
          <p>Você ainda não avaliou nenhuma página.</p>
        </div>
      ) : (
        <div className="painel">
          {/* área com rolagem precisa receber foco (axe scrollable-region-focusable) */}
          {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <section className="rolar" tabIndex={0} aria-label="Avaliações">
            <table>
              <thead>
                <tr>
                  <th scope="col">Data</th>
                  <th scope="col">Página</th>
                  <th scope="col" className="n">
                    Nota
                  </th>
                  <th scope="col">Situação</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td>{dataHora(item.criadaEm)}</td>
                    <th
                      scope="row"
                      style={{ fontWeight: 400, color: 'var(--ink)', overflowWrap: 'anywhere' }}
                    >
                      {item.url}
                    </th>
                    <td className="n">
                      {item.nota === null ? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="so-leitor">sem nota</span>
                        </>
                      ) : (
                        item.nota
                      )}
                    </td>
                    <td>{situacao(item)}</td>
                    <td>
                      {/* div, e não span: o erro do "Baixar PDF" é um bloco (Aviso) */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                        {/* depois de "Mostrar mais", o foco vem para este link da primeira linha nova */}
                        <Link id={`linha-${item.id}`} to={`/avaliacoes/${item.id}`}>
                          {item.status === 'CONCLUIDA'
                            ? 'Ver resultado'
                            : item.status === 'ERRO'
                              ? 'Ver o motivo'
                              : 'Acompanhar'}{' '}
                          {/* o espaço fica fora do span: dentro dele, o nome acessível o perde */}
                          <span className="so-leitor">de {item.url}</span>
                        </Link>
                        <Link to={`/avaliacoes/nova?url=${encodeURIComponent(item.url)}`}>
                          Avaliar de novo <span className="so-leitor">{item.url}</span>
                        </Link>
                        {item.status === 'CONCLUIDA' ? (
                          <BaixarPdf id={item.id} pagina={item.url} variante="txt" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          {proximo ? (
            <p className="acoes">
              <Botao variante="sec" onClick={() => void mostrarMais()}>
                {carregandoMais ? 'Carregando…' : 'Mostrar mais'}
              </Botao>
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
