import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { aplicarTema, lerPreferencias, salvarPreferencias, temaDaPagina } from './tema.ts'

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})
afterEach(() => vi.restoreAllMocks())

describe('temaDaPagina', () => {
  it('o alto contraste vence a escolha de claro ou escuro', () => {
    expect(temaDaPagina({ contraste: true, tema: 'escuro' })).toBe('contraste')
  })

  it('sem escolha, a página segue o sistema', () => {
    expect(temaDaPagina({ contraste: false, tema: null })).toBeNull()
  })

  it('sem contraste, vale a escolha salva', () => {
    expect(temaDaPagina({ contraste: false, tema: 'claro' })).toBe('claro')
  })
})

describe('preferências no navegador', () => {
  it('o que se salva se lê de volta', () => {
    salvarPreferencias({ contraste: true, tema: 'claro' })
    expect(lerPreferencias()).toEqual({ contraste: true, tema: 'claro' })
  })

  it('desligar remove as chaves', () => {
    salvarPreferencias({ contraste: true, tema: 'escuro' })
    salvarPreferencias({ contraste: false, tema: null })
    expect(localStorage.getItem('acessaweb-contraste')).toBeNull()
    expect(localStorage.getItem('acessaweb-tema')).toBeNull()
  })

  it('valor estranho salvo vira "seguir o sistema"', () => {
    localStorage.setItem('acessaweb-tema', 'roxo')
    expect(lerPreferencias()).toEqual({ contraste: false, tema: null })
  })

  it('sem armazenamento (aba anônima com bloqueio), lê o padrão e salvar não quebra', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(lerPreferencias()).toEqual({ contraste: false, tema: null })
    expect(() => salvarPreferencias({ contraste: true, tema: null })).not.toThrow()
  })
})

describe('aplicarTema', () => {
  it('põe o data-theme da página e tira quando volta a seguir o sistema', () => {
    aplicarTema({ contraste: true, tema: null })
    expect(document.documentElement.dataset.theme).toBe('contraste')
    aplicarTema({ contraste: false, tema: null })
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})
