import { randomBytes, scrypt, timingSafeEqual, type BinaryLike } from 'node:crypto'

const TAMANHO_HASH = 64

function scryptAsync(senha: string, sal: BinaryLike, tamanho: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(senha, sal, tamanho, (erro, hash) => (erro ? reject(erro) : resolve(hash)))
  })
}

// Formato guardado em usuarios.senhaHash: "scrypt$<sal em hex>$<hash em hex>" (RNF04: nunca a senha)
export async function gerarHashSenha(senha: string) {
  const sal = randomBytes(16)
  const hash = await scryptAsync(senha, sal, TAMANHO_HASH)
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`
}

export async function conferirSenha(senha: string, guardado: string) {
  const [algoritmo, salHex, hashHex] = guardado.split('$')
  // tamanho exato: um valor corrompido (hash vazio) não pode virar "senha certa"
  if (algoritmo !== 'scrypt' || salHex?.length !== 32 || hashHex?.length !== TAMANHO_HASH * 2) {
    return false
  }
  const esperado = Buffer.from(hashHex, 'hex')
  const hash = await scryptAsync(senha, Buffer.from(salHex, 'hex'), esperado.length)
  // comparação em tempo constante: o tempo da resposta não dá pista da senha
  return timingSafeEqual(hash, esperado)
}
