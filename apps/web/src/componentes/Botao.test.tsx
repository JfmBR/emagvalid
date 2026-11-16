import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Botao } from './Botao.tsx'

describe('Botao', () => {
  it('não envia formulário sem querer: o tipo padrão é "button"', () => {
    render(<Botao>Avaliar página</Botao>)

    const botao = screen.getByRole('button', { name: 'Avaliar página' })
    expect(botao).toHaveAttribute('type', 'button')
    expect(botao).toHaveClass('btn')
  })

  it('aplica a variante do design-system', () => {
    render(<Botao variante="perigo">Descartar</Botao>)

    expect(screen.getByRole('button', { name: 'Descartar' })).toHaveClass('btn', 'perigo')
  })
})
