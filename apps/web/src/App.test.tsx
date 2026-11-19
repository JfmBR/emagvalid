import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter, useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

// API falsa: cada caminho responde o que o teste mandar (ou uma função, para mudar a resposta
// com o tempo ou conforme o método); o resto responde 401 (ninguém entrou)
function simularApi(
  rotas: Record<string, RespostaFalsa | ((opcoes?: RequestInit) => RespostaFalsa)> = {},
) {
  const enviados: Record<string, unknown> = {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      if (opcoes?.body) enviados[caminho] = JSON.parse(String(opcoes.body))
      const rota = rotas[caminho]
      const { status, corpo } = (typeof rota === 'function' ? rota(opcoes) : rota) ?? {
        status: 401,
        corpo: { erro: 'Entre.' },
      }
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
  vi.useRealTimers()
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

describe('Minha conta · excluir a conta', () => {
  const logada = { '/api/auth/eu': { status: 200, corpo: { usuario: helena } } }

  async function pedirExclusao(senha: string) {
    fireEvent.change(await screen.findByLabelText('Digite sua senha para confirmar'), {
      target: { value: senha },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Excluir minha conta' }))
  }

  it('sem login, /conta leva para /entrar', async () => {
    simularApi()
    abrir('/conta')

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('o topo leva à Minha conta, que mostra nome e e-mail', async () => {
    simularApi(logada)
    abrir('/')

    fireEvent.click(await screen.findByRole('link', { name: 'Minha conta' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Minha conta' })).toHaveFocus()
    expect(screen.getByText('helena@empresa.com.br')).toBeInTheDocument()
  })

  it('com a senha certa, envia a senha, diz que excluiu, leva o foco ao título e sai da conta', async () => {
    const enviados = simularApi({ ...logada, '/api/auth/excluir-conta': { status: 204 } })
    abrir('/conta')

    await pedirExclusao('Senha-forte-1')

    const titulo = await screen.findByRole('heading', { level: 1, name: 'Conta excluída' })
    expect(titulo).toHaveFocus()
    expect(enviados['/api/auth/excluir-conta']).toEqual({ senha: 'Senha-forte-1' })
    const menu = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(menu).getByRole('link', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('dois envios seguidos mandam um pedido só', async () => {
    simularApi({ ...logada, '/api/auth/excluir-conta': { status: 204 } })
    abrir('/conta')

    await pedirExclusao('Senha-forte-1')
    fireEvent.click(screen.getByRole('button', { name: /Exclu/ }))

    await screen.findByRole('heading', { level: 1, name: 'Conta excluída' })
    const pedidos = vi
      .mocked(fetch)
      .mock.calls.filter(([caminho]) => caminho === '/api/auth/excluir-conta')
    expect(pedidos).toHaveLength(1)
  })

  it('senha errada: o erro fica no campo, que recebe o foco', async () => {
    simularApi({
      ...logada,
      '/api/auth/excluir-conta': {
        status: 400,
        corpo: {
          erro: 'Confira os campos marcados.',
          campos: { senha: 'Senha incorreta. Confira e tente de novo.' },
        },
      },
    })
    abrir('/conta')

    await pedirExclusao('errada')

    const campo = await screen.findByLabelText('Digite sua senha para confirmar')
    await waitFor(() => expect(campo).toHaveFocus())
    expect(campo).toHaveAccessibleDescription(/Senha incorreta/)
  })

  it('com análise em andamento, mostra o alerta da API', async () => {
    simularApi({
      ...logada,
      '/api/auth/excluir-conta': {
        status: 409,
        corpo: {
          erro: 'Você tem uma análise em andamento. Espere ela terminar para excluir a conta.',
        },
      },
    })
    abrir('/conta')

    await pedirExclusao('Senha-forte-1')

    expect(await screen.findByRole('alert')).toHaveTextContent(/análise em andamento/)
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
      '/api/avaliacoes': { status: 202, corpo: { avaliacoes: [{ id: 'a1' }] } },
    })
    abrir('/avaliacoes/nova')
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(titulo)
    preencher('Endereço da página (URL)', 'https://www.suaempresa.com.br/contato')

    fireEvent.click(screen.getByRole('button', { name: 'Avaliar página' }))

    await waitFor(() => expect(screen.queryByText(titulo)).not.toBeInTheDocument())
    expect(enviados['/api/avaliacoes']).toEqual({
      urls: ['https://www.suaempresa.com.br/contato'],
    })
  })

  it('erro do campo aparece no campo e recebe o foco', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': {
        status: 400,
        corpo: {
          erro: 'Confira os campos marcados.',
          campos: { 'urls.0': 'Digite um endereço válido.' },
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
      '/api/avaliacoes': { status: 202, corpo: { avaliacoes: [{ id: 'a1' }] } },
    })
    abrir('/avaliacoes/nova')
    const botao = await screen.findByRole('button', { name: 'Avaliar página' })

    fireEvent.click(botao)
    fireEvent.click(botao)

    await waitFor(() => expect(screen.queryByText(titulo)).not.toBeInTheDocument())
    const pedidos = vi.mocked(fetch).mock.calls.filter(([caminho]) => caminho === '/api/avaliacoes')
    expect(pedidos).toHaveLength(1)
  })

  describe('lista de links (RF20)', () => {
    it('"+" acrescenta um campo e leva o foco; "Remover" tira e leva ao anterior', async () => {
      simularApi(logada)
      abrir('/avaliacoes/nova')
      const mais = await screen.findByRole('button', { name: '+ Adicionar outra página' })
      expect(screen.getByText('1 de 10 páginas')).toBeInTheDocument()

      fireEvent.click(mais)
      const segundo = screen.getByLabelText('Endereço da página 2 (URL)')
      await waitFor(() => expect(segundo).toHaveFocus())
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Quais páginas você quer avaliar?',
      )
      expect(screen.getByText('2 de 10 páginas')).toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'Remover a página 2' }))
      expect(screen.queryByLabelText('Endereço da página 2 (URL)')).not.toBeInTheDocument()
      await waitFor(() => expect(screen.getByLabelText('Endereço da página (URL)')).toHaveFocus())
    })

    it('remover dois campos seguidos leva o foco ao anterior nas duas vezes', async () => {
      simularApi(logada)
      abrir('/avaliacoes/nova')
      const mais = await screen.findByRole('button', { name: '+ Adicionar outra página' })
      for (let i = 0; i < 3; i++) fireEvent.click(mais) // 4 campos
      const segundo = screen.getByLabelText('Endereço da página 2 (URL)')

      fireEvent.click(screen.getByRole('button', { name: 'Remover a página 3' }))
      await waitFor(() => expect(segundo).toHaveFocus())
      // o novo 3º campo some, e o foco volta ao 2º de novo (o mesmo campo da vez anterior)
      screen.getByRole('button', { name: 'Remover a página 3' }).focus()
      fireEvent.click(screen.getByRole('button', { name: 'Remover a página 3' }))

      await waitFor(() => expect(segundo).toHaveFocus())
    })

    it('no décimo campo, o "+" some e aparece o aviso do limite', async () => {
      simularApi(logada)
      abrir('/avaliacoes/nova')
      const mais = await screen.findByRole('button', { name: '+ Adicionar outra página' })

      for (let i = 0; i < 9; i++) fireEvent.click(mais)

      expect(screen.getByLabelText('Endereço da página 10 (URL)')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: '+ Adicionar outra página' }),
      ).not.toBeInTheDocument()
      expect(screen.getByText('Você chegou ao limite de 10 páginas.')).toBeInTheDocument()
    })

    it('envia a lista na ordem, e o erro aparece no campo do link certo', async () => {
      const enviados = simularApi({
        ...logada,
        '/api/avaliacoes': {
          status: 400,
          corpo: { erro: 'Confira os campos marcados.', campos: { 'urls.1': 'Endereço interno.' } },
        },
      })
      abrir('/avaliacoes/nova')
      fireEvent.click(await screen.findByRole('button', { name: '+ Adicionar outra página' }))
      preencher('Endereço da página (URL)', 'https://loja.com.br/a')
      preencher('Endereço da página 2 (URL)', 'https://interno.exemplo/')

      fireEvent.click(screen.getByRole('button', { name: 'Avaliar páginas' }))

      const segundo = screen.getByLabelText('Endereço da página 2 (URL)')
      await waitFor(() => expect(segundo).toHaveFocus())
      expect(segundo).toHaveAccessibleDescription(/Endereço interno/)
      expect(screen.getByLabelText('Endereço da página (URL)')).toBeValid()
      expect(enviados['/api/avaliacoes']).toEqual({
        urls: ['https://loja.com.br/a', 'https://interno.exemplo/'],
      })
    })

    it('com 2 ou mais links, vai para o histórico', async () => {
      simularApi({
        ...logada,
        '/api/avaliacoes': (opcoes) =>
          opcoes?.method === 'POST'
            ? { status: 202, corpo: { avaliacoes: [{ id: 'a1' }, { id: 'a2' }] } }
            : { status: 200, corpo: { avaliacoes: [], proximo: null } },
      })
      abrir('/avaliacoes/nova')
      fireEvent.click(await screen.findByRole('button', { name: '+ Adicionar outra página' }))
      preencher('Endereço da página (URL)', 'https://loja.com.br/a')
      preencher('Endereço da página 2 (URL)', 'https://loja.com.br/b')

      fireEvent.click(screen.getByRole('button', { name: 'Avaliar páginas' }))

      expect(
        await screen.findByRole('heading', { level: 1, name: 'Histórico de avaliações' }),
      ).toBeInTheDocument()
    })
  })
})

describe('Tela 8 · histórico', () => {
  const logada = { '/api/auth/eu': { status: 200, corpo: { usuario: helena } } }
  const item = (id: string, dados: object = {}) => ({
    id,
    url: `https://loja.com.br/${id}`,
    status: 'CONCLUIDA',
    criadaEm: '2026-11-19T15:02:00.000Z',
    nota: 76,
    etapa: null,
    posicaoNaFila: null,
    ...dados,
  })
  const lista = (avaliacoes: object[], proximo: string | null = null) => ({
    status: 200,
    corpo: { avaliacoes, proximo },
  })
  const chamadasDaLista = () =>
    vi.mocked(fetch).mock.calls.filter(([caminho]) => caminho === '/api/avaliacoes').length

  it('mostra cada avaliação com a nota, a situação e as ações', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': lista([
        item('a3', { status: 'NA_FILA', nota: null, posicaoNaFila: 1 }),
        item('a2', { status: 'ANALISANDO', nota: null, etapa: 2 }),
        item('a1'),
        item('a0', { status: 'ERRO', nota: null }),
      ]),
    })
    abrir('/avaliacoes')

    expect(await screen.findByText('Na fila: 1 antes da sua')).toBeInTheDocument()
    expect(screen.getByText('Analisando (passo 2 de 3)')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Ver resultado de https://loja.com.br/a1' }),
    ).toHaveAttribute('href', '/avaliacoes/a1')
    expect(
      screen.getByRole('link', { name: 'Ver o motivo de https://loja.com.br/a0' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Avaliar de novo https://loja.com.br/a1' }),
    ).toHaveAttribute(
      'href',
      `/avaliacoes/nova?url=${encodeURIComponent('https://loja.com.br/a1')}`,
    )
    // sem nota: o traço aparece, e o leitor ouve "sem nota"
    expect(screen.getAllByText('sem nota')).toHaveLength(3)
    expect(screen.getByText('2 análises em andamento.')).toBeInTheDocument()
  })

  it('linha concluída tem Baixar PDF com o nome da página; pendente ou com erro não tem', async () => {
    simularApi({
      '/api/auth/eu': { status: 200, corpo: { usuario: { ...helena, planoPago: true } } },
      '/api/avaliacoes': lista([
        item('a2', { status: 'ANALISANDO', nota: null, etapa: 2 }),
        item('a1'),
        item('a0', { status: 'ERRO', nota: null }),
      ]),
    })
    abrir('/avaliacoes')

    expect(
      await screen.findByRole('button', { name: 'Baixar PDF de https://loja.com.br/a1' }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Baixar PDF/ })).toHaveLength(1)
  })

  it('erro do PDF na linha aparece num alerta fora de elemento inline (HTML válido)', async () => {
    simularApi({
      '/api/auth/eu': { status: 200, corpo: { usuario: { ...helena, planoPago: true } } },
      '/api/avaliacoes': lista([item('a1')]),
      '/api/avaliacoes/a1/pdf': { status: 429, corpo: { erro: 'Limite de relatórios.' } },
    })
    abrir('/avaliacoes')

    fireEvent.click(
      await screen.findByRole('button', { name: 'Baixar PDF de https://loja.com.br/a1' }),
    )

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Limite de relatórios.')
    expect(alerta.closest('span')).toBeNull()
  })

  it('sem plano, o aviso aparece uma vez e descreve os botões', async () => {
    simularApi({ ...logada, '/api/avaliacoes': lista([item('a2'), item('a1')]) })
    abrir('/avaliacoes')

    const botoes = await screen.findAllByRole('button', { name: /^Baixar PDF \(plano pago\)/ })
    expect(botoes).toHaveLength(2)
    expect(screen.getAllByText(/faz parte do plano pago/)).toHaveLength(1)
    for (const botao of botoes) {
      expect(botao).toHaveAttribute('aria-disabled', 'true')
      expect(botao).toHaveAccessibleDescription(/^O relatório em PDF faz parte do plano pago/)
    }
  })

  it('pergunta de novo a cada 2 s só enquanto houver pendente', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let resposta = lista([item('a1', { status: 'ANALISANDO', nota: null, etapa: 1 })])
    simularApi({ ...logada, '/api/avaliacoes': () => resposta })
    abrir('/avaliacoes')
    await screen.findByText('Analisando (passo 1 de 3)')
    const inicio = chamadasDaLista()

    resposta = lista([item('a1')])
    await vi.advanceTimersByTimeAsync(2_000)
    expect(await screen.findByText('Concluída')).toBeInTheDocument()
    expect(screen.getByText('Todas as análises terminaram.')).toBeInTheDocument()
    const depois = chamadasDaLista()
    expect(depois).toBeGreaterThan(inicio)

    await vi.advanceTimersByTimeAsync(10_000)
    expect(chamadasDaLista()).toBe(depois)
  })

  it('"Mostrar mais" traz as próximas e leva o foco à primeira linha nova', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': lista([item('a2')], 'cursor-1'),
      '/api/avaliacoes?antes=cursor-1': lista([item('a1'), item('a0')]),
    })
    abrir('/avaliacoes')

    fireEvent.click(await screen.findByRole('button', { name: 'Mostrar mais' }))

    const primeiraNova = await screen.findByRole('link', {
      name: 'Ver resultado de https://loja.com.br/a1',
    })
    await waitFor(() => expect(primeiraNova).toHaveFocus())
    expect(screen.getAllByRole('row')).toHaveLength(4) // cabeçalho e 3 linhas
    expect(screen.queryByRole('button', { name: 'Mostrar mais' })).not.toBeInTheDocument()
  })

  it('sem avaliações, diz que ainda não há nenhuma', async () => {
    simularApi({ ...logada, '/api/avaliacoes': lista([]) })
    abrir('/avaliacoes')

    expect(await screen.findByText('Você ainda não avaliou nenhuma página.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Nova avaliação' })).toHaveAttribute(
      'href',
      '/avaliacoes/nova',
    )
  })

  it('o cabeçalho de quem entrou leva ao histórico', async () => {
    simularApi({ ...logada, '/api/avaliacoes': lista([]) })
    abrir('/')

    expect(await screen.findByRole('link', { name: 'Histórico' })).toHaveAttribute(
      'href',
      '/avaliacoes',
    )
  })
})

