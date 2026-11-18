export type Resposta<T> = { status: number; corpo: T }

// Status 0 = sem conexão com o servidor.
async function pedir<T>(caminho: string, opcoes?: RequestInit): Promise<Resposta<Partial<T>>> {
  try {
    const resposta = await fetch(caminho, opcoes)
    const corpo = resposta.status === 204 ? {} : await resposta.json().catch(() => ({}))
    return { status: resposta.status, corpo }
  } catch {
    return { status: 0, corpo: {} }
  }
}

// POST com JSON para a API
export function enviar<T>(caminho: string, dados?: unknown) {
  return pedir<T>(caminho, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: dados === undefined ? undefined : JSON.stringify(dados),
  })
}

// GET na API, no mesmo formato de `enviar`
export function buscar<T>(caminho: string) {
  return pedir<T>(caminho)
}

// Mensagem para erros que não são de um campo (RF17: dizer o que fazer)
export function mensagemDeErro(status: number, erro?: string) {
  if (status === 0)
    return 'Não conseguimos falar com o servidor. Confira sua internet e tente de novo.'
  return erro ?? 'Algo deu errado do nosso lado. Tente de novo em instantes.'
}
