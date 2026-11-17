export type Resposta<T> = { status: number; corpo: T }

// POST com JSON para a API. Status 0 = sem conexão com o servidor.
export async function enviar<T>(caminho: string, dados?: unknown): Promise<Resposta<Partial<T>>> {
  try {
    const resposta = await fetch(caminho, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: dados === undefined ? undefined : JSON.stringify(dados),
    })
    const corpo = resposta.status === 204 ? {} : await resposta.json().catch(() => ({}))
    return { status: resposta.status, corpo }
  } catch {
    return { status: 0, corpo: {} }
  }
}

// Mensagem para erros que não são de um campo (RF17: dizer o que fazer)
export function mensagemDeErro(status: number, erro?: string) {
  if (status === 0)
    return 'Não conseguimos falar com o servidor. Confira sua internet e tente de novo.'
  return erro ?? 'Algo deu errado do nosso lado. Tente de novo em instantes.'
}
