import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarApp } from '../app.js'
import { MAX_TENTATIVAS } from '../auth/tentativas.js'

type UsuarioFalso = { id: string; nome: string; email: string; senhaHash: string }
type SessaoFalsa = { id: string; tokenHash: string; usuarioId: string; expiraEm: Date }

// O CI não tem banco: as rotas rodam de verdade, com um db em memória no lugar do Prisma
const banco = vi.hoisted(() => ({
  usuarios: [] as UsuarioFalso[],
  sessoes: [] as SessaoFalsa[],
}))

vi.mock('../db.js', async () => {
  const { Prisma } = await import('../../generated/prisma/client.js')
  const publico = (u: UsuarioFalso) => ({ id: u.id, nome: u.nome, email: u.email })
  return {
    db: {
      usuario: {
        create: async ({ data }: { data: Omit<UsuarioFalso, 'id'> }) => {
          if (banco.usuarios.some((u) => u.email === data.email)) {
            throw new Prisma.PrismaClientKnownRequestError('e-mail repetido', {
              code: 'P2002',
              clientVersion: 'teste',
            })
          }
          const usuario = { id: `u${banco.usuarios.length + 1}`, ...data }
          banco.usuarios.push(usuario)
          return publico(usuario)
        },
        findUnique: async ({ where }: { where: { email: string } }) =>
          banco.usuarios.find((u) => u.email === where.email) ?? null,
      },
      sessao: {
        create: async ({ data }: { data: Omit<SessaoFalsa, 'id'> }) => {
          banco.sessoes.push({ id: `s${banco.sessoes.length + 1}`, ...data })
        },
        findUnique: async ({ where }: { where: { tokenHash: string } }) => {
          const sessao = banco.sessoes.find((s) => s.tokenHash === where.tokenHash)
          const usuario = banco.usuarios.find((u) => u.id === sessao?.usuarioId)
          return sessao && usuario ? { ...sessao, usuario: publico(usuario) } : null
        },
        deleteMany: async ({ where }: { where: { tokenHash?: string; id?: string } }) => {
          banco.sessoes = banco.sessoes.filter(
            (s) => s.tokenHash !== where.tokenHash && s.id !== where.id,
          )
        },
      },
    },
  }
})

const helena = { nome: 'Helena Souza', email: 'Helena@Empresa.com.br', senha: 'senha-forte-1' }

function cadastrar(agente: ReturnType<typeof request.agent>, dados: object = helena) {
  return agente.post('/api/auth/cadastro').send(dados)
}

beforeEach(() => {
  banco.usuarios = []
  banco.sessoes = []
})

describe('cadastro', () => {
  it('cria a conta, guarda só o hash da senha e já deixa a pessoa dentro', async () => {
    const agente = request.agent(criarApp())
    const resposta = await cadastrar(agente)

    expect(resposta.status).toBe(201)
    expect(resposta.body).toEqual({
      usuario: { nome: 'Helena Souza', email: 'helena@empresa.com.br' },
    })
    expect(banco.usuarios[0]?.senhaHash).not.toContain(helena.senha)
    const cookie = String(resposta.headers['set-cookie'])
    expect(cookie).toMatch(/sessao=.+; Max-Age=604800/)
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('SameSite=Lax')

    const eu = await agente.get('/api/auth/eu')
    expect(eu.body).toEqual({ usuario: { nome: 'Helena Souza', email: 'helena@empresa.com.br' } })
  })

  it('aponta cada campo errado com o próximo passo', async () => {
    const resposta = await request(criarApp())
      .post('/api/auth/cadastro')
      .send({ nome: ' ', email: 'helena@', senha: '1234567' })

    expect(resposta.status).toBe(400)
    expect(resposta.body.campos).toEqual({
      nome: 'Digite seu nome.',
      email: 'Digite um e-mail válido, como nome@empresa.com.br.',
      senha: 'A senha precisa ter pelo menos 8 caracteres.',
    })
    expect(banco.usuarios).toHaveLength(0)
  })

  it('recusa e-mail já cadastrado, mesmo com letras maiúsculas diferentes', async () => {
    await cadastrar(request.agent(criarApp()))
    const resposta = await cadastrar(request.agent(criarApp()), {
      ...helena,
      email: 'HELENA@empresa.com.br',
    })

    expect(resposta.status).toBe(409)
    expect(resposta.body.campos.email).toMatch(/Já existe uma conta/)
  })
})

describe('entrar e sair', () => {
  it('entra com a senha certa e sai apagando a sessão', async () => {
    await cadastrar(request.agent(criarApp()))
    const agente = request.agent(criarApp())

    const entrar = await agente
      .post('/api/auth/entrar')
      .send({ email: 'helena@empresa.com.br', senha: helena.senha })
    expect(entrar.status).toBe(200)
    expect(entrar.body.usuario.nome).toBe('Helena Souza')
    expect(banco.sessoes).toHaveLength(2)

    const sair = await agente.post('/api/auth/sair')
    expect(sair.status).toBe(204)
    expect(banco.sessoes).toHaveLength(1)
    expect((await agente.get('/api/auth/eu')).status).toBe(401)
  })

  it('mesma mensagem para senha errada e e-mail sem conta', async () => {
    await cadastrar(request.agent(criarApp()))
    const app = criarApp()

    const senhaErrada = await request(app)
      .post('/api/auth/entrar')
      .send({ email: helena.email, senha: 'outra-senha' })
    const semConta = await request(app)
      .post('/api/auth/entrar')
      .send({ email: 'ninguem@empresa.com.br', senha: 'outra-senha' })

    expect(senhaErrada.status).toBe(401)
    expect(semConta.status).toBe(401)
    expect(senhaErrada.body).toEqual({ erro: 'E-mail ou senha incorretos.' })
    expect(semConta.body).toEqual(senhaErrada.body)
  })

  it(`depois de ${MAX_TENTATIVAS} erros, bloqueia até a senha certa`, async () => {
    const dados = { ...helena, email: 'bloqueio@empresa.com.br' }
    await cadastrar(request.agent(criarApp()), dados)
    const app = criarApp()
    for (let i = 0; i < MAX_TENTATIVAS; i++) {
      await request(app).post('/api/auth/entrar').send({ email: dados.email, senha: 'errada-123' })
    }

    const resposta = await request(app)
      .post('/api/auth/entrar')
      .send({ email: dados.email, senha: dados.senha })
    expect(resposta.status).toBe(429)
    expect(resposta.body.erro).toMatch(/Tente de novo em 15 minutos/)
  })
})

describe('sessão', () => {
  it('sem cookie, /eu responde 401', async () => {
    const resposta = await request(criarApp()).get('/api/auth/eu')

    expect(resposta.status).toBe(401)
    expect(resposta.body.erro).toBe('Entre na sua conta para continuar.')
  })

  it('sessão vencida não vale e sai do banco', async () => {
    const agente = request.agent(criarApp())
    await cadastrar(agente)
    banco.sessoes[0]!.expiraEm = new Date(Date.now() - 1000)

    expect((await agente.get('/api/auth/eu')).status).toBe(401)
    expect(banco.sessoes).toHaveLength(0)
  })
})
