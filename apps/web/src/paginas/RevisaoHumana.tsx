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
        {revisao.map((item) => {
          const base = `rev-${item.numero}`
          const descricao = [
            item.motivo === 'duvida' ? `${base}-duvida` : '',
            item.conferir ? `${base}-conferir` : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <li key={item.numero}>
              <label>
                <input
                  type="checkbox"
                  aria-labelledby={`${base}-nome`}
                  aria-describedby={descricao || undefined}
                  checked={feitas.has(item.numero)}
                  onChange={(evento) => void mudar(item.numero, evento.target.checked)}
                />
                <span style={{ display: 'grid', gap: 4 }}>
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
                  {item.conferir ? (
                    <span className="dica" id={`${base}-conferir`}>
                      {item.conferir}
                    </span>
                  ) : null}
                </span>
              </label>
            </li>
          )
        })}
      </ul>
    </>
  )
}
