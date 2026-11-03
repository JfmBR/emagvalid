import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App.tsx'

describe('App', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mostra o título e avisa que a nota não é certificação', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    )
    render(<App />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('eMAG 3.1')
    expect(screen.getByText(/Não são certificação/)).toBeInTheDocument()
  })

  it('informa quando a API está conectada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))),
    )
    render(<App />)

    expect(await screen.findByText('API conectada.')).toBeInTheDocument()
  })
})
