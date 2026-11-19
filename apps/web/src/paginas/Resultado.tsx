import { useRef, useState, type KeyboardEvent } from 'react'
import { enviar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Selo } from '../componentes/Selo.tsx'
import { useSessao } from '../sessao.tsx'

type Prioridade = 'alta' | 'media' | 'baixa'

export type ResultadoAvaliacao = {
  nota: number | null
  verificacoes: {
    numero: string
    nome: string
    prioridade: Prioridade
    peso: number
    aprovada: boolean
  }[]
  cartoes: {
    numero: string
    nome: string
    link: string
    prioridade: Prioridade
    porque: string | null
    exemplo: string | null
    revisaoHumana: boolean
    ocorrencias: { descricao: string; seletor: string; trecho: string | null }[]
  }[]
  revisao: {
    numero: string
    nome: string
    motivo: 'fixa' | 'duvida'
    conferir: string | null
    feita: boolean
  }[]
}

const ROTULO: Record<Prioridade, string> = { alta: 'alta', media: 'média', baixa: 'baixa' }
// o design-system não tem selo de prioridade baixa; o contorno neutro serve, e o texto diz qual é
const SELO = { alta: 'alta', media: 'media', baixa: 'pendente' } as const
// cabeçalho de linha com cara de texto comum, como no protótipo (o th do design-system é miúdo e cinza)
const LINHA = { fontWeight: 400, color: 'var(--ink)', fontSize: '1rem' }

function plural(n: number, singular: string, mais: string) {
  return `${n} ${n === 1 ? singular : mais}`
}

