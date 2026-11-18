// Escolha de tema da barra de acessibilidade (eMAG 3.1, seções 4.2 e 4.3), guardada no navegador.
// O CSS de cada tema vem de design-system/tokens.css, pelo data-theme do <html>.

export type Preferencias = { contraste: boolean; tema: 'claro' | 'escuro' | null }

const CHAVE_CONTRASTE = 'acessaweb-contraste'
const CHAVE_TEMA = 'acessaweb-tema'

// Aba anônima ou site bloqueado: o localStorage lança erro; a escolha vale só nesta visita
function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    // sem armazenamento: segue sem salvar
  }
}

export function lerPreferencias(): Preferencias {
  const tema = ler(CHAVE_TEMA)
  return {
    contraste: ler(CHAVE_CONTRASTE) === 'sim',
    tema: tema === 'claro' || tema === 'escuro' ? tema : null,
  }
}

export function salvarPreferencias({ contraste, tema }: Preferencias) {
  gravar(CHAVE_CONTRASTE, contraste ? 'sim' : null)
  gravar(CHAVE_TEMA, tema)
}

// O contraste vence; sem escolha, a página segue o tema do sistema
export function temaDaPagina({ contraste, tema }: Preferencias) {
  return contraste ? 'contraste' : tema
}

export function aplicarTema(preferencias: Preferencias) {
  const tema = temaDaPagina(preferencias)
  if (tema) document.documentElement.dataset.theme = tema
  else delete document.documentElement.dataset.theme
}

export function sistemaEscuro() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}
