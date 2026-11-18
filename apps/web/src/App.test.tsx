import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router'
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
// com o tempo); o resto responde 401 (ninguém entrou)
function simularApi(rotas: Record<string, RespostaFalsa | (() => RespostaFalsa)> = {}) {
  const enviados: Record<string, unknown> = {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      if (opcoes?.body) enviados[caminho] = JSON.parse(String(opcoes.body))
      const rota = rotas[caminho]
      const { status, corpo } = (typeof rota === 'function' ? rota() : rota) ?? {
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
    falhas: [],
  }
  const falha = (requisitoEmag: string) => ({
    requisitoEmag,
    descricao: 'Descrição',
    prioridade: 'ALTA',
    seletor: 'img',
    trecho: '<img>',
    revisaoHumana: false,
  })
  const resposta = (avaliacao: object) => ({ status: 200, corpo: { avaliacao } })
  const chamadasDoGet = () =>
    vi.mocked(fetch).mock.calls.filter(([caminho]) => caminho === '/api/avaliacoes/a1').length

  it('enviar a URL na Tela 3 leva à Tela 4 da avaliação criada', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes': { status: 202, corpo: { avaliacao: { id: 'a1' } } },
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
    expect(screen.getByRole('list')).toHaveAttribute('aria-live', 'polite')
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

    avaliacao = { ...base, status: 'CONCLUIDA', etapa: null, falhas: [falha('3.5.1')] }
    await vi.advanceTimersByTimeAsync(2_000)
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Análise concluída' }),
    ).toBeVisible()
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

  it('CONCLUIDA mostra o resumo e "Nova avaliação"', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes/a1': resposta({
        ...base,
        status: 'CONCLUIDA',
        etapa: null,
        urlFinal: 'https://www.loja.com.br/inicio',
        falhas: [falha('3.5.1'), falha('3.5.1'), falha('1.2')],
      }),
    })
    abrir('/avaliacoes/a1')

    const titulo = await screen.findByRole('heading', { level: 1, name: 'Análise concluída' })
    await waitFor(() => expect(titulo).toHaveFocus())
    expect(
      screen.getByText('Encontramos 3 falhas em 2 recomendações do eMAG 3.1.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Avaliamos/)).toHaveTextContent('https://www.loja.com.br/inicio')
    expect(screen.getByRole('link', { name: 'Nova avaliação' })).toHaveAttribute(
      'href',
      '/avaliacoes/nova',
    )
  })

  it('CONCLUIDA sem falhas pede a revisão humana', async () => {
    simularApi({
      ...logada,
      '/api/avaliacoes/a1': resposta({ ...base, status: 'CONCLUIDA', etapa: null }),
    })
    abrir('/avaliacoes/a1')

    expect(
      await screen.findByText(
        'Não encontramos falhas automáticas. Ainda assim, faça a revisão humana.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Avaliamos/)).not.toBeInTheDocument()
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
  // simula o tema do sistema (o jsdom não tem matchMedia)
  function sistemaEm(escuro: boolean) {
    vi.stubGlobal('matchMedia', (consulta: string) => ({ matches: escuro, media: consulta }))
  }

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