// Tela 5 · Resultado (RF04, RF05, RF06, RF09). Layout do protótipo de 28/10; conta da decisão de 05/11.
export function Resultado({ id, resultado }: { id: string; resultado: ResultadoAvaliacao }) {
  const { nota, verificacoes, cartoes, revisao } = resultado
  const aprovadas = verificacoes.filter((v) => v.aprovada)
  const soma = (lista: typeof verificacoes) => lista.reduce((total, v) => total + v.peso, 0)
  const falhas = cartoes.reduce((total, c) => total + c.ocorrencias.length, 0)

  return (
    <>
      <div className="painel">
        <div className="nota">
          {nota === null ? null : (
            <p className="nota-num">
              <span aria-hidden="true">
                {nota}
                <small>/100</small>
              </span>
              <span className="so-leitor">Nota {nota} de 100</span>
            </p>
          )}
          <div style={{ display: 'grid', gap: 10, minWidth: 0 }}>
            <p>
              <Selo variante="auto">Nota automática</Selo>
            </p>
            <p>
              <strong>Não é certificação. A conclusão de conformidade é sua.</strong>
            </p>
            <p className="meta">
              {nota === null
                ? null
                : `${aprovadas.length} de ${plural(verificacoes.length, 'verificação automática aprovada', 'verificações automáticas aprovadas')} · `}
              {plural(falhas, 'falha', 'falhas')} em{' '}
              {plural(cartoes.length, 'requisito', 'requisitos')} ·{' '}
              {plural(revisao.length, 'item', 'itens')} para revisão humana
            </p>
          </div>
        </div>
        {nota === null ? (
          <Aviso>
            <p>
              Esta avaliação foi feita antes do cálculo da nota. Faça uma nova avaliação para ver a
              nota.
            </p>
          </Aviso>
        ) : (
          <details className="conta">
            <summary>Como chegamos a {nota}</summary>
            <div className="rolar">
              <table>
                <caption className="dica" style={{ textAlign: 'left', captionSide: 'bottom' }}>
                  Nota = 100 × soma dos pesos das recomendações aprovadas ÷ soma dos pesos das
                  recomendações que se aplicam à página. Peso pela prioridade: alta 3, média 2,
                  baixa 1.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Recomendação do eMAG 3.1</th>
                    <th scope="col">Prioridade</th>
                    <th scope="col" className="n">
                      Peso
                    </th>
                    <th scope="col">Resultado</th>
                  </tr>
                </thead>
                <tbody>
                  {verificacoes.map((v) => (
                    <tr key={v.numero}>
                      <th scope="row" style={LINHA}>
                        {v.numero} · {v.nome}
                      </th>
                      <td>{ROTULO[v.prioridade]}</td>
                      <td className="n">{v.peso}</td>
                      <td>
                        <Selo variante={v.aprovada ? 'aprovada' : 'alta'}>
                          {v.aprovada ? 'Aprovada' : 'Reprovada'}
                        </Selo>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total</td>
                    <td className="n">
                      100 × {soma(aprovadas)} ÷ {soma(verificacoes)} = {nota}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </details>
        )}
      </div>

      <Abas id={id} cartoes={cartoes} revisao={revisao} />
    </>
  )
}

const ABAS = ['falhas', 'humana'] as const

function Abas({
  id,
  cartoes,
  revisao,
}: {
  id: string
  cartoes: ResultadoAvaliacao['cartoes']
  revisao: ResultadoAvaliacao['revisao']
}) {
  const [aba, setAba] = useState(0)
  const botoes = useRef<(HTMLButtonElement | null)[]>([])

  // padrão de abas do WAI-ARIA: setas trocam e levam o foco; Home e End vão às pontas
  function teclas(evento: KeyboardEvent) {
    const destino = { ArrowRight: aba + 1, ArrowLeft: aba - 1, Home: 0, End: ABAS.length - 1 }[
      evento.key
    ]
    if (destino === undefined) return
    evento.preventDefault()
    const nova = (destino + ABAS.length) % ABAS.length
    setAba(nova)
    botoes.current[nova]?.focus()
  }

  const rotulos = [`Falhas automáticas (${cartoes.length})`, `Revisão humana (${revisao.length})`]
  return (
    <div className="painel">
      <div role="tablist" aria-label="Tipo de verificação">
        {ABAS.map((nome, indice) => (
          <button
            key={nome}
            ref={(botao) => {
              botoes.current[indice] = botao
            }}
            type="button"
            role="tab"
            id={`aba-${nome}`}
            aria-controls={`painel-${nome}`}
            aria-selected={aba === indice}
            tabIndex={aba === indice ? 0 : -1}
            onClick={() => setAba(indice)}
            onKeyDown={teclas}
          >
            {rotulos[indice]}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="painel-falhas" aria-labelledby="aba-falhas" hidden={aba !== 0}>
        {cartoes.length === 0 ? (
          <p>Não encontramos falhas automáticas. Ainda assim, faça a revisão humana.</p>
        ) : (
          <ul className="falhas">
            {cartoes.map((cartao) => (
              <Cartao key={cartao.numero} cartao={cartao} />
            ))}
          </ul>
        )}
      </div>
      <div role="tabpanel" id="painel-humana" aria-labelledby="aba-humana" hidden={aba !== 1}>
        <RevisaoHumana id={id} revisao={revisao} />
      </div>
    </div>
  )
}

function Cartao({ cartao }: { cartao: ResultadoAvaliacao['cartoes'][number] }) {
  const { numero, nome, link, prioridade, porque, exemplo, revisaoHumana, ocorrencias } = cartao
  const primeira = ocorrencias[0]?.seletor ?? ''
  return (
    <li className="falha">
      <div style={{ display: 'grid', gap: 8, minWidth: 0 }}>
        <p className="linha1">
          <Selo variante={SELO[prioridade]}>Prioridade {ROTULO[prioridade]}</Selo>
          <Selo variante="auto">Automático</Selo>
          {revisaoHumana ? <Selo variante="humana">Confirme à mão</Selo> : null}
        </p>
        <h2 style={{ fontSize: '1.1rem' }}>
          {numero} · {nome}
        </h2>
        <p className="local">
          {plural(ocorrencias.length, 'ocorrência', 'ocorrências')} · {primeira}
          {ocorrencias.length > 1 ? ` e mais ${ocorrencias.length - 1}` : ''}
        </p>
        {porque ? (
          <>
            <h3>Por que é falha</h3>
            <p>{porque}</p>
          </>
        ) : null}
        {exemplo ? (
          <>
            <h3>Como corrigir (exemplo)</h3>
            <pre className="codigo" translate="no">
              {exemplo}
            </pre>
          </>
        ) : null}
        <details>
          <summary>Onde está ({ocorrencias.length})</summary>
          <ol style={{ display: 'grid', gap: 12, paddingTop: 8 }}>
            {ocorrencias.map((o, indice) => (
              // o trecho vem da página avaliada: sempre como texto, nunca como HTML (RNF10)
              <li key={indice} style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                <p className="dica">{o.descricao}</p>
                <p className="local">
                  <code translate="no">{o.seletor}</code>
                </p>
                {o.trecho ? (
                  <pre className="codigo" translate="no">
                    {o.trecho}
                  </pre>
                ) : null}
              </li>
            ))}
          </ol>
        </details>
        <p>
          <a href={link}>Ler a recomendação {numero} no eMAG 3.1</a>
        </p>
      </div>
    </li>
  )
}

function RevisaoHumana({ id, revisao }: { id: string; revisao: ResultadoAvaliacao['revisao'] }) {
  const { definirUsuario } = useSessao()
  const [feitas, setFeitas] = useState(
    () => new Set(revisao.filter((item) => item.feita).map((item) => item.numero)),
  )
  const [erro, setErro] = useState('')

  const marcar = (numero: string, feita: boolean) =>
    setFeitas((atual) => {
      const nova = new Set(atual)
      if (feita) nova.add(numero)
      else nova.delete(numero)
      return nova
    })

  async function mudar(numero: string, feita: boolean) {
    marcar(numero, feita)
    const { status, corpo } = await enviar<{ erro: string }>(
      `/api/avaliacoes/${encodeURIComponent(id)}/revisao`,
      { numero, feita },
    )
    if (status === 204) return setErro('')
    marcar(numero, !feita) // não gravou: a caixa volta a mostrar o que está salvo
    if (status === 401) return definirUsuario(null)
    setErro(mensagemDeErro(status, corpo.erro))
  }

  return (
    <>
      <p className="dica" style={{ margin: '16px 0 12px' }}>
        A ferramenta não consegue julgar estes itens. Eles não entram na nota. Marque cada um depois
        de conferir à mão.
      </p>
      {erro ? (
        <Aviso tipo="alerta" papel="alert">
          <p>{erro}</p>
        </Aviso>
      ) : null}
      <ul className="checks">
        {revisao.map((item) => (
          <li key={item.numero}>
            <label>
              <input
                type="checkbox"
                checked={feitas.has(item.numero)}
                onChange={(evento) => void mudar(item.numero, evento.target.checked)}
              />
              <span style={{ display: 'grid', gap: 4 }}>
                <span>
                  <strong>{item.numero}</strong> · {item.nome}
                  {item.motivo === 'duvida' ? ' (o axe-core ficou em dúvida nesta página)' : ''}
                </span>
                {item.conferir ? <span className="dica">{item.conferir}</span> : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </>
  )
}
