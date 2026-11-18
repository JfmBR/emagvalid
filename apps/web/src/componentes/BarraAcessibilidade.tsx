import { useState } from 'react'
import { Link } from 'react-router'
import {
  aplicarTema,
  lerPreferencias,
  salvarPreferencias,
  sistemaEscuro,
  type Preferencias,
} from '../tema.ts'
import { Botao } from './Botao.tsx'

// Barra de acessibilidade do eMAG 3.1 (seção 4.3): atalhos (4.1), alto contraste (4.2) e a página
// de acessibilidade (4.5). Sem busca no site, não há atalho 3; sem A+/A- (eMAG 1.3: zoom do navegador).
// O jsx-a11y desaconselha accesskey (pode colidir com atalhos do leitor de tela), mas o eMAG 4.1 pede
// as teclas 1, 2 e 4, e o AcessaWeb avalia pelo eMAG; os links também funcionam sem a tecla.
/* oxlint-disable jsx-a11y/no-access-key */
export function BarraAcessibilidade() {
  const [preferencias, setPreferencias] = useState(lerPreferencias)
  // com o contraste ligado a tela não está escura: "Modo escuro" não aparece pressionado
  const escuro =
    !preferencias.contraste &&
    (preferencias.tema === 'escuro' || (preferencias.tema === null && sistemaEscuro()))

  function mudar(novas: Preferencias) {
    salvarPreferencias(novas)
    aplicarTema(novas)
    setPreferencias(novas)
  }

  return (
    <nav className="barra-acessibilidade" aria-label="Acessibilidade">
      <div className="wrap">
        <a href="#conteudo" accessKey="1">
          Ir para o conteúdo [1]
        </a>
        <a href="#menu" accessKey="2">
          Ir para o menu [2]
        </a>
        <a href="#rodape" accessKey="4">
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
            onClick={() => mudar({ contraste: false, tema: escuro ? 'claro' : 'escuro' })}
          >
            Modo escuro
          </Botao>
          <Link to="/acessibilidade">Acessibilidade</Link>
        </span>
      </div>
    </nav>
  )
}
