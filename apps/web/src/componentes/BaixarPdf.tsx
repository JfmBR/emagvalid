import { useId, useRef, useState } from 'react'
import { mensagemDeErro } from '../api.ts'
import { useSessao } from '../sessao.tsx'
import { Aviso } from './Aviso.tsx'
import { Botao } from './Botao.tsx'

export const AVISO_PLANO_PAGO =
  'O relatório em PDF faz parte do plano pago. No MVP não há cobrança: o grupo libera o plano nas contas de demonstração.'

// "Baixar PDF" da Tela 5 e da Tela 8 (RF12). Sem plano pago, o botão fica bloqueado com o aviso (RF21):
// aria-disabled, e não disabled, para continuar no Tab e o leitor de tela ler o porquê.
// avisoBloqueioId: o aviso já está na tela (Tela 8, um para a tabela toda), e o botão só aponta para ele.
export function BaixarPdf({ id, avisoBloqueioId }: { id: string; avisoBloqueioId?: string }) {
  const { usuario, definirUsuario } = useSessao()
  const idAviso = useId()
  const [baixando, setBaixando] = useState(false)
  const [erro, setErro] = useState('')
  // o estado demora um render; a ref barra o segundo clique na hora
  const ocupado = useRef(false)

  if (!usuario?.planoPago) {
    return (
      <>
        <Botao variante="sec" aria-disabled="true" aria-describedby={avisoBloqueioId ?? idAviso}>
          Baixar PDF (plano pago)
        </Botao>
        {avisoBloqueioId ? null : (
          <p className="dica" id={idAviso}>
            {AVISO_PLANO_PAGO}
          </p>
        )}
      </>
    )
  }

  async function baixar() {
    if (ocupado.current) return
    ocupado.current = true
    setBaixando(true)
    setErro('')
    try {
      const resposta = await fetch(`/api/avaliacoes/${encodeURIComponent(id)}/pdf`)
      if (resposta.ok) {
        const nome =
          /filename="([^"]+)"/.exec(resposta.headers.get('Content-Disposition') ?? '')?.[1] ??
          'relatorio.pdf'
        const endereco = URL.createObjectURL(await resposta.blob())
        const link = document.createElement('a')
        link.href = endereco
        link.download = nome
        document.body.append(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(endereco)
        return
      }
      if (resposta.status === 401) return definirUsuario(null)
      const corpo = (await resposta.json().catch(() => ({}))) as { erro?: string }
      setErro(mensagemDeErro(resposta.status, corpo.erro))
    } catch {
      setErro(mensagemDeErro(0))
    } finally {
      ocupado.current = false
      setBaixando(false)
    }
  }

  return (
    <>
      <Botao aria-busy={baixando} onClick={baixar}>
        {baixando ? 'Gerando o PDF...' : 'Baixar PDF'}
      </Botao>
      {erro ? (
        <Aviso tipo="alerta" papel="alert">
          <p>{erro}</p>
        </Aviso>
      ) : null}
    </>
  )
}
