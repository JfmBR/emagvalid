import { createHash, randomBytes } from 'node:crypto'
import type { CookieOptions, Request, RequestHandler, Response } from 'express'
import { db } from '../db.js'

export const COOKIE_SESSAO = 'sessao'
const DURACAO_MS = 7 * 24 * 60 * 60 * 1000

export type UsuarioDaSessao = { id: string; nome: string; email: string }

function hashDoToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

function opcoesDoCookie(): CookieOptions {
  return {
    httpOnly: true, // o JavaScript da página não lê o cookie
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production', // só por HTTPS no Render
    path: '/',
  }
}

// Express 5 não lê cookies sozinho; só precisamos de um
function lerToken(req: Request) {
  for (const parte of (req.headers.cookie ?? '').split(';')) {
    const [nome, ...valor] = parte.trim().split('=')
    if (nome === COOKIE_SESSAO) return valor.join('=')
  }
  return undefined
}

export async function abrirSessao(res: Response, usuarioId: string) {
  const token = randomBytes(32).toString('base64url')
  await db.sessao.create({
    data: { tokenHash: hashDoToken(token), usuarioId, expiraEm: new Date(Date.now() + DURACAO_MS) },
  })
  res.cookie(COOKIE_SESSAO, token, { ...opcoesDoCookie(), maxAge: DURACAO_MS })
}

export async function fecharSessao(req: Request, res: Response) {
  const token = lerToken(req)
  if (token) await db.sessao.deleteMany({ where: { tokenHash: hashDoToken(token) } })
  res.clearCookie(COOKIE_SESSAO, opcoesDoCookie())
}

async function usuarioDaSessao(req: Request): Promise<UsuarioDaSessao | null> {
  const token = lerToken(req)
  if (!token) return null
  const sessao = await db.sessao.findUnique({
    where: { tokenHash: hashDoToken(token) },
    include: { usuario: { select: { id: true, nome: true, email: true } } },
  })
  if (!sessao) return null
  if (sessao.expiraEm.getTime() <= Date.now()) {
    await db.sessao.deleteMany({ where: { id: sessao.id } })
    return null
  }
  return sessao.usuario
}

// Barra quem não entrou; quem entrou fica em res.locals.usuario
export const exigirLogin: RequestHandler = async (req, res, next) => {
  const usuario = await usuarioDaSessao(req)
  if (!usuario) {
    res.status(401).json({ erro: 'Entre na sua conta para continuar.' })
    return
  }
  res.locals.usuario = usuario
  next()
}