describe('Tela 3 · sessão expirada', () => {
  it('401 ao enviar leva para /entrar', async () => {
    simularApi({
      '/api/auth/eu': { status: 200, corpo: { usuario: helena } },
      '/api/avaliacoes': { status: 401, corpo: { erro: 'Entre.' } },
    })
    abrir('/avaliacoes/nova')

    fireEvent.click(await screen.findByRole('button', { name: 'Avaliar página' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })
})

describe('Tela 4 · análise', () => {
  const logada = { '/api/auth/eu': { status: 200, corpo: { usuario: helena } } }
  const url = 'https://www.loja.com.br/'
  const base = {
    id: 'a1',
    url,
    urlFinal: null,
    status: 'ANALISANDO',
    etapa: 2,
    posicaoNaFila: null,
    paginaGrande: false,
    mensagemErro: null,
    concluidaEm: null,
    resultado: null,
  }
  // resultado no formato do GET da API (apps/api/src/analise/resultado.ts)
  const cartao = (numero: string, prioridade: string, seletores: string[]) => ({
    numero,
    nome: `Recomendação ${numero}`,
    link: 'https://emag.governoeletronico.gov.br/#s3.3',
    prioridade,
    porque: `Por que ${numero} é falha.`,
    exemplo: '<img src="a.png" alt="Logo">',
    revisaoHumana: false,
    ocorrencias: seletores.map((seletor) => ({
      descricao: 'Descrição do axe',
      seletor,
      trecho: '<img src="a.png" onerror="alert(1)">',
    })),
  })
  const resultado = {
    nota: 57,
    verificacoes: [
      { numero: '3.1', nome: 'Idioma', prioridade: 'media', peso: 2, aprovada: true },
      { numero: '3.3', nome: 'Título', prioridade: 'media', peso: 2, aprovada: true },
      { numero: '3.6', nome: 'Imagens', prioridade: 'alta', peso: 3, aprovada: false },
    ],
    cartoes: [cartao('3.6', 'alta', ['img.a', 'img.b']), cartao('1.8', 'baixa', ['main'])],
    revisao: [
      { numero: '4.4', nome: 'Foco visível', motivo: 'fixa', conferir: 'Use o Tab.', feita: false },
      { numero: '4.1', nome: 'Contraste', motivo: 'duvida', conferir: 'Confira.', feita: true },
    ],
  }
  const concluida = {
    ...base,
    status: 'CONCLUIDA',
    etapa: null,
    concluidaEm: '2026-11-19T14:32:00.000Z',
    resultado,
  }
  const resposta = (avaliacao: object) => ({ status: 200, corpo: { avaliacao } })
  const chamadasDoGet = () =>
    vi.mocked(fetch).mock.calls.filter(([caminho]) => caminho === '/api/avaliacoes/a1').length

  it('enviar a URL na Tela 3 leva à Tela 4 da avaliação criada', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': { status: 202, corpo: { avaliacoes: [{ id: 'a1' }] } },
      '/api/avaliacoes/a1': resposta(base),
    })
    abrir('/avaliacoes/nova')
    preencher('Endereço da página (URL)', url)

    fireEvent.click(await screen.findByRole('button', { name: 'Avaliar página' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Avaliando a página' }),
    ).toBeInTheDocument()
    expect(await screen.findByText(url)).toBeInTheDocument()
  })

  it('sem login, leva para /entrar', async () => {
    simularApi()
    abrir('/avaliacoes/a1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('401 da API (sessão expirou) leva para /entrar', async () => {
    simularApi({ ...logada, '/api/avaliacoes/a1': { status: 401, corpo: { erro: 'Entre.' } } })
    abrir('/avaliacoes/a1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('NA_FILA mostra quantas análises estão antes', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes/a1': resposta({ ...base, status: 'NA_FILA', etapa: null, posicaoNaFila: 2 }),
    })
    abrir('/avaliacoes/a1')

    expect(await screen.findByText('Na fila: 2 análises antes da sua.')).toBeInTheDocument()
    expect(screen.queryByRole('listitem', { current: 'step' })).not.toBeInTheDocument()
  })

  it('NA_FILA com 1 análise antes usa o singular', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes/a1': resposta({ ...base, status: 'NA_FILA', etapa: null, posicaoNaFila: 1 }),
    })
    abrir('/avaliacoes/a1')

    expect(await screen.findByText('Na fila: 1 análise antes da sua.')).toBeInTheDocument()
  })

  it('ANALISANDO marca a etapa atual com aria-current="step"', async () => {
    simularApi({ ...logada, '/api/avaliacoes/a1': resposta(base) })
    abrir('/avaliacoes/a1')

    const atual = await screen.findByRole('listitem', { current: 'step' })
    expect(atual).toHaveTextContent('Verificando as recomendações do eMAG 3.1')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('o leitor ouve só a frase do passo atual, não a lista inteira', async () => {
    simularApi({ ...logada, '/api/avaliacoes/a1': resposta(base) })
    abrir('/avaliacoes/a1')

    // a região existe vazia antes da resposta: o leitor só anuncia quando o texto muda
    const frase = await screen.findByText('Passo 2 de 3: verificando as recomendações do eMAG 3.1.')
    expect(frase.tagName).toBe('OUTPUT') // papel status: o leitor anuncia quando muda
    expect(screen.getByRole('list')).not.toHaveAttribute('aria-live')
  })

  it('pergunta de novo a cada 2 s e para quando conclui', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let avaliacao: object = base
    simularApi({ ...logada, '/api/avaliacoes/a1': () => resposta(avaliacao) })
    abrir('/avaliacoes/a1')
    await screen.findByRole('heading', { level: 1, name: 'Avaliando a página' })
    const inicio = chamadasDoGet()

    await vi.advanceTimersByTimeAsync(1_000)
    expect(chamadasDoGet()).toBe(inicio)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(chamadasDoGet()).toBe(inicio + 1)

    avaliacao = concluida
    await vi.advanceTimersByTimeAsync(2_000)
    expect(
      await screen.findByRole('heading', { level: 1, name: /^Resultado da avaliação/ }),
    ).toBeVisible()
    // o painel dos passos sai junto: nenhum anúncio do passo disputa com o foco no título
    expect(screen.queryByText(/^Passo \d de 3/)).not.toBeInTheDocument()
    const depois = chamadasDoGet()
    await vi.advanceTimersByTimeAsync(10_000)
    expect(chamadasDoGet()).toBe(depois)
  })

  it('sair da tela cancela as perguntas', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    simularApi({ ...logada, '/api/avaliacoes/a1': resposta(base) })
    abrir('/avaliacoes/a1')
    await screen.findByRole('heading', { level: 1, name: 'Avaliando a página' })

    fireEvent.click(screen.getByRole('link', { name: /AcessaWeb/ }))
    const depois = chamadasDoGet()
    await vi.advanceTimersByTimeAsync(6_000)

    expect(chamadasDoGet()).toBe(depois)
  })

  it('paginaGrande mostra o aviso de demora', async () => {
    simularApi({ ...logada, '/api/avaliacoes/a1': resposta({ ...base, paginaGrande: true }) })
    abrir('/avaliacoes/a1')

    expect(
      await screen.findByText(
        'Por ser uma página grande, a análise pode demorar mais de 1 minuto.',
      ),
    ).toBeInTheDocument()
  })

  it('sem conexão, continua perguntando e avisa para conferir a internet', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    let caiu = true
    simularApi(logada)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (caminho: string) => {
        if (caminho === '/api/auth/eu')
          return new Response(JSON.stringify({ usuario: helena }), { status: 200 })
        if (caiu) throw new TypeError('Failed to fetch')
        return new Response(JSON.stringify({ avaliacao: base }), { status: 200 })
      }),
    )
    abrir('/avaliacoes/a1')

    expect(await screen.findByRole('alert')).toHaveTextContent(/Confira sua internet/)
    caiu = false
    await vi.advanceTimersByTimeAsync(2_000)
    await waitFor(() => expect(screen.queryByText(/Confira sua internet/)).not.toBeInTheDocument())
  })

  it('ERRO mostra a mensagem da API e "Corrigir o endereço" leva à Tela 3 preenchida', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes/a1': resposta({
        ...base,
        status: 'ERRO',
        etapa: null,
        mensagemErro: 'Não conseguimos abrir essa página. Confira o endereço.',
      }),
    })
    abrir('/avaliacoes/a1')

    const titulo = await screen.findByRole('heading', {
      level: 1,
      name: 'Não conseguimos avaliar essa página.',
    })
    await waitFor(() => expect(titulo).toHaveFocus())
    expect(screen.getByText('Não conseguimos abrir essa página. Confira o endereço.')).toBeVisible()
    expect(screen.getByText('Erro')).toBeVisible()
    expect(screen.getByText(/Endereço digitado:/)).toHaveTextContent(url)
    const corrigir = screen.getByRole('link', { name: 'Corrigir o endereço' })
    expect(corrigir).toHaveAttribute('href', `/avaliacoes/nova?url=${encodeURIComponent(url)}`)

    fireEvent.click(corrigir)

    expect(await screen.findByLabelText('Endereço da página (URL)')).toHaveValue(url)
  })

  describe('Tela 5 · resultado', () => {
    it('mostra a nota, o aviso, a conta e "Nova avaliação"', async () => {
      simularApi({
        ...logada,
        '/api/avaliacoes/a1': resposta({
          ...concluida,
          urlFinal: 'https://www.loja.com.br/inicio',
        }),
      })
      abrir('/avaliacoes/a1')

      // o foco vai para o título, e o leitor ouve a nota junto
      const titulo = await screen.findByRole('heading', {
        level: 1,
        name: 'Resultado da avaliação: nota 57 de 100',
      })
      await waitFor(() => expect(titulo).toHaveFocus())
      // o número grande só aparece: o leitor já ouviu a nota no título
      expect(document.querySelector('.nota-num')).toHaveAttribute('aria-hidden', 'true')
      expect(
        screen.getByText('Não é certificação. A conclusão de conformidade é sua.'),
      ).toBeVisible()
      expect(document.querySelector('.nota .meta')).toHaveTextContent(
        '2 de 3 verificações automáticas aprovadas ·, 3 falhas em 2 requisitos ·, 2 itens para revisão humana',
      )
      expect(screen.getByText('Como chegamos a 57')).toBeInTheDocument()
      expect(screen.getByText('100 × 4 ÷ 7 = 57')).toHaveAttribute('aria-hidden', 'true')
      expect(screen.getByText('100 vezes 4, dividido por 7, igual a 57')).toHaveClass('so-leitor')
      // a tabela fica numa região que recebe o Tab
      expect(screen.getByRole('region', { name: 'Conta da nota' })).toHaveAttribute('tabindex', '0')
      expect(
        screen.getByRole('table', { name: 'Recomendações que se aplicam à página' }),
      ).toHaveAccessibleDescription(/^Nota = 100 × soma dos pesos/)
      expect(screen.getByText(/Avaliamos/)).toHaveTextContent('https://www.loja.com.br/inicio')
      expect(screen.getByRole('link', { name: 'Nova avaliação' })).toHaveAttribute(
        'href',
        '/avaliacoes/nova',
      )
    })

    it('cartões na ordem da API, com o porquê, o exemplo e o trecho só como texto', async () => {
      simularApi({ ...logada, '/api/avaliacoes/a1': resposta(concluida) })
      abrir('/avaliacoes/a1')

      // o leitor ouve "3.6, Recomendação…", sem "ponto médio"
      const cartoes = await screen.findAllByRole('heading', { level: 2 })
      expect(cartoes.map((c) => c.textContent)).toEqual([
        '3.6 ·, Recomendação 3.6',
        '1.8 ·, Recomendação 1.8',
      ])
      expect(screen.getByRole('heading', { name: '3.6, Recomendação 3.6' })).toBeInTheDocument()
      // título antes dos selos no código; "Automático" só na tela
      const cartao = cartoes[0]?.closest('li')
      expect(cartao?.textContent?.indexOf('Recomendação 3.6')).toBeLessThan(
        cartao?.textContent?.indexOf('Prioridade alta') ?? 0,
      )
      expect(screen.getAllByText('Automático')[0]?.closest('[aria-hidden="true"]')).not.toBeNull()
      expect(screen.getByText('Prioridade baixa')).toBeInTheDocument()
      expect(screen.getByText('Por que 3.6 é falha.')).toBeInTheDocument()
      // site de fora abre em outra aba, com aviso no texto do link (eMAG 1.9)
      const emag = screen.getByRole('link', {
        name: 'Ler a recomendação 3.6 no eMAG 3.1 (abre em nova aba)',
      })
      expect(emag).toHaveAttribute('target', '_blank')
      expect(emag).toHaveAttribute('rel', 'noopener noreferrer')
      expect(cartao?.querySelector('.local')).toHaveTextContent('2 ocorrências ·, img.a e mais 1')
      // o trecho da página avaliada aparece escrito, sem virar elemento
      expect(screen.getAllByText('<img src="a.png" onerror="alert(1)">')).toHaveLength(3)
      expect(document.querySelector('img[onerror]')).toBeNull()
    })

    it('abas por teclado: setas trocam e levam o foco; Home e End vão às pontas', async () => {
      simularApi({ ...logada, '/api/avaliacoes/a1': resposta(concluida) })
      abrir('/avaliacoes/a1')

      // o nome é o texto visível (WCAG 2.5.3)
      const falhas = await screen.findByRole('tab', { name: 'Falhas automáticas (2)' })
      const humana = screen.getByRole('tab', { name: 'Revisão humana (2)' })
      expect(falhas).toHaveAttribute('aria-selected', 'true')
      expect(humana).toHaveAttribute('tabindex', '-1')

      fireEvent.keyDown(falhas, { key: 'ArrowRight' })
      expect(humana).toHaveFocus()
      expect(humana).toHaveAttribute('aria-selected', 'true')
      expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Revisão humana (2)')

      fireEvent.keyDown(humana, { key: 'ArrowRight' })
      expect(falhas).toHaveFocus()
      fireEvent.keyDown(falhas, { key: 'End' })
      expect(humana).toHaveFocus()
      fireEvent.keyDown(humana, { key: 'Home' })
      expect(falhas).toHaveFocus()
    })

    it('marcar um item da revisão humana grava na API', async () => {
      const enviados = simularApi({
        ...logada,
        '/api/avaliacoes/a1': resposta(concluida),
        '/api/avaliacoes/a1/revisao': { status: 204 },
      })
      abrir('/avaliacoes/a1')
      fireEvent.click(await screen.findByRole('tab', { name: 'Revisão humana (2)' }))

      // nome curto; o que conferir (e a dúvida do axe) vem como descrição, lida depois
      const foco = screen.getByRole('checkbox', { name: /^4\.4, Foco visível$/ })
      expect(foco).toHaveAccessibleDescription('Use o Tab.')
      expect(foco).not.toBeChecked()
      const contraste = screen.getByRole('checkbox', { name: /^4\.1, Contraste$/ })
      expect(contraste).toHaveAccessibleDescription(
        '(o axe-core ficou em dúvida nesta página) Confira.',
      )
      expect(contraste).toBeChecked()

      fireEvent.click(foco)

      expect(foco).toBeChecked()
      await waitFor(() =>
        expect(enviados['/api/avaliacoes/a1/revisao']).toEqual({ numero: '4.4', feita: true }),
      )
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('enquanto o pedido roda, outro clique no mesmo item é ignorado', async () => {
      simularApi({
        ...logada,
        '/api/avaliacoes/a1': resposta(concluida),
        '/api/avaliacoes/a1/revisao': { status: 204 },
      })
      abrir('/avaliacoes/a1')
      fireEvent.click(await screen.findByRole('tab', { name: 'Revisão humana (2)' }))
      const foco = screen.getByRole('checkbox', { name: /^4\.4, Foco visível$/ })

      fireEvent.click(foco)
      fireEvent.click(foco)

      expect(foco).toBeChecked()
      await waitFor(() => {
        const pedidos = vi
          .mocked(fetch)
          .mock.calls.filter(([caminho]) => caminho === '/api/avaliacoes/a1/revisao')
        expect(pedidos).toHaveLength(1)
      })
    })

    it('se a API não gravar, a caixa volta e a mensagem aparece', async () => {
      simularApi({
        ...logada,
        '/api/avaliacoes/a1': resposta(concluida),
        '/api/avaliacoes/a1/revisao': { status: 500, corpo: { erro: 'Erro interno.' } },
      })
      abrir('/avaliacoes/a1')
      fireEvent.click(await screen.findByRole('tab', { name: 'Revisão humana (2)' }))
      const foco = screen.getByRole('checkbox', { name: /^4\.4, Foco visível$/ })

      fireEvent.click(foco)

      expect(await screen.findByRole('alert')).toHaveTextContent('Erro interno.')
      expect(foco).not.toBeChecked()
    })

    it('sem falhas automáticas, pede a revisão humana', async () => {
      simularApi({
        ...logada,
        '/api/avaliacoes/a1': resposta({ ...concluida, resultado: { ...resultado, cartoes: [] } }),
      })
      abrir('/avaliacoes/a1')

      expect(
        await screen.findByText(
          'Não encontramos falhas automáticas. Ainda assim, faça a revisão humana.',
        ),
      ).toBeInTheDocument()
      expect(screen.queryByText(/Avaliamos/)).not.toBeInTheDocument()
    })

    it('avaliação antiga, sem nota: explica e mostra os cartões mesmo assim', async () => {
      simularApi({
        ...logada,
        '/api/avaliacoes/a1': resposta({
          ...concluida,
          resultado: { ...resultado, nota: null, verificacoes: [] },
        }),
      })
      abrir('/avaliacoes/a1')

      expect(await screen.findByText(/feita antes do cálculo da nota/)).toBeInTheDocument()
      expect(screen.queryByText(/Como chegamos/)).not.toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2)
    })

    describe('Baixar PDF e contagem da revisão', () => {
      const comPlano = {
        '/api/auth/eu': { status: 200, corpo: { usuario: { ...helena, planoPago: true } } },
      }

      it('mostra Baixar PDF e a contagem da revisão', async () => {
        simularApi({ ...comPlano, '/api/avaliacoes/a1': resposta(concluida) })
        abrir('/avaliacoes/a1')

        expect(await screen.findByRole('button', { name: 'Baixar PDF' })).toBeInTheDocument()
        expect(
          screen.getByText(
            'Revisão humana: 1 de 2 itens conferidos. Os outros saem no PDF como "a conferir".',
          ),
        ).toBeInTheDocument()
      })

      it('marcar um item muda a contagem sem recarregar', async () => {
        simularApi({
          ...comPlano,
          '/api/avaliacoes/a1': resposta(concluida),
          '/api/avaliacoes/a1/revisao': { status: 204 },
        })
        abrir('/avaliacoes/a1')
        fireEvent.click(await screen.findByRole('tab', { name: 'Revisão humana (2)' }))

        fireEvent.click(screen.getByRole('checkbox', { name: /^4\.4, Foco visível$/ }))

        expect(
          await screen.findByText('Revisão humana: todos os 2 itens conferidos.'),
        ).toBeInTheDocument()
        expect(
          screen.queryByRole('button', { name: 'Ir para a revisão humana' }),
        ).not.toBeInTheDocument()
      })

      it('"Ir para a revisão humana" abre a aba e leva o foco até ela', async () => {
        simularApi({ ...comPlano, '/api/avaliacoes/a1': resposta(concluida) })
        abrir('/avaliacoes/a1')

        fireEvent.click(await screen.findByRole('button', { name: 'Ir para a revisão humana' }))

        const aba = screen.getByRole('tab', { name: 'Revisão humana (2)' })
        expect(aba).toHaveAttribute('aria-selected', 'true')
        expect(aba).toHaveFocus()
        expect(screen.getByRole('checkbox', { name: /^4\.4, Foco visível$/ })).toBeVisible()
      })

      it('Baixar PDF espera a marcação da revisão ser gravada', async () => {
        // a gravação da caixa fica pendente até o teste soltar
        let gravar: () => void = () => {}
        const ordem: string[] = []
        vi.stubGlobal(
          'fetch',
          vi.fn(async (caminho: string) => {
            ordem.push(caminho)
            if (caminho === '/api/auth/eu') {
              return new Response(JSON.stringify({ usuario: { ...helena, planoPago: true } }))
            }
            if (caminho === '/api/avaliacoes/a1') {
              return new Response(JSON.stringify({ avaliacao: concluida }))
            }
            if (caminho === '/api/avaliacoes/a1/revisao') {
              await new Promise<void>((pronto) => (gravar = pronto))
              return new Response(null, { status: 204 })
            }
            return new Response('%PDF', {
              headers: { 'Content-Disposition': 'attachment; filename="r.pdf"' },
            })
          }),
        )
        URL.createObjectURL = vi.fn<(objeto: Blob) => string>(() => 'blob:falso')
        URL.revokeObjectURL = vi.fn<(endereco: string) => void>()
        const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
        abrir('/avaliacoes/a1')
        fireEvent.click(await screen.findByRole('tab', { name: 'Revisão humana (2)' }))

        fireEvent.click(screen.getByRole('checkbox', { name: /^4\.4, Foco visível$/ }))
        fireEvent.click(screen.getByRole('button', { name: 'Baixar PDF' }))
        await new Promise((esperar) => setTimeout(esperar, 50))
        expect(ordem).not.toContain('/api/avaliacoes/a1/pdf')

        await act(async () => gravar())
        await waitFor(() => expect(clique).toHaveBeenCalled())
        expect(ordem.indexOf('/api/avaliacoes/a1/pdf')).toBeGreaterThan(
          ordem.indexOf('/api/avaliacoes/a1/revisao'),
        )
        clique.mockRestore()
      })

      it('trocar de avaliação na mesma tela não leva as marcas da anterior', async () => {
        simularApi({
          ...comPlano,
          '/api/avaliacoes/a1': resposta(concluida),
          '/api/avaliacoes/a2': resposta({
            ...concluida,
            id: 'a2',
            resultado: {
              ...resultado,
              revisao: resultado.revisao.map((item) => ({ ...item, feita: false })),
            },
          }),
        })
        // a rota /avaliacoes/:id continua montada quando só o id muda (voltar e avançar do navegador)
        function IrParaA2() {
          const navegar = useNavigate()
          return (
            <button type="button" onClick={() => void navegar('/avaliacoes/a2')}>
              ir para a2
            </button>
          )
        }
        render(
          <MemoryRouter initialEntries={['/avaliacoes/a1']}>
            <App />
            <IrParaA2 />
          </MemoryRouter>,
        )
        expect(await screen.findByText(/^Revisão humana: 1 de 2/)).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'ir para a2' }))

        expect(await screen.findByText(/^Revisão humana: 0 de 2/)).toBeInTheDocument()
      })

      it('sem plano pago, o botão aparece bloqueado', async () => {
        simularApi({ ...logada, '/api/avaliacoes/a1': resposta(concluida) })
        abrir('/avaliacoes/a1')

        expect(
          await screen.findByRole('button', { name: 'Baixar PDF (plano pago)' }),
        ).toHaveAttribute('aria-disabled', 'true')
        // quem não pode baixar não lê sobre o que sai no PDF
        expect(screen.getByText('Revisão humana: 1 de 2 itens conferidos.')).toBeInTheDocument()
        expect(screen.queryByText(/saem no PDF/)).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Ir para a revisão humana' })).toBeInTheDocument()
      })
    })
  })

  it('404 mostra "Avaliação não encontrada."', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes/a1': { status: 404, corpo: { erro: 'Avaliação não encontrada.' } },
    })
    abrir('/avaliacoes/a1')

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Avaliação não encontrada.' }),
    ).toBeInTheDocument()
  })
})

