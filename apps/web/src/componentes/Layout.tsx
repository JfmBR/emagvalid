import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import { enviar } from '../api.ts'
import { useSessao } from '../sessao.tsx'
import { BarraAcessibilidade } from './BarraAcessibilidade.tsx'
import { Botao } from './Botao.tsx'

const iconeMarca = (
  <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
    <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)" />
    <path
      d="M8 14.5l4 4 8-9"
      stroke="var(--accent-ink)"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

// Estrutura comum das telas (design-system/components/AppHeader)
export function Layout() {
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const { usuario, carregando, definirUsuario } = useSessao()
  const principal = useRef<HTMLElement>(null)
  const rotaAnterior = useRef(pathname)

  function focarTitulo() {
    const titulo = principal.current?.querySelector('h1')
    if (!titulo) return
    titulo.setAttribute('tabindex', '-1')
    titulo.focus()
  }

  // Ao trocar de tela, o foco vai para o h1, para o leitor de tela anunciar a tela nova.
  // Na primeira carga o foco fica no começo da página, como o navegador faz. Comparar com a rota
  // anterior (e não marcar "primeira vez") funciona mesmo com o StrictMode rodando o efeito duas vezes.
  useEffect(() => {
    if (rotaAnterior.current === pathname) return
    rotaAnterior.current = pathname
    focarTitulo()
  }, [pathname])

  async function sair() {
    const { status } = await enviar('/api/auth/sair')
    if (status !== 204) return
    definirUsuario(null)
    // o botão Sair some da tela: o foco vai para o título, mesmo sem trocar de rota
    if (pathname === '/') focarTitulo()
    else void navegar('/')
  }

  return (
    <>
      <BarraAcessibilidade />
      <header className="topo">
        <div className="wrap">
          <Link className="marca" to="/" translate="no">
            {iconeMarca}
            AcessaWeb
          </Link>
          {/* o nav existe sempre: é o destino do atalho "Ir para o menu [2]"; só o conteúdo espera a sessão */}
          <nav id="menu" tabIndex={-1} aria-label="Principal">
            {carregando ? null : usuario ? (
              <>
                <span className="ola">Olá, {usuario.nome.split(' ')[0]}</span>
                <Link className="btn txt" to="/avaliacoes">
                  Histórico
                </Link>
                <Link className="btn txt" to="/conta">
                  Minha conta
                </Link>
                <Botao variante="txt" onClick={() => void sair()}>
                  Sair
                </Botao>
              </>
            ) : (
              <Link className="btn txt" to="/entrar">
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="wrap" ref={principal}>
        <Outlet />
      </main>
      <footer id="rodape" tabIndex={-1} className="wrap rodape">
        <Link to="/privacidade">Privacidade</Link>
      </footer>
    </>
  )
}
