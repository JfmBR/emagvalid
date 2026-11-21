import { useRef, useState } from 'react'
import { enviar, mensagemDeErro } from '../api.ts'
import { Aviso } from '../componentes/Aviso.tsx'
import { Ponto } from '../componentes/Ponto.tsx'
import { useSessao } from '../sessao.tsx'
import type { ResultadoAvaliacao } from './Resultado.tsx'

// Aba "Revisão humana" da Tela 5 (RF09): uma caixa por item, gravada na hora.
// As marcas (feitas) vivem no Resultado, que mostra a contagem junto do "Baixar PDF".
export function RevisaoHumana({
  id,
  revisao,
  feitas,
  marcar,
  aoGravar,
}: {
  id: string
  revisao: ResultadoAvaliacao['revisao']
  feitas: Set<string>
  marcar: (numero: string, feita: boolean) => void
  // cada gravação em andamento: o "Baixar PDF" espera por ela
  aoGravar: (pedido: Promise<unknown>) => void
}) {
  const { definirUsuario } = useSessao()
  const [erro, setErro] = useState('')
  // um pedido por item de cada vez: respostas fora de ordem desfariam a marca errada
  const pendentes = useRef(new Set<string>())

  async function mudar(numero: string, feita: boolean) {
    if (pendentes.current.has(numero)) return // o clique é ignorado e a caixa fica como está
    pendentes.current.add(numero)
    marcar(numero, feita)
    const pedido = enviar<{ erro: string }>(`/api/avaliacoes/${encodeURIComponent(id)}/revisao`, {
      numero,
      feita,
    })
    aoGravar(pedido)
    const { status, corpo } = await pedido
    pendentes.current.delete(numero)
    if (status === 204) return setErro('')
    marcar(numero, !feita) // não gravou: a caixa volta a mostrar o que está salvo
    if (status === 401) return definirUsuario(null)
    setErro(mensagemDeErro(status, corpo.erro))
  }

  const principal = revisao.filter((item) => !item.naoSeAplica)
  const grupo = revisao.filter((item) => item.naoSeAplica)

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
      {/* nome curto (número e recomendação) e, como descrição, o resto: o leitor de tela lê depois, com pausa */}
      <ul className="checks">
        {principal.map((item) => (
          <Item key={item.numero} item={item} feita={feitas.has(item.numero)} mudar={mudar} />
        ))}
      </ul>
      {/* itens que a ferramenta acha que não se aplicam: ficam visíveis e marcáveis, fora da contagem */}
      {grupo.length > 0 ? (
        <>
          <h2 style={{ fontSize: '1.1rem', margin: '24px 0 8px' }}>
            Provavelmente não se aplicam nesta página ({grupo.length})
          </h2>
          <p className="dica" style={{ margin: '0 0 12px' }}>
            A ferramenta não achou na página o que estes itens pedem. Ela pode ter deixado algo
            passar, como um vídeo que só carrega ao rolar a página. Marque se conferir.
          </p>
          <ul className="checks">
            {grupo.map((item) => (
              <Item key={item.numero} item={item} feita={feitas.has(item.numero)} mudar={mudar} />
            ))}
          </ul>
        </>
      ) : null}
    </>
  )
}

type ItemDaRevisao = ResultadoAvaliacao['revisao'][number]

function Item({
  item,
  feita,
  mudar,
}: {
  item: ItemDaRevisao
  feita: boolean
  mudar: (numero: string, feita: boolean) => Promise<void>
}) {
  const base = `rev-${item.numero}`
  const { indicio } = item
  const descricao = [
    item.motivo === 'duvida' ? `${base}-duvida` : '',
    indicio ? `${base}-indicio` : '',
    item.naoSeAplica ? `${base}-motivo` : '',
    item.conferir ? `${base}-conferir` : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <li>
      <label>
        <input
          type="checkbox"
          aria-labelledby={`${base}-nome`}
          aria-describedby={descricao || undefined}
          checked={feita}
          onChange={(evento) => void mudar(item.numero, evento.target.checked)}
        />
        <span style={{ display: 'grid', gap: 4, minWidth: 0 }}>
          <span>
            <span id={`${base}-nome`}>
              <strong>{item.numero}</strong>
              <Ponto />
              {item.nome}
            </span>
            {item.motivo === 'duvida' ? (
              <span id={`${base}-duvida`}> (o axe-core ficou em dúvida nesta página)</span>
            ) : null}
          </span>
          {indicio ? (
            <span id={`${base}-indicio`} style={{ display: 'grid', gap: 4 }}>
              {/* os espaços não aparecem na grade, mas separam as frases na descrição lida */}
              <span>Indício: {indicio.texto}</span>{' '}
              {indicio.exemplos.length > 0 ? (
                <>
                  <span className="dica">Onde achamos:</span>
                  {/* seletor e trecho vêm da página avaliada: sempre como texto, nunca como HTML (RNF10) */}
                  {indicio.exemplos.map((exemplo, indice) => (
                    <span key={indice} style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                      {exemplo.seletor ? (
                        <code translate="no" style={{ overflowWrap: 'anywhere' }}>
                          {exemplo.seletor}
                        </code>
                      ) : null}
                      <code className="codigo" translate="no" style={{ display: 'block' }}>
                        {exemplo.trecho}
                      </code>
                    </span>
                  ))}
                </>
              ) : null}
            </span>
          ) : null}
          {item.naoSeAplica ? (
            <span className="dica" id={`${base}-motivo`}>
              {item.naoSeAplica}
            </span>
          ) : null}
          {item.conferir ? (
            <span className="dica" id={`${base}-conferir`}>
              {item.conferir}
            </span>
          ) : null}
        </span>
      </label>
    </li>
  )
}
