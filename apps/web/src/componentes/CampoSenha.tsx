import { useId, useState, type ComponentProps } from 'react'
import { Campo } from './Campo.tsx'

type Props = Omit<ComponentProps<typeof Campo>, 'type'>

// Campo de senha com "Mostrar senha" (Tela 2): ajuda quem digita devagar ou usa leitor de tela
export function CampoSenha(props: Props) {
  const [visivel, setVisivel] = useState(false)
  const idMostrar = useId()

  return (
    <div className="campo">
      <Campo {...props} type={visivel ? 'text' : 'password'} spellCheck={false} />
      <label className="mostrar-senha" htmlFor={idMostrar}>
        <input
          id={idMostrar}
          type="checkbox"
          checked={visivel}
          onChange={(evento) => setVisivel(evento.target.checked)}
        />
        Mostrar senha
      </label>
    </div>
  )
}
