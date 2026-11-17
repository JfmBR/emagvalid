// Limite de tentativas de login erradas por e-mail (risco R9: adivinhar senhas).
// shortcut: fica na memória da API e zera quando o Render hiberna ou reinicia; trocar por tabela se houver mais de uma instância.
export const MAX_TENTATIVAS = 5
export const JANELA_MS = 15 * 60 * 1000
// teto da memória usada: com e-mails inventados, os registros mais antigos saem primeiro
export const MAX_REGISTROS = 10_000

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
  if (registros.size <= MAX_REGISTROS) return
  // cheio: tira os vencidos e, se ainda passar do teto, os mais antigos (o Map guarda a ordem de entrada)
  for (const chave of registros.keys()) registroValido(chave, agora)
  for (const chave of registros.keys()) {
    if (registros.size <= MAX_REGISTROS) break
    registros.delete(chave)
  }
}

export function totalRegistros() {
  return registros.size
}

export function limparTentativas(email: string) {
  registros.delete(email)
}
