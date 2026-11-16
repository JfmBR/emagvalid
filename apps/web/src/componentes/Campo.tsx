import { useId, type InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  rotulo: string
  dica?: string
  // texto do erro com o próximo passo (RF17); quando existe, o campo fica inválido
  erro?: string
}

// Rótulo visível, dica e erro ligados ao campo (design-system/components/Field)
export function Campo({
  rotulo,
  dica,
  erro,
  id,
  'aria-describedby': descricaoExtra,
  ...props
}: Props) {
  const idGerado = useId()
  const idCampo = id ?? idGerado
  const idDica = `${idCampo}-dica`
  const idErro = `${idCampo}-erro`
  // junta a descrição que vier de fora com a dica e o erro, sem perder nenhuma
  const descricao = [descricaoExtra, dica ? idDica : '', erro ? idErro : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className="campo" data-erro={erro ? '' : undefined}>
      <label htmlFor={idCampo}>{rotulo}</label>
      <input
        id={idCampo}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao || undefined}
        {...props}
      />
      {dica ? (
        <p className="dica" id={idDica}>
          {dica}
        </p>
      ) : null}
      {erro ? (
        <p className="erro-campo" id={idErro}>
          {erro}
        </p>
      ) : null}
    </div>
  )
}
