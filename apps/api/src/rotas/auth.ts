import { Router } from 'express'
import { Prisma } from '../../generated/prisma/client.js'
import { conferirSenha, gerarHashSenha } from '../auth/senha.js'
import { abrirSessao, exigirLogin, fecharSessao, type UsuarioDaSessao } from '../auth/sessao.js'
import { bloqueado, limparTentativas, registrarErro } from '../auth/tentativas.js'
import { db } from '../db.js'

export const rotasAuth = Router()

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MSG_EMAIL = 'Digite um e-mail válido, como nome@empresa.com.br.'
const MSG_LOGIN = 'E-mail ou senha incorretos.'
// hash de uma senha qualquer: quem tenta um e-mail sem conta espera o mesmo tempo de quem erra a senha
const HASH_FALSO = gerarHashSenha('senha-que-ninguem-usa')

type Campos = Partial<Record<'nome' | 'email' | 'senha', string>>

function texto(valor: unknown) {
  return typeof valor === 'string' ? valor : ''
}

function publico({ nome, email }: UsuarioDaSessao) {
  return { nome, email }
}

rotasAuth.post('/cadastro', async (req, res) => {
  const nome = texto(req.body?.nome).trim()
  const email = texto(req.body?.email).trim().toLowerCase()
  const senha = texto(req.body?.senha)

  const campos: Campos = {}
  if (!nome) campos.nome = 'Digite seu nome.'
  else if (nome.length > 100) campos.nome = 'Use até 100 caracteres no nome.'
  if (!EMAIL_VALIDO.test(email) || email.length > 254) campos.email = MSG_EMAIL
  if (senha.length < 8) campos.senha = 'A senha precisa ter pelo menos 8 caracteres.'
  else if (senha.length > 128) campos.senha = 'Use até 128 caracteres na senha.'
  if (Object.keys(campos).length > 0) {
    res.status(400).json({ erro: 'Confira os campos marcados.', campos })
    return
  }

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
    throw erro
  }
})

rotasAuth.post('/entrar', async (req, res) => {
  const email = texto(req.body?.email).trim().toLowerCase()
  const senha = texto(req.body?.senha)

  if (bloqueado(email)) {
    res.status(429).json({ erro: 'Muitas tentativas. Tente de novo em 15 minutos.' })
    return
  }

  const usuario = await db.usuario.findUnique({ where: { email } })
  const senhaCerta = await conferirSenha(senha, usuario?.senhaHash ?? (await HASH_FALSO))
  if (!usuario || !senhaCerta) {
    registrarErro(email)
    res.status(401).json({ erro: MSG_LOGIN })
    return
  }

  limparTentativas(email)
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
