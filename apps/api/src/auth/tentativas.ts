// Limites contra abuso na conta (risco R9: adivinhar senhas, criar contas em massa).
// shortcut: ficam na memória da API e zeram quando o Render hiberna ou reinicia; trocar por tabela se houver mais de uma instância.

// teto da memória de cada limite: com chaves inventadas, os registros mais antigos saem primeiro
export const MAX_REGISTROS = 10_000

type Registro = { contagem: number; inicio: number }

// Conta eventos por chave (e-mail, IP...) numa janela de tempo; acima de `maximo`, bloqueia
export function criarLimite(maximo: number, janelaMs: number) {
  const registros = new Map<string, Registro>()

  function registroValido(chave: string, agora: number) {
    const registro = registros.get(chave)
    if (registro && agora - registro.inicio >= janelaMs) {
      registros.delete(chave)
      return undefined
    }
    return registro
  }

  return {
    maximo,
    janelaMs,
    bloqueado(chave: string, agora = Date.now()) {
      return (registroValido(chave, agora)?.contagem ?? 0) >= maximo
    },
    // quantas ainda cabem na janela (ex.: uma lista de 10 links só passa se couberem as 10)
    restantes(chave: string, agora = Date.now()) {
      return Math.max(0, maximo - (registroValido(chave, agora)?.contagem ?? 0))
    },
    registrar(chave: string, agora = Date.now()) {
      const registro = registroValido(chave, agora)
      if (registro) registro.contagem += 1
      else registros.set(chave, { contagem: 1, inicio: agora })
      if (registros.size <= MAX_REGISTROS) return
      // cheio: tira os vencidos e, se ainda passar do teto, os mais antigos (o Map guarda a ordem de entrada)
      for (const outra of registros.keys()) registroValido(outra, agora)
      for (const outra of registros.keys()) {
        if (registros.size <= MAX_REGISTROS) break
        registros.delete(outra)
      }
    },
    limpar(chave: string) {
      registros.delete(chave)
    },
    // desfaz uma contagem (ex.: login certo não conta como erro do IP)
    descontar(chave: string) {
      const registro = registros.get(chave)
      if (registro) registro.contagem = Math.max(0, registro.contagem - 1)
    },
    total() {
      return registros.size
    },
    // só para os testes começarem do zero
    zerar() {
      registros.clear()
    },
  }
}

const QUINZE_MINUTOS = 15 * 60 * 1000
const UMA_HORA = 60 * 60 * 1000

// Logins errados por e-mail + IP: o dono da conta, de outro IP, continua entrando
export const limiteLogin = criarLimite(5, QUINZE_MINUTOS)
// Logins errados por IP, somando todos os e-mails: segura quem testa poucas senhas em muitas contas
export const limiteLoginPorIp = criarLimite(20, QUINZE_MINUTOS)
// Logins errados por e-mail, somando todos os IPs: teto alto contra ataque de muitos IPs a uma conta
// (decisão do João, 17/11/2026). Só trava o dono se alguém errar 50 vezes a senha dele em uma hora.
export const limiteLoginPorEmail = criarLimite(50, UMA_HORA)
// Contas criadas por IP
export const limiteCadastroPorIp = criarLimite(10, UMA_HORA)
// Pedidos de nova avaliação por conta, aceitos ou recusados: o pedido recusado não grava linha, então o
// count do banco não o vê; este limite segura quem testa endereços para descobrir o DNS interno (RNF10)
export const limiteAvaliacaoPorConta = criarLimite(30, QUINZE_MINUTOS)
// O mesmo por IP, somando todas as contas: criar contas novas não zera a conta
export const limiteAvaliacaoPorIp = criarLimite(60, QUINZE_MINUTOS)
// Senhas erradas ao excluir a conta, por conta: separado do login, para errar aqui não travar a
// entrada, e para quem ataca o login não impedir o dono de excluir a conta (LGPD)
export const limiteExclusaoPorConta = criarLimite(5, QUINZE_MINUTOS)
// Relatórios em PDF por conta: cada um abre um Chromium (design do PDF, 19/11/2026)
export const limitePdfPorConta = criarLimite(10, UMA_HORA)
