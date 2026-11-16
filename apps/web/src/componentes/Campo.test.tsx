import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Campo } from './Campo.tsx'

describe('Campo', () => {
  it('liga o rótulo e a dica ao campo', () => {
    render(<Campo rotulo="E-mail" dica="Use o e-mail da empresa." type="email" />)

    const campo = screen.getByLabelText('E-mail')
    expect(campo).toHaveAccessibleDescription('Use o e-mail da empresa.')
    expect(campo).not.toBeInvalid()
  })

  it('com erro, marca o campo como inválido e lê o erro junto com a dica', () => {
    render(
      <Campo
        rotulo="E-mail"
        dica="Use o e-mail da empresa."
        erro="Digite um e-mail válido, como nome@empresa.com.br."
      />,
    )

    const campo = screen.getByLabelText('E-mail')
    expect(campo).toBeInvalid()
    expect(campo).toHaveAccessibleDescription(
      'Use o e-mail da empresa. Digite um e-mail válido, como nome@empresa.com.br.',
    )
  })

  it('mantém a dica quando quem usa o campo passa outra descrição', () => {
    render(
      <>
        <p id="regra">Mínimo de 8 caracteres.</p>
        <Campo rotulo="Senha" dica="Use letras e números." aria-describedby="regra" />
      </>,
    )

    expect(screen.getByLabelText('Senha')).toHaveAccessibleDescription(
      'Mínimo de 8 caracteres. Use letras e números.',
    )
  })
})
