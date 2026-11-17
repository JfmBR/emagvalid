// Limite de tentativas de login erradas por e-mail (risco R9: adivinhar senhas).
// shortcut: fica na memória da API e zera quando o Render hiberna ou reinicia; trocar por tabela se houver mais de uma instância.
export const MAX_TENTATIVAS = 5
export const JANELA_MS = 15 * 60 * 1000

type Registro = { erros: number; inicio: number }
const registros = new Map<string, Registro>()

function registroValido(email: string, agora: number) {
  const registro = registros.get(email)
  if (registro && agora - registro.inicio >= JANELA_MS) {
    registros.delete(email)
    return undefined
  }
  return registro
}

export function bloqueado(email: string, agora = Date.now()) {
  return (registroValido(email, agora)?.erros ?? 0) >= MAX_TENTATIVAS
}

export function registrarErro(email: string, agora = Date.now()) {
  const registro = registroValido(email, agora)
  if (registro) registro.erros += 1
  else registros.set(email, { erros: 1, inicio: agora })
  // evita crescer sem fim com e-mails inventados: limpa os vencidos de vez em quando
  if (registros.size > 1000) for (const chave of registros.keys()) registroValido(chave, agora)
}

export function limparTentativas(email: string) {
  registros.delete(email)
}
