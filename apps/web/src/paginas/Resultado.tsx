import { useRef, useState, type KeyboardEvent } from 'react'
import { Aviso } from '../componentes/Aviso.tsx'
import { Ponto } from '../componentes/Ponto.tsx'
import { Selo } from '../componentes/Selo.tsx'
import { RevisaoHumana } from './RevisaoHumana.tsx'

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
          {/* o leitor de tela já ouve a nota no h1 (Analise.tsx): aqui ela só aparece */}
          {nota === null ? null : (
            <p className="nota-num" aria-hidden="true">
              {nota}
              <small>/100</small>
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
              {nota === null ? null : (
                <>
                  {aprovadas.length} de{' '}
                  {plural(
                    verificacoes.length,
                    'verificação automática aprovada',
                    'verificações automáticas aprovadas',
                  )}
                  <Ponto />
                </>
              )}
              {plural(falhas, 'falha', 'falhas')} em{' '}
              {plural(cartoes.length, 'requisito', 'requisitos')}
              <Ponto />
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
            {/* Região focável: o Tab para na tabela e o leitor de tela a anuncia (como a tabela-rolagem do
                protótipo). Área com rolagem precisa receber foco (axe scrollable-region-focusable). */}
            {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <section className="rolar" tabIndex={0} aria-label="Conta da nota">
              {/* a fórmula vem depois da tabela, mas quem pula direto para ela (tecla T) também a ouve */}
              <table aria-describedby="formula-nota">
                <caption className="dica" style={{ textAlign: 'left' }}>
                  Recomendações que se aplicam à página
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
                        {v.numero}
                        <Ponto />
                        {v.nome}
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
                      <span aria-hidden="true">
                        100 × {soma(aprovadas)} ÷ {soma(verificacoes)} = {nota}
                      </span>
                      <span className="so-leitor">
                        100 vezes {soma(aprovadas)}, dividido por {soma(verificacoes)}, igual a{' '}
                        {nota}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="dica" id="formula-nota" style={{ paddingTop: 8 }}>
                Nota = 100 × soma dos pesos das recomendações aprovadas ÷ soma dos pesos das
                recomendações que se aplicam à página. Peso pela prioridade: alta 3, média 2, baixa
                1.
              </p>
            </section>
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

  // O nome é o texto visível: quem usa comando de voz fala o que vê (WCAG 2.5.3). Na pontuação
  // padrão, o Orca e o NVDA não leem os parênteses.
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
      {/* tabIndex 0: o Tab para no painel mesmo quando ele não tem nada focável (padrão WAI-ARIA) */}
      <div
        role="tabpanel"
        id="painel-falhas"
        aria-labelledby="aba-falhas"
        tabIndex={0}
        hidden={aba !== 0}
      >
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
      <div
        role="tabpanel"
        id="painel-humana"
        aria-labelledby="aba-humana"
        tabIndex={0}
        hidden={aba !== 1}
      >
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
        {/* o título vem antes dos selos no código (o leitor de tela ouve primeiro o requisito); na tela, os selos ficam em cima */}
        <h2 style={{ fontSize: '1.1rem' }}>
          {numero}
          <Ponto />
          {nome}
        </h2>
        <p className="linha1" style={{ order: -1 }}>
          <Selo variante={SELO[prioridade]}>Prioridade {ROTULO[prioridade]}</Selo>
          {/* a aba já diz "Falhas automáticas": o leitor não precisa ouvir de novo em cada cartão */}
          <span aria-hidden="true">
            <Selo variante="auto">Automático</Selo>
          </span>
          {revisaoHumana ? <Selo variante="humana">Confirme à mão</Selo> : null}
        </p>
        <p className="local">
          {plural(ocorrencias.length, 'ocorrência', 'ocorrências')}
          <Ponto />
          {primeira}
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
