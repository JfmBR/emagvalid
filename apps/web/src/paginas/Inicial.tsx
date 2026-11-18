import { Link } from 'react-router'
import { Aviso } from '../componentes/Aviso.tsx'
import { useSessao } from '../sessao.tsx'

// Tela 1 · Inicial. Texto do protótipo beta (projeto/docs/prototipo/beta/), sem o que fica fora do MVP.
export function Inicial() {
  const { usuario, carregando } = useSessao()

  return (
    <div className="tela">
      <title>AcessaWeb</title>
      <div className="cabeca">
        <p className="sobre">Mais inclusão, mais oportunidades.</p>
        <h1>Acessibilidade digital, com orientação para quem precisa fazer acontecer.</h1>
        <p>
          Analisamos a página do seu site com base no eMAG 3.1, mostramos as barreiras de acesso e
          sugerimos como corrigir cada uma.
        </p>
      </div>
      <Aviso>
        <p>
          A nota e as orientações complementam a avaliação humana. Não são certificação de
          conformidade.
        </p>
      </Aviso>
      {carregando ? null : usuario ? (
        <p className="acoes">
          <Link className="btn" to="/avaliacoes/nova">
            Nova avaliação
          </Link>
        </p>
      ) : (
        <p className="acoes">
          <Link className="btn" to="/cadastro">
            Criar conta
          </Link>
          <Link className="btn sec" to="/entrar">
            Entrar
          </Link>
        </p>
      )}
    </div>
  )
}
