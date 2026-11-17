import { fireEvent, render, screen } from '@testing-library/react'
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

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra o título e avisa que a nota não é certificação', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    abrir('/')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('eMAG 3.1')
    expect(screen.getByRole('note')).toHaveTextContent(/Não são certificação/)
  })

  it('informa quando a API está conectada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))),
    )
    abrir('/')

    expect(await screen.findByText('API conectada.')).toBeInTheDocument()
  })

  it('endereço desconhecido mostra "Página não encontrada"', () => {
    abrir('/nao-existe')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Página não encontrada')
  })

  it('ao trocar de tela, o foco vai para o h1 da tela nova', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    abrir('/nao-existe')
    // na primeira carga o foco não é movido
    expect(screen.getByRole('heading', { level: 1 })).not.toHaveFocus()

    fireEvent.click(screen.getByRole('link', { name: 'Voltar para o início' }))

    const titulo = screen.getByRole('heading', { level: 1 })
    expect(titulo).toHaveTextContent('eMAG 3.1')
    expect(titulo).toHaveFocus()
  })
})
