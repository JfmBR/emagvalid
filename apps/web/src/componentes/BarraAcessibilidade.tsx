import { useEffect, useState, useSyncExternalStore, type MouseEvent } from 'react'
import { Link } from 'react-router'
import {
  aplicarTema,
  assinarSistema,
  lerPreferencias,
  salvarPreferencias,
  sistemaEscuro,
  type Preferencias,
} from '../tema.ts'
import { Botao } from './Botao.tsx'

// tecla (e.code, igual com ou sem Shift) → destino do atalho
const ATALHOS: Record<string, string> = {
  Digit1: 'conteudo',
  Numpad1: 'conteudo',
  Digit2: 'menu',
  Numpad2: 'menu',
  Digit4: 'rodape',
  Numpad4: 'rodape',
}

// Leva o foco ao destino e marca o contorno: o foco por clique ou por script não ganha o
// :focus-visible, e sem contorno parece que o link não fez nada. A marca sai quando o foco sai.
function irPara(id: string) {
  const alvo = document.getElementById(id)
  if (!alvo) return
  alvo.dataset.atalho = ''
  alvo.addEventListener('blur', () => delete alvo.dataset.atalho, { once: true })
  alvo.focus()
}

function editavel(alvo: EventTarget | null) {
  return (
    alvo instanceof HTMLElement &&
    (alvo.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(alvo.tagName))
  )
}

// Barra de acessibilidade do eMAG 3.1 (seção 4.3): atalhos (4.1), alto contraste (4.2) e a página
// de acessibilidade (4.5). Sem busca no site, não há atalho 3; sem A+/A- (eMAG 1.3: zoom do navegador).
// O jsx-a11y desaconselha accesskey (pode colidir com atalhos do leitor de tela), mas o eMAG 4.1 pede
// as teclas 1, 2 e 4, e o AcessaWeb avalia pelo eMAG; os links também funcionam sem a tecla.
/* oxlint-disable jsx-a11y/no-access-key */
export function BarraAcessibilidade() {
  const [preferencias, setPreferencias] = useState(lerPreferencias)
  // acompanha o sistema mesmo com a página aberta (modo noturno automático)
  const sistema = useSyncExternalStore(assinarSistema, sistemaEscuro)
  // com o contraste ligado a tela não está escura: "Modo escuro" não aparece pressionado
  const escuro =
    !preferencias.contraste &&
    (preferencias.tema === 'escuro' || (preferencias.tema === null && sistema))

  function mudar(novas: Preferencias) {
    salvarPreferencias(novas)
    aplicarTema(novas)
    setPreferencias(novas)
  }

  // Alt + número (com ou sem Shift) pela página: no Chrome e no Firefox do Linux, Alt + número troca
  // de aba antes de chegar ao accesskey. O accesskey fica para o Mac (Ctrl + Option + número).
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      const destino = ATALHOS[evento.code]
      if (!destino || !evento.altKey || evento.ctrlKey || evento.metaKey) return
      if (editavel(evento.target)) return
      evento.preventDefault()
      irPara(destino)
    }
    // outra aba mudou o tema: esta acompanha
    function aoGuardar(evento: StorageEvent) {
      if (evento.key !== null && !evento.key.startsWith('acessaweb-')) return
      const salvas = lerPreferencias()
      aplicarTema(salvas)
      setPreferencias(salvas)
    }
    window.addEventListener('keydown', aoTeclar)
    window.addEventListener('storage', aoGuardar)
    return () => {
      window.removeEventListener('keydown', aoTeclar)
      window.removeEventListener('storage', aoGuardar)
    }
  }, [])

  function pular(evento: MouseEvent<HTMLAnchorElement>, id: string) {
    evento.preventDefault()
    irPara(id)
  }

  return (
    <nav className="barra-acessibilidade" aria-label="Acessibilidade">
      <div className="wrap">
        <a href="#conteudo" accessKey="1" onClick={(e) => pular(e, 'conteudo')}>
          Ir para o conteúdo [1]
        </a>
        <a href="#menu" accessKey="2" onClick={(e) => pular(e, 'menu')}>
          Ir para o menu [2]
        </a>
        <a href="#rodape" accessKey="4" onClick={(e) => pular(e, 'rodape')}>
          Ir para o rodapé [4]
        </a>
        <span className="barra-opcoes">
          <Botao
            variante="txt"
            aria-pressed={preferencias.contraste}
            onClick={() => mudar({ ...preferencias, contraste: !preferencias.contraste })}
          >
            Alto contraste
          </Botao>
          <Botao
            variante="txt"
            aria-pressed={escuro}
            onClick={() => {
              // quando a escolha fica igual ao sistema, volta a seguir o sistema
              const tema = escuro ? 'claro' : 'escuro'
              mudar({ contraste: false, tema: (tema === 'escuro') === sistema ? null : tema })
            }}
          >
            Modo escuro
          </Botao>
          <Link to="/acessibilidade">Acessibilidade</Link>
        </span>
      </div>
    </nav>
  )
}
