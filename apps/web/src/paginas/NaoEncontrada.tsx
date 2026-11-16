import { Link } from 'react-router'

export function NaoEncontrada() {
  return (
    <div className="tela">
      <title>Página não encontrada · AcessaWeb</title>
      <h1>Página não encontrada</h1>
      <p>Confira se o endereço está certo ou volte para o início.</p>
      <p>
        <Link className="btn" to="/">
          Voltar para o início
        </Link>
      </p>
    </div>
  )
}
