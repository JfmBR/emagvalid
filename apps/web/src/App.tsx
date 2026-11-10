import { useEffect, useState } from 'react'

type EstadoApi = 'verificando' | 'ok' | 'indisponivel'

const textoEstado: Record<EstadoApi, string> = {
  verificando: 'Verificando a conexão com a API…',
  ok: 'API conectada.',
  indisponivel: 'API indisponível. Confira se ela está rodando (npm run dev:api).',
}

// Tela provisória: só confirma que o front-end fala com a API.
// As telas do MVP seguem o protótipo em projeto/docs/prototipo/.
export default function App() {
  const [estado, setEstado] = useState<EstadoApi>('verificando')

  useEffect(() => {
    fetch('/api/saude')
      .then((resposta) => setEstado(resposta.ok ? 'ok' : 'indisponivel'))
      .catch(() => setEstado('indisponivel'))
  }, [])

  return (
    <>
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="cabecalho">
        <p className="marca">emagvalid</p>
      </header>
      <main id="conteudo" tabIndex={-1}>
        <h1>Auditoria de acessibilidade pelo eMAG 3.1</h1>
        <p>
          A nota e as orientações complementam a avaliação humana. Não são certificação de
          conformidade.
        </p>
        {/* <output> é anunciado pelo leitor de tela quando o texto muda */}
        <output className="estado-api">{textoEstado[estado]}</output>
      </main>
    </>
  )
}
