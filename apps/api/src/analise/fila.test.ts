import { describe, expect, it, vi } from 'vitest'
import { criarFila } from './fila.js'

// Promessa que o teste resolve ou rejeita quando quiser
function controlada() {
  let resolver!: () => void
  const promessa = new Promise<void>((res) => {
    resolver = res
  })
  return { promessa, resolver }
}

// Deixa a fila avançar até o próximo ponto de espera
const aguardar = () => new Promise((res) => setTimeout(res, 0))

describe('criarFila', () => {
  it('roda uma por vez, na ordem de chegada', async () => {
    const controles = new Map(['a', 'b', 'c'].map((id) => [id, controlada()]))
    const ordem: string[] = []
    let rodando = 0
    let maximo = 0
    const fila = criarFila(async (id) => {
      ordem.push(id)
      rodando++
      maximo = Math.max(maximo, rodando)
      await controles.get(id)!.promessa
      rodando--
    })

    fila.adicionar('a')
    fila.adicionar('b')
    fila.adicionar('c')
    await aguardar()
    expect(ordem).toEqual(['a'])

    for (const id of ['a', 'b', 'c']) {
      controles.get(id)!.resolver()
      await aguardar()
    }

    expect(ordem).toEqual(['a', 'b', 'c'])
    expect(maximo).toBe(1)
  })

  it('posicao conta quem está antes', async () => {
    const controles = new Map(['a', 'b', 'c'].map((id) => [id, controlada()]))
    const fila = criarFila((id) => controles.get(id)!.promessa)

    fila.adicionar('a')
    fila.adicionar('b')
    fila.adicionar('c')
    await aguardar()

    expect(fila.posicao('a')).toBe(0)
    expect(fila.posicao('b')).toBe(1)
    expect(fila.posicao('c')).toBe(2)
    expect(fila.posicao('x')).toBeNull()
    expect(fila.tamanho()).toBe(3)

    controles.get('a')!.resolver()
    await aguardar()

    expect(fila.posicao('a')).toBeNull()
    expect(fila.posicao('b')).toBe(0)
    expect(fila.posicao('c')).toBe(1)
    expect(fila.tamanho()).toBe(2)
  })

  it('um erro em uma não para a fila', async () => {
    const erro = vi.spyOn(console, 'error').mockImplementation(() => {})
    const ordem: string[] = []
    const fila = criarFila(async (id) => {
      ordem.push(id)
      if (id === 'a') throw new Error('falhou')
    })

    fila.adicionar('a')
    fila.adicionar('b')
    await aguardar()

    expect(ordem).toEqual(['a', 'b'])
    expect(erro).toHaveBeenCalledTimes(1)
    erro.mockRestore()
  })

  it('continua rodando quando recebe item novo depois de esvaziar', async () => {
    const ordem: string[] = []
    const fila = criarFila(async (id) => {
      ordem.push(id)
    })

    fila.adicionar('a')
    await aguardar()
    expect(fila.posicao('a')).toBeNull()

    fila.adicionar('b')
    await aguardar()
    expect(ordem).toEqual(['a', 'b'])
    expect(fila.posicao('b')).toBeNull()
  })

  it('item adicionado enquanto uma roda espera e não roda junto', async () => {
    const primeira = controlada()
    const ordem: string[] = []
    let rodando = 0
    let maximo = 0
    const fila = criarFila(async (id) => {
      ordem.push(id)
      rodando++
      maximo = Math.max(maximo, rodando)
      if (id === 'a') await primeira.promessa
      rodando--
    })

    fila.adicionar('a')
    await aguardar()
    fila.adicionar('b')
    await aguardar()
    expect(ordem).toEqual(['a'])

    primeira.resolver()
    await aguardar()
    expect(ordem).toEqual(['a', 'b'])
    expect(maximo).toBe(1)
  })
})
