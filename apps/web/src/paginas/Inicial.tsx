import { useEffect, useState } from 'react'
import { Aviso } from '../componentes/Aviso.tsx'

type EstadoApi = 'verificando' | 'ok' | 'indisponivel'

const textoEstado: Record<EstadoApi, string> = {
  verificando: 'Verificando a conexão com a API…',
  ok: 'API conectada.',
  indisponivel: 'API indisponível. Confira se ela está rodando (npm run dev:api).',
}

// Tela 1 provisória: confirma que o front-end fala com a API ("API conectada." é a conferência
// da publicação em docs/instalacao.md). O conteúdo da Tela 1 entra no Passo 5.
export function Inicial() {
  const [estado, setEstado] = useState<EstadoApi>('verificando')

  useEffect(() => {
    fetch('/api/saude')
      .then((resposta) => setEstado(resposta.ok ? 'ok' : 'indisponivel'))
      .catch(() => setEstado('indisponivel'))
  }, [])

  return (
    <div className="tela">
      <title>AcessaWeb</title>
      <h1>Auditoria de acessibilidade pelo eMAG 3.1</h1>
      <Aviso>
        <p>
          A nota e as orientações complementam a avaliação humana. Não são certificação de
          conformidade.
        </p>
      </Aviso>
      {/* <output> é anunciado pelo leitor de tela quando o texto muda */}
      <output className="estado-api">{textoEstado[estado]}</output>
    </div>
  )
}
