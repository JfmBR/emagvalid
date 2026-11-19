// shortcut: a fila vive na memória de uma instância só; com mais de uma instância ou reinício, ela se perde (as pendentes viram ERRO na Tarefa 5)
export function criarFila(processar: (id: string) => Promise<void>) {
  // o primeiro item é o que está rodando; sai da lista só quando termina
  const itens: string[] = []
  let rodando = false

  async function rodar() {
    // rodando muda antes de qualquer await: só um chamador entra no laço
    if (rodando) return
    rodando = true
    try {
      while (itens.length > 0) {
        try {
          await processar(itens[0]!)
        } catch (erro) {
          // oxlint-disable-next-line no-console
          console.error('Falha ao processar a análise', itens[0], erro)
        }
        itens.shift()
      }
    } finally {
      rodando = false
    }
  }

  return {
    adicionar(id: string): void {
      itens.push(id)
      void rodar()
    },
    // quantas estão na fila, contando a que está rodando
    tamanho(): number {
      return itens.length
    },
    posicao(id: string): number | null {
      const indice = itens.indexOf(id)
      return indice === -1 ? null : indice
    },
  }
}
