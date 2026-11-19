import { useRef, useState } from 'react'
import { mensagemDeErro } from '../api.ts'
import { useSessao } from '../sessao.tsx'
import { Aviso } from './Aviso.tsx'
import { Botao } from './Botao.tsx'

// "Baixar PDF" da Tela 5 e da Tela 8 (RF12), para toda conta (plano pago fora do MVP, 19/11/2026).
// pagina: na Tela 8, cada linha tem um botão; o leitor de tela ouve de qual página é.
// antes: na Tela 5, espera as marcações da revisão que ainda estão sendo gravadas, para o PDF levá-las.
export function BaixarPdf({
  id,
  pagina,
  variante = 'principal',
  antes,
}: {
  id: string
  pagina?: string
  variante?: 'principal' | 'txt'
  antes?: () => Promise<unknown>
}) {
  const { definirUsuario } = useSessao()
  const [baixando, setBaixando] = useState(false)
  const [erro, setErro] = useState('')
  // o estado demora um render; a ref barra o segundo clique na hora
  const ocupado = useRef(false)
  // o espaço fica fora do span: dentro dele, o nome acessível o perde
  const dePagina = pagina ? (
    <>
      {' '}
      <span className="so-leitor">de {pagina}</span>
    </>
  ) : null

  async function baixar() {
    if (ocupado.current) return
    ocupado.current = true
    setBaixando(true)
    setErro('')
    try {
      await antes?.()
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
        // Safari e Firefox leem o blob depois do clique: soltar na hora cancelaria o download
        setTimeout(() => URL.revokeObjectURL(endereco), 1_000)
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
      <Botao variante={variante} aria-busy={baixando} onClick={() => void baixar()}>
        {baixando ? 'Gerando o PDF...' : 'Baixar PDF'}
        {dePagina}
      </Botao>
      {erro ? (
        <Aviso tipo="alerta" papel="alert">
          <p>{erro}</p>
        </Aviso>
      ) : null}
    </>
  )
}
