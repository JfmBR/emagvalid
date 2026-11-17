import { describe, expect, it } from 'vitest'
import {
  JANELA_MS,
  MAX_TENTATIVAS,
  bloqueado,
  limparTentativas,
  registrarErro,
} from './tentativas.js'

describe('tentativas de login', () => {
  it(`bloqueia depois de ${MAX_TENTATIVAS} erros e libera quando a janela passa`, () => {
    const email = 'bloqueio@exemplo.com'
    const inicio = 1_000_000
    for (let i = 0; i < MAX_TENTATIVAS - 1; i++) registrarErro(email, inicio)
    expect(bloqueado(email, inicio)).toBe(false)

    registrarErro(email, inicio)
    expect(bloqueado(email, inicio)).toBe(true)
    expect(bloqueado(email, inicio + JANELA_MS)).toBe(false)
  })

  it('um login certo zera os erros', () => {
    const email = 'zera@exemplo.com'
    for (let i = 0; i < MAX_TENTATIVAS; i++) registrarErro(email)
    limparTentativas(email)

    expect(bloqueado(email)).toBe(false)
  })
})