describe('barra de acessibilidade (eMAG 3.1, seção 4.3)', () => {
  const raiz = document.documentElement
  // simula o tema do sistema (o jsdom não tem matchMedia); trocar() avisa quem escuta, como o navegador
  function sistemaEm(escuro: boolean) {
    const ouvintes = new Set<() => void>()
    const consulta = {
      matches: escuro,
      addEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.add(ouvinte),
      removeEventListener: (_tipo: string, ouvinte: () => void) => ouvintes.delete(ouvinte),
    }
    vi.stubGlobal('matchMedia', () => consulta)
    return {
      trocar(novo: boolean) {
        consulta.matches = novo
        act(() => ouvintes.forEach((ouvinte) => ouvinte()))
      },
    }
  }

  it('o sistema muda de tema com a página aberta: "Modo escuro" acompanha', () => {
    const sistema = sistemaEm(false)
    simularApi()
    abrir('/')
    const botao = screen.getByRole('button', { name: 'Modo escuro' })
    expect(botao).toHaveAttribute('aria-pressed', 'false')

    sistema.trocar(true)
    expect(botao).toHaveAttribute('aria-pressed', 'true')
  })

  it('"Ir para o menu [2]" tem destino mesmo enquanto a sessão carrega', () => {
    // /api/auth/eu nunca responde
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    abrir('/')
    expect(document.getElementById('menu')).not.toBeNull()
  })

  beforeEach(() => {
    localStorage.clear()
    delete raiz.dataset.theme
  })

  it('"Alto contraste" liga e desliga o tema e guarda a escolha', () => {
    simularApi()
    abrir('/')
    const botao = screen.getByRole('button', { name: 'Alto contraste' })
    expect(botao).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(botao)
    expect(botao).toHaveAttribute('aria-pressed', 'true')
    expect(raiz.dataset.theme).toBe('contraste')
    expect(localStorage.getItem('acessaweb-contraste')).toBe('sim')

    fireEvent.click(botao)
    expect(botao).toHaveAttribute('aria-pressed', 'false')
    expect(raiz.dataset.theme).toBeUndefined()
    expect(localStorage.getItem('acessaweb-contraste')).toBeNull()
  })

  it('"Modo escuro" com o sistema claro liga o escuro', () => {
    sistemaEm(false)
    simularApi()
    abrir('/')
    const botao = screen.getByRole('button', { name: 'Modo escuro' })
    expect(botao).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(botao)
    expect(botao).toHaveAttribute('aria-pressed', 'true')
    expect(raiz.dataset.theme).toBe('escuro')
    expect(localStorage.getItem('acessaweb-tema')).toBe('escuro')
  })

  it('"Modo escuro" com o sistema escuro já começa ligado e o clique vai para o claro', () => {
    sistemaEm(true)
    simularApi()
    abrir('/')
    const botao = screen.getByRole('button', { name: 'Modo escuro' })
    expect(botao).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(botao)
    expect(botao).toHaveAttribute('aria-pressed', 'false')
    expect(raiz.dataset.theme).toBe('claro')
    expect(localStorage.getItem('acessaweb-tema')).toBe('claro')
  })

  it('com o contraste ligado, "Modo escuro" não fica pressionado e o clique sai do contraste', () => {
    sistemaEm(false)
    localStorage.setItem('acessaweb-contraste', 'sim')
    simularApi()
    abrir('/')
    const escuro = screen.getByRole('button', { name: 'Modo escuro' })
    expect(escuro).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(escuro)
    expect(raiz.dataset.theme).toBe('escuro')
    expect(escuro).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Alto contraste' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('atalhos para o conteúdo, o menu e o rodapé com as teclas 1, 2 e 4', () => {
    simularApi()
    abrir('/')
    const atalhos = [
      ['Ir para o conteúdo [1]', '#conteudo', '1'],
      ['Ir para o menu [2]', '#menu', '2'],
      ['Ir para o rodapé [4]', '#rodape', '4'],
    ]
    for (const [nome, destino, tecla] of atalhos) {
      const link = screen.getByRole('link', { name: nome })
      expect(link).toHaveAttribute('href', destino)
      expect(link).toHaveAttribute('accesskey', tecla)
    }
    expect(document.getElementById('rodape')?.tagName).toBe('FOOTER')
  })

  it('o link "Acessibilidade" abre a página com os recursos (eMAG 4.5)', () => {
    simularApi()
    abrir('/')
    fireEvent.click(screen.getByRole('link', { name: 'Acessibilidade' }))

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Acessibilidade')
    expect(screen.getByRole('heading', { name: 'Atalhos de teclado' })).toBeInTheDocument()
  })
})
