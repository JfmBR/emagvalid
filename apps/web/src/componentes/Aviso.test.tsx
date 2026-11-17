import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Aviso } from './Aviso.tsx'

describe('Aviso', () => {
  it('é uma nota fixa por padrão, com o ícone escondido do leitor de tela', () => {
    render(<Aviso>Não é certificação.</Aviso>)

    const aviso = screen.getByRole('note')
    expect(aviso).toHaveTextContent('Não é certificação.')
    expect(aviso.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('aviso que aparece por uma ação é anunciado como status', () => {
    render(
      <Aviso tipo="alerta" papel="status">
        2 orientações sem revisão.
      </Aviso>,
    )

    expect(screen.getByRole('status')).toHaveClass('aviso', 'alerta')
  })
})
