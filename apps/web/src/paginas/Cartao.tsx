import { Ponto } from '../componentes/Ponto.tsx'
import { Selo } from '../componentes/Selo.tsx'
import type { ResultadoAvaliacao } from './Resultado.tsx'

type Prioridade = ResultadoAvaliacao['cartoes'][number]['prioridade']

const ROTULO: Record<Prioridade, string> = { alta: 'alta', media: 'média', baixa: 'baixa' }
// o design-system não tem selo de prioridade baixa; o contorno neutro serve, e o texto diz qual é
const SELO = { alta: 'alta', media: 'media', baixa: 'pendente' } as const

// Cartão de uma recomendação com falha, na aba "Falhas automáticas" da Tela 5
export function Cartao({ cartao }: { cartao: ResultadoAvaliacao['cartoes'][number] }) {
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
          {ocorrencias.length} {ocorrencias.length === 1 ? 'ocorrência' : 'ocorrências'}
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
          {/* site de fora: outra aba, a pedido do João (19/11/2026), com o aviso no texto que o eMAG 1.9 pede.
              noopener: a página aberta não controla esta; noreferrer: não leva o endereço da avaliação */}
          <a href={link} target="_blank" rel="noopener noreferrer">
            Ler a recomendação {numero} no eMAG 3.1 (abre em nova aba)
          </a>
        </p>
      </div>
    </li>
  )
}
