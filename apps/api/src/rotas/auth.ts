import { Router, type Request } from 'express'
import { Prisma } from '../../generated/prisma/client.js'
import { conferirSenha, gerarHashSenha } from '../auth/senha.js'
import { chaveDoIp } from '../auth/ip.js'
import { abrirSessao, exigirLogin, fecharSessao, type UsuarioDaSessao } from '../auth/sessao.js'
import {
  limiteCadastroPorIp,
  limiteLogin,
  limiteLoginPorEmail,
  limiteLoginPorIp,
} from '../auth/tentativas.js'
import { db } from '../db.js'

export const rotasAuth = Router()

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MSG_EMAIL = 'Digite um e-mail válido, como nome@empresa.com.br.'
const MSG_LOGIN = 'E-mail ou senha incorretos.'
const MSG_MUITAS_TENTATIVAS = 'Muitas tentativas. Tente de novo em 15 minutos.'
// hash de uma senha qualquer: quem tenta um e-mail sem conta espera o mesmo tempo de quem erra a senha
const HASH_FALSO = gerarHashSenha('senha-que-ninguem-usa')

type Campos = Partial<Record<'nome' | 'email' | 'senha', string>>

function texto(valor: unknown) {
  return typeof valor === 'string' ? valor : ''
}

function publico({ nome, email }: UsuarioDaSessao) {
  return { nome, email }
}

// IP de quem acessa, já com o trust proxy do app.ts (medido no Render); IPv6 conta pelo /64
function ipDe(req: Request) {
  return chaveDoIp(req.ip ?? 'desconhecido')
}

rotasAuth.post('/cadastro', async (req, res) => {
  const nome = texto(req.body?.nome).trim()
  const email = texto(req.body?.email).trim().toLowerCase()
  const senha = texto(req.body?.senha)

  const campos: Campos = {}
  if (!nome) campos.nome = 'Digite seu nome.'
  else if (nome.length > 100) campos.nome = 'Use até 100 caracteres no nome.'
  // o tamanho vem antes da regex: com texto enorme a regex fica lenta e trava a API
  if (email.length > 254 || !EMAIL_VALIDO.test(email)) campos.email = MSG_EMAIL
  if (senha.length < 8) campos.senha = 'A senha precisa ter pelo menos 8 caracteres.'
  else if (senha.length > 128) campos.senha = 'Use até 128 caracteres na senha.'
  // \p{Lu}/\p{Ll}: letras inclusive acentuadas; símbolo é o que não é letra nem número (decisão do João, 18/11/2026)
  else if (
    !/\p{Lu}/u.test(senha) ||
    !/\p{Ll}/u.test(senha) ||
    !/\d/.test(senha) ||
    !/[^\p{L}\d]/u.test(senha)
  ) {
    campos.senha = 'Use pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo.'
  }
  if (Object.keys(campos).length > 0) {
    res.status(400).json({ erro: 'Confira os campos marcados.', campos })
    return
  }

  const ip = ipDe(req)
  if (limiteCadastroPorIp.bloqueado(ip)) {
    res.status(429).json({ erro: 'Muitas contas criadas desta rede. Tente de novo em 1 hora.' })
    return
  }
  // conta antes de esperar o banco: pedidos simultâneos não furam o limite
  limiteCadastroPorIp.registrar(ip)

  try {
    const usuario = await db.usuario.create({
      data: { nome, email, senhaHash: await gerarHashSenha(senha) },
      select: { id: true, nome: true, email: true },
    })
    await abrirSessao(res, usuario.id)
    res.status(201).json({ usuario: publico(usuario) })
  } catch (erro) {
    // e-mail único no banco (P2002): avisa no campo, sem erro 500
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === 'P2002') {
      res.status(409).json({
        erro: 'Confira os campos marcados.',
        campos: {
          email: 'Já existe uma conta com este e-mail. Entre com ela ou use outro e-mail.',
        },
      })
      return
    }
    // falha do servidor (ex.: banco fora do ar) não gasta a vaga de quem tentou
    limiteCadastroPorIp.descontar(ip)
    throw erro
  }
})

rotasAuth.post('/entrar', async (req, res) => {
  const email = texto(req.body?.email).trim().toLowerCase()
  const senha = texto(req.body?.senha)

  // tamanhos que o cadastro não aceita: recusa antes do limitador (não vira chave na memória)
  if (email.length > 254 || senha.length > 128) {
    res.status(401).json({ erro: MSG_LOGIN })
    return
  }
  // e-mail + IP: errar a senha de outra pessoa não trava o dono, que entra de outro IP
  const ip = ipDe(req)
  const chave = `${email}|${ip}`
  if (limiteLogin.bloqueado(chave) || limiteLoginPorIp.bloqueado(ip)) {
    res.status(429).json({ erro: MSG_MUITAS_TENTATIVAS })
    return
  }
  if (limiteLoginPorEmail.bloqueado(email)) {
    res.status(429).json({ erro: 'Muitas tentativas nesta conta. Tente de novo em 1 hora.' })
    return
  }
  // conta a tentativa antes de esperar o banco: pedidos simultâneos não furam o limite.
  // Se a senha estiver certa, as contagens são desfeitas logo abaixo.
  limiteLogin.registrar(chave)
  limiteLoginPorIp.registrar(ip)
  limiteLoginPorEmail.registrar(email)

  let usuario: Awaited<ReturnType<typeof db.usuario.findUnique>>
  let senhaCerta: boolean
  try {
    usuario = await db.usuario.findUnique({ where: { email } })
    senhaCerta = await conferirSenha(senha, usuario?.senhaHash ?? (await HASH_FALSO))
  } catch (erro) {
    // falha do servidor (ex.: banco fora do ar) não conta como tentativa errada
    limiteLogin.descontar(chave)
    limiteLoginPorIp.descontar(ip)
    limiteLoginPorEmail.descontar(email)
    throw erro
  }
  if (!usuario || !senhaCerta) {
    res.status(401).json({ erro: MSG_LOGIN })
    return
  }

  limiteLogin.limpar(chave)
  limiteLoginPorIp.descontar(ip)
  // desconta só este login: o dono entrar não apaga os erros de quem ataca a conta
  limiteLoginPorEmail.descontar(email)
  await abrirSessao(res, usuario.id)
  res.json({ usuario: publico(usuario) })
})

rotasAuth.post('/sair', async (req, res) => {
  await fecharSessao(req, res)
  res.status(204).end()
})

rotasAuth.get('/eu', exigirLogin, (_req, res) => {
  res.json({ usuario: publico(res.locals.usuario as UsuarioDaSessao) })
})
