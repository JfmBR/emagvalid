import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

// StrictMode como no main.tsx: em desenvolvimento ele roda cada efeito duas vezes
function abrir(endereco: string) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[endereco]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )
}

type RespostaFalsa = { status: number; corpo?: unknown }

// API falsa: cada caminho responde o que o teste mandar; o resto responde 401 (ninguém entrou)
function simularApi(rotas: Record<string, RespostaFalsa> = {}) {
  const enviados: Record<string, unknown> = {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      if (opcoes?.body) enviados[caminho] = JSON.parse(String(opcoes.body))
      const { status, corpo } = rotas[caminho] ?? { status: 401, corpo: { erro: 'Entre.' } }
      return new Response(status === 204 ? null : JSON.stringify(corpo ?? {}), { status })
    }),
  )
  return enviados
}

const helena = { nome: 'Helena Souza', email: 'helena@empresa.com.br' }

function preencher(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Tela 1 e navegação', () => {
  it('mostra o título, o aviso de que não é certificação e os caminhos para entrar', async () => {
    simularApi()
    abrir('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Acessibilidade digital')
    expect(screen.getByRole('note')).toHaveTextContent(/Não são certificação/)
    expect(await screen.findByRole('link', { name: 'Criar conta' })).toHaveAttribute(
      'href',
      '/cadastro',
    )
  })

  it('endereço desconhecido mostra "Página não encontrada"', () => {
    simularApi()
    abrir('/nao-existe')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Página não encontrada')
  })

  it('ao trocar de tela, o foco vai para o h1 da tela nova', () => {
    simularApi()
    abrir('/nao-existe')
    // na primeira carga o foco não é movido
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus()

    fireEvent.click(screen.getByRole('link', { name: 'Voltar para o início' }))

    const titulo = screen.getByRole('heading', { level: 1 })
    expect(titulo).toHaveTextContent('Acessibilidade digital')
    expect(titulo).toHaveFocus()
  })
})

describe('Tela 2 · cadastro', () => {
  it('mostra o erro no campo e leva o foco até ele', async () => {
    simularApi({
      '/api/auth/cadastro': {
        status: 400,
        corpo: { campos: { email: 'Digite um e-mail válido, como nome@empresa.com.br.' } },
      },
    })
    abrir('/cadastro')
    preencher('E-mail', 'helena@')

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    const email = screen.getByLabelText('E-mail')
    await waitFor(() => expect(email).toHaveFocus())
    expect(email).toBeInvalid()
    expect(email).toHaveAccessibleDescription(/Digite um e-mail válido/)
  })

  it('cria a conta, volta ao início e cumprimenta pelo primeiro nome', async () => {
    const enviados = simularApi({
      '/api/auth/cadastro': { status: 201, corpo: { usuario: helena } },
    })
    abrir('/cadastro')
    preencher('Nome', helena.nome)
    preencher('E-mail', helena.email)
    preencher('Senha', 'Senha-forte-1')

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }))

    expect(await screen.findByText('Olá, Helena')).toBeInTheDocument()
    // a troca de rota chega depois da saudação: espera o título da Inicial
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      'Acessibilidade digital',
    )
    expect(enviados['/api/auth/cadastro']).toEqual({ ...helena, senha: 'Senha-forte-1' })
  })

  it('"Mostrar senha" troca o campo para texto e volta', () => {
    simularApi()
    abrir('/cadastro')
    const senha = screen.getByLabelText('Senha')
    expect(senha).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByLabelText('Mostrar senha'))
    expect(senha).toHaveAttribute('type', 'text')
  })
})

