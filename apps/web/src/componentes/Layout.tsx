import { useEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router'

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

// Estrutura comum das telas (design-system/components/AppHeader). A navegação entra com o login (Passo 5).
export function Layout() {
  const { pathname } = useLocation()
  const principal = useRef<HTMLElement>(null)
  const rotaAnterior = useRef(pathname)

  // Ao trocar de tela, o foco vai para o h1, para o leitor de tela anunciar a tela nova.
  // Na primeira carga o foco fica no começo da página, como o navegador faz. Comparar com a rota
  // anterior (e não marcar "primeira vez") funciona mesmo com o StrictMode rodando o efeito duas vezes.
  useEffect(() => {
    if (rotaAnterior.current === pathname) return
    rotaAnterior.current = pathname
    const titulo = principal.current?.querySelector('h1')
    if (!titulo) return
    titulo.setAttribute('tabindex', '-1')
    titulo.focus()
  }, [pathname])

  return (
    <>
      <a className="pular" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="topo">
        <div className="wrap">
          <Link className="marca" to="/" translate="no">
            {iconeMarca}
            AcessaWeb
          </Link>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="wrap" ref={principal}>
        <Outlet />
      </main>
    </>
  )
}
