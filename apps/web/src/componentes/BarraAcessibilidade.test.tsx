import { act, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BarraAcessibilidade } from './BarraAcessibilidade.tsx'

// sistema claro ou escuro, como o navegador informa pelo matchMedia
function sistema(escuro: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: escuro,
      addEventListener: vi.fn<() => void>(),
      removeEventListener: vi.fn<() => void>(),
    })),
  )
}

// a barra e os três destinos dos atalhos, como no Layout
function abrir() {
  render(
    <MemoryRouter>
      <BarraAcessibilidade />
      <nav id="menu" tabIndex={-1} aria-label="Principal" />
      <main id="conteudo" tabIndex={-1}>
        <input aria-label="Endereço" />
      </main>
      <footer id="rodape" tabIndex={-1} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
  sistema(false)
})
afterEach(() => vi.unstubAllGlobals())

describe('atalhos', () => {
  it('Alt + 4 e Alt + Shift + 2 levam o foco ao destino, com a marca do contorno', () => {
    abrir()
    fireEvent.keyDown(window, { code: 'Digit4', key: '4', altKey: true })
    const rodape = document.getElementById('rodape')!
    expect(rodape).toHaveFocus()
    expect(rodape).toHaveAttribute('data-atalho')

    fireEvent.keyDown(window, { code: 'Digit2', key: '@', altKey: true, shiftKey: true })
    expect(document.getElementById('menu')).toHaveFocus()
    // o foco saiu: a marca sai junto
    expect(rodape).not.toHaveAttribute('data-atalho')
  })

  it('o número sem Alt, ou com Ctrl, não é atalho', () => {
    abrir()
    fireEvent.keyDown(window, { code: 'Digit4', key: '4' })
    fireEvent.keyDown(window, { code: 'Digit4', key: '4', altKey: true, ctrlKey: true })
    expect(document.getElementById('rodape')).not.toHaveFocus()
  })

  it('dentro de um campo de texto o atalho não age (no Mac, Option + 4 digita ¢)', () => {
    abrir()
    const campo = screen.getByRole('textbox', { name: 'Endereço' })
    campo.focus()
    fireEvent.keyDown(campo, { code: 'Digit4', key: '¢', altKey: true })
    expect(campo).toHaveFocus()
  })

  it('o clique no link leva o foco ao destino', () => {
    abrir()
    fireEvent.click(screen.getByRole('link', { name: 'Ir para o conteúdo [1]' }))
    expect(document.getElementById('conteudo')).toHaveFocus()
  })
})

describe('modo escuro', () => {
  it('com o sistema escuro, desligar e ligar de novo volta a seguir o sistema', () => {
    sistema(true)
    abrir()
    const botao = screen.getByRole('button', { name: 'Modo escuro' })
    expect(botao).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(botao)
    expect(localStorage.getItem('acessaweb-tema')).toBe('claro')
    expect(botao).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(botao)
    expect(localStorage.getItem('acessaweb-tema')).toBeNull()
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(botao).toHaveAttribute('aria-pressed', 'true')
  })

  it('com o sistema claro, ligar guarda escuro; desligar volta a seguir o sistema', () => {
    abrir()
    const botao = screen.getByRole('button', { name: 'Modo escuro' })
    fireEvent.click(botao)
    expect(localStorage.getItem('acessaweb-tema')).toBe('escuro')
    fireEvent.click(botao)
    expect(localStorage.getItem('acessaweb-tema')).toBeNull()
  })
})

it('outra aba liga o alto contraste: esta acompanha', () => {
  abrir()
  localStorage.setItem('acessaweb-contraste', 'sim')
  act(() => {
    window.dispatchEvent(new StorageEvent('storage', { key: 'acessaweb-contraste' }))
  })
  expect(document.documentElement.dataset.theme).toBe('contraste')
  expect(screen.getByRole('button', { name: 'Alto contraste' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