describe('Tela 2 · entrar e sair', () => {
  it('login errado mostra um alerta com a mensagem da API', async () => {
    simularApi({
      '/api/auth/entrar': { status: 401, corpo: { erro: 'E-mail ou senha incorretos.' } },
    })
    abrir('/entrar')

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha incorretos.')
  })

  it('sem conexão, diz para conferir a internet', async () => {
    simularApi()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (caminho: string) => {
        if (caminho === '/api/auth/entrar') throw new TypeError('Failed to fetch')
        return new Response('{}', { status: 401 })
      }),
    )
    abrir('/entrar')

    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Confira sua internet/)
  })

  it('quem entrou vê "Sair"; ao sair, volta o "Entrar" e o foco vai para o título', async () => {
    simularApi({
      '/api/auth/eu': { status: 200, corpo: { usuario: helena } },
      '/api/auth/sair': { status: 204 },
    })
    abrir('/')

    fireEvent.click(await screen.findByRole('button', { name: 'Sair' }))

    const menu = screen.getByRole('navigation', { name: 'Principal' })
    expect(await within(menu).findByRole('link', { name: 'Entrar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus()
  })
})

describe('Tela 3 · nova avaliação', () => {
  const logada = { '/api/auth/eu': { status: 200, corpo: { usuario: helena } } }
  const titulo = 'Qual página você quer avaliar?'

  it('sem login, /avaliacoes/nova leva para /entrar', async () => {
    simularApi()
    abrir('/avaliacoes/nova')

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('quem entrou vê "Nova avaliação" na Tela 1', async () => {
    simularApi(logada)
    abrir('/')

    expect(await screen.findByRole('link', { name: 'Nova avaliação' })).toHaveAttribute(
      'href',
      '/avaliacoes/nova',
    )
  })

  it('envia a URL e vai para a Tela 4', async () => {
    const enviados = simularApi({
      ...logada,
      '/api/avaliacoes': { status: 202, corpo: { avaliacao: { id: 'a1' } } },
    })
    abrir('/avaliacoes/nova')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(titulo)
    preencher('Endereço da página (URL)', 'https://www.suaempresa.com.br/contato')

    fireEvent.click(screen.getByRole('button', { name: 'Avaliar página' }))

    await waitFor(() => expect(screen.queryByText(titulo)).not.toBeInTheDocument())
    expect(enviados['/api/avaliacoes']).toEqual({ url: 'https://www.suaempresa.com.br/contato' })
  })

  it('erro do campo aparece no campo e recebe o foco', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': {
        status: 400,
        corpo: {
          erro: 'Confira os campos marcados.',
          campos: { url: 'Digite um endereço válido.' },
        },
      },
    })
    abrir('/avaliacoes/nova')
    preencher('Endereço da página (URL)', 'oi')

    fireEvent.click(await screen.findByRole('button', { name: 'Avaliar página' }))

    const url = screen.getByLabelText('Endereço da página (URL)')
    await waitFor(() => expect(url).toHaveFocus())
    expect(url).toBeInvalid()
    expect(url).toHaveAccessibleDescription(/Digite um endereço válido/)
  })

  it('409 e 429 aparecem no aviso de erro', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': { status: 409, corpo: { erro: 'Você já tem uma análise em andamento.' } },
    })
    abrir('/avaliacoes/nova')
    fireEvent.click(await screen.findByRole('button', { name: 'Avaliar página' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Você já tem uma análise em andamento.',
    )

    simularApi({
      ...logada,
      '/api/avaliacoes': { status: 429, corpo: { erro: 'Limite de 10 análises por hora.' } },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Avaliar página' }))
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Limite de 10 análises por hora.'),
    )
  })

  it('?url= vem preenchido', async () => {
    simularApi(logada)
    abrir('/avaliacoes/nova?url=https://www.loja.com.br/')

    expect(await screen.findByLabelText('Endereço da página (URL)')).toHaveValue(
      'https://www.loja.com.br/',
    )
  })

  it('dois cliques mandam um pedido só', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': { status: 202, corpo: { avaliacao: { id: 'a1' } } },
    })
    abrir('/avaliacoes/nova')
    const botao = await screen.findByRole('button', { name: 'Avaliar página' })

    fireEvent.click(botao)
    fireEvent.click(botao)

    await waitFor(() => expect(screen.queryByText(titulo)).not.toBeInTheDocument())
    const pedidos = vi.mocked(fetch).mock.calls.filter(([caminho]) => caminho === '/api/avaliacoes')
    expect(pedidos).toHaveLength(1)
  })
})
