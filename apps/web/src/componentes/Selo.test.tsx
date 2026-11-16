import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Selo } from './Selo.tsx'

describe('Selo', () => {
  it('mostra o texto do significado junto com a cor da variante', () => {
    render(<Selo variante="alta">Prioridade alta</Selo>)

    expect(screen.getByText('Prioridade alta')).toHaveClass('selo', 'alta')
  })
})
