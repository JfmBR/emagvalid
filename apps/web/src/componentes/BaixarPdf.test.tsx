import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ProvedorSessao, useSessao } from '../sessao.tsx'
import { BaixarPdf } from './BaixarPdf.tsx'

const helena = { nome: 'Helena Souza', email: 'helena@empresa.com.br' }
const CAMINHO = '/api/avaliacoes/a1/pdf'
const AVISO_PLANO =
  'O relatório em PDF faz parte do plano pago. No MVP não há cobrança: o grupo libera o plano nas contas de demonstração.'

// API falsa: /eu diz quem entrou; o PDF responde o que o teste mandar
function simularApi(planoPago: boolean, pdf: () => Response | Promise<Response>) {
  const pedidos: string[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string) => {
      pedidos.push(caminho)
      if (caminho === '/api/auth/eu') {
        return new Response(JSON.stringify({ usuario: { ...helena, planoPago } }))
      }
      return pdf()
    }),
  )
  return pedidos
}

const pdfOk = () =>
  new Response('%PDF-1.7', {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="acessaweb-www.loja.com.br-2026-11-19.pdf"',
    },
  })

// mostra se a sessão ainda tem alguém, para o teste do 401
function QuemEntrou() {
  const { usuario } = useSessao()
  return <p>{usuario ? 'dentro' : 'fora'}</p>
}

function abrir() {
  return render(
    <ProvedorSessao>
      <BaixarPdf id="a1" />
      <QuemEntrou />
    </ProvedorSessao>,
  )
}

let baixados: string[]

beforeEach(() => {
  baixados = []
  // o jsdom não tem URL.createObjectURL nem baixa arquivos: guardamos o nome do link clicado
  URL.createObjectURL = vi.fn<(objeto: Blob) => string>(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn<(endereco: string) => void>()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    baixados.push(this.download)
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('BaixarPdf', () => {
  it('com plano, baixa com o nome do Content-Disposition', async () => {
    const pedidos = simularApi(true, pdfOk)
    abrir()

    fireEvent.click(await screen.findByRole('button', { name: 'Baixar PDF' }))

    await waitFor(() => expect(baixados).toEqual(['acessaweb-www.loja.com.br-2026-11-19.pdf']))
    expect(pedidos).toContain(CAMINHO)
    await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:falso'), {
      timeout: 2_000,
    })
  })

  it('só solta o endereço do arquivo depois que o navegador começa a ler (Safari e Firefox)', async () => {
    // o navegador lê o blob depois do clique, numa tarefa seguinte; soltar antes cancela o download
    let soltoAntesDeLer: boolean | null = null
    vi.mocked(HTMLAnchorElement.prototype.click).mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      baixados.push(this.download)
      setTimeout(() => {
        soltoAntesDeLer = vi.mocked(URL.revokeObjectURL).mock.calls.length > 0
      }, 0)
    })
    simularApi(true, pdfOk)
    abrir()

    fireEvent.click(await screen.findByRole('button', { name: 'Baixar PDF' }))

    await waitFor(() => expect(soltoAntesDeLer).not.toBeNull())
    expect(soltoAntesDeLer).toBe(false)
  })

  it('dois cliques seguidos mandam um pedido só', async () => {
    let soltar: (resposta: Response) => void = () => {}
    const pedidos = simularApi(true, () => new Promise((pronto) => (soltar = pronto)))
    abrir()
    const botao = await screen.findByRole('button', { name: 'Baixar PDF' })

    fireEvent.click(botao)
    fireEvent.click(botao)
    expect(await screen.findByRole('button', { name: 'Gerando o PDF...' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await act(async () => soltar(pdfOk()))

    await waitFor(() => expect(baixados).toHaveLength(1))
    expect(pedidos.filter((p) => p === CAMINHO)).toHaveLength(1)
  })

  it('sem plano: aria-disabled, descrição do plano pago e nenhum pedido ao clicar', async () => {
    const pedidos = simularApi(false, pdfOk)
    abrir()

    const botao = await screen.findByRole('button', { name: 'Baixar PDF (plano pago)' })
    expect(botao).toHaveAttribute('aria-disabled', 'true')
    expect(botao).not.toBeDisabled()
    expect(botao).toHaveAccessibleDescription(AVISO_PLANO)

    fireEvent.click(botao)
    expect(pedidos).not.toContain(CAMINHO)
  })

  it('429 e 503 mostram a mensagem da API num alerta', async () => {
    for (const [status, erro] of [
      [429, 'Você chegou ao limite de 10 relatórios por hora. Tente de novo mais tarde.'],
      [503, 'Outro relatório está sendo gerado. Tente de novo em instantes.'],
    ] as const) {
      simularApi(true, () => new Response(JSON.stringify({ erro }), { status }))
      const { unmount } = abrir()

      fireEvent.click(await screen.findByRole('button', { name: 'Baixar PDF' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(erro)
      expect(baixados).toEqual([])
      unmount()
    }
  })

  it('401 volta ao estado de não entrou', async () => {
    simularApi(true, () => new Response(JSON.stringify({ erro: 'Entre.' }), { status: 401 }))
    abrir()

    fireEvent.click(await screen.findByRole('button', { name: 'Baixar PDF' }))

    expect(await screen.findByText('fora')).toBeInTheDocument()
  })
})
