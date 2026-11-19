import { describe, expect, it } from 'vitest'
import { requisitos, requisitosDaRegra } from './requisitos.js'

describe('requisitos do eMAG', () => {
  it('tem as 45 recomendações, sem número repetido', () => {
    expect(requisitos).toHaveLength(45)
    expect(new Set(requisitos.map((r) => r.numero)).size).toBe(45)
  })

  it('29 entram na nota (cobertura sim ou parcial) e todas têm prioridade e regra', () => {
    const naNota = requisitos.filter((r) => r.cobertura !== 'nao')

    expect(naNota).toHaveLength(29)
    expect(naNota.every((r) => r.prioridade && r.regras.length > 0)).toBe(true)
  })

  it('as 16 sem cobertura ficam só na revisão humana, sem prioridade nem regra', () => {
    const revisao = requisitos.filter((r) => r.cobertura === 'nao')

    expect(revisao).toHaveLength(16)
    expect(revisao.every((r) => !r.prioridade && r.regras.length === 0)).toBe(true)
  })

  it('as 29 da nota explicam a falha e mostram um exemplo de correção', () => {
    const naNota = requisitos.filter((r) => r.cobertura !== 'nao')

    expect(naNota).toHaveLength(29)
    // Lista os números que falham, para a mensagem dizer qual recomendação ficou sem texto
    const semTexto = naNota.filter((r) => !r.porque?.trim() || !r.exemplo?.trim() || r.conferir)
    expect(semTexto.map((r) => r.numero)).toEqual([])
  })

  it('as 16 de revisão humana dizem o que conferir, sem porquê nem exemplo', () => {
    const revisao = requisitos.filter((r) => r.cobertura === 'nao')

    expect(revisao).toHaveLength(16)
    const semTexto = revisao.filter((r) => !r.conferir?.trim() || r.porque || r.exemplo)
    expect(semTexto.map((r) => r.numero)).toEqual([])
  })

  it('liga a seção oficial pelo primeiro número', () => {
    expect(requisitos.find((r) => r.numero === '3.10')?.link).toBe(
      'https://emag.governoeletronico.gov.br/#s3.3',
    )
  })
})

describe('requisitosDaRegra', () => {
  it('image-alt vira 3.6', () => {
    expect(requisitosDaRegra('image-alt').map((r) => r.numero)).toEqual(['3.6'])
  })

  it('meta-refresh liga a 2.3, 2.4 e 2.5', () => {
    expect(requisitosDaRegra('meta-refresh').map((r) => r.numero)).toEqual(['2.3', '2.4', '2.5'])
  })

  it('regra fora da lista não tem requisito', () => {
    expect(requisitosDaRegra('regra-inventada')).toEqual([])
  })
})
