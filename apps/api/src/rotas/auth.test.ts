import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { criarApp } from '../app.js'
import { fila } from '../analise/executar.js'
import {
  limiteCadastroPorIp,
  limiteExclusaoPorConta,
  limiteLogin,
  limiteLoginPorEmail,
  limiteLoginPorIp,
} from '../auth/tentativas.js'

const MAX_TENTATIVAS = limiteLogin.maximo

// Simula o pedido como chega no Render: X-Forwarded-For = "<cliente>, <Cloudflare>, <Render>"
function vindoDe(ip: string) {
  return { 'X-Forwarded-For': `${ip}, 172.70.34.61, 10.27.253.132` }
}

type UsuarioFalso = {
  id: string
  nome: string
  email: string
  senhaHash: string
}
type SessaoFalsa = { id: string; tokenHash: string; usuarioId: string; expiraEm: Date }

// O CI não tem banco: as rotas rodam de verdade, com um db em memória no lugar do Prisma
const banco = vi.hoisted(() => ({
  usuarios: [] as UsuarioFalso[],
  sessoes: [] as SessaoFalsa[],
  avaliacoes: [] as { id: string; usuarioId: string; status: string; criadaEm: Date }[],
}))

vi.mock('../db.js', async () => {
  const { Prisma } = await import('../../generated/prisma/client.js')
  const publico = (u: UsuarioFalso) => ({
    id: u.id,
    nome: u.nome,
    email: u.email,
  })
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
        findUnique: async ({ where }: { where: { email?: string; id?: string } }) =>
          banco.usuarios.find((u) => u.email === where.email || u.id === where.id) ?? null,
        // o banco apaga as sessões e as avaliações junto (onDelete: Cascade)
        deleteMany: async ({ where }: { where: { id: string } }) => {
          const antes = banco.usuarios.length
          banco.usuarios = banco.usuarios.filter((u) => u.id !== where.id)
          banco.sessoes = banco.sessoes.filter((s) => s.usuarioId !== where.id)
          banco.avaliacoes = banco.avaliacoes.filter((a) => a.usuarioId !== where.id)
          return { count: antes - banco.usuarios.length }
        },
      },
      avaliacao: {
        findMany: async ({ where }: { where: { usuarioId: string; status: { in: string[] } } }) =>
          banco.avaliacoes.filter(
            (a) => a.usuarioId === where.usuarioId && where.status.in.includes(a.status),
          ),
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

const helena = { nome: 'Helena Souza', email: 'Helena@Empresa.com.br', senha: 'Senha-forte-1' }

function cadastrar(agente: ReturnType<typeof request.agent>, dados: object = helena) {
  return agente.post('/api/auth/cadastro').send(dados)
}

beforeEach(() => {
  banco.usuarios = []
  banco.sessoes = []
  banco.avaliacoes = []
  limiteExclusaoPorConta.zerar()
  vi.restoreAllMocks()
  limiteLogin.zerar()
  limiteLoginPorIp.zerar()
  limiteLoginPorEmail.zerar()
  limiteCadastroPorIp.zerar()
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
    expect(eu.body).toEqual({
      usuario: { nome: 'Helena Souza', email: 'helena@empresa.com.br' },
    })
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

  it('exige maiúscula, minúscula, número e símbolo na senha', async () => {
    const app = criarApp()
    const fracas = ['senha-forte-1', 'SENHA-FORTE-1', 'Senha-forte', 'Senhaforte1', '12345678']
    for (const senha of fracas) {
      const resposta = await cadastrar(request.agent(app), { ...helena, senha })

      expect(resposta.status).toBe(400)
      expect(resposta.body.campos).toEqual({
        senha: 'Use pelo menos uma letra maiúscula, uma minúscula, um número e um símbolo.',
      })
    }
    expect(banco.usuarios).toHaveLength(0)

    // letra acentuada conta como letra
    expect((await cadastrar(request.agent(app), { ...helena, senha: 'Ção!1234' })).status).toBe(201)
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
    expect(entrar.body.usuario).toEqual({
      nome: 'Helena Souza',
      email: 'helena@empresa.com.br',
    })
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

// Limites por IP aprovados pelo João em 16/11/2026; trust proxy medido no Render em 17/11/2026
describe('limites por IP', () => {
  async function entrar(
    app: ReturnType<typeof criarApp>,
    ip: string,
    email: string,
    senha: string,
  ) {
    return request(app).post('/api/auth/entrar').set(vindoDe(ip)).send({ email, senha })
  }

  it('quem erra a senha de outra pessoa não trava o dono, que entra de outro IP', async () => {
    await cadastrar(request.agent(criarApp()))
    const app = criarApp()
    for (let i = 0; i < MAX_TENTATIVAS; i++) {
      await entrar(app, '198.51.100.1', helena.email, 'errada-123')
    }

    expect((await entrar(app, '198.51.100.1', helena.email, helena.senha)).status).toBe(429)
    expect((await entrar(app, '203.0.113.5', helena.email, helena.senha)).status).toBe(200)
  })

  it('X-Forwarded-For inventado não engana o limite', async () => {
    await cadastrar(request.agent(criarApp()))
    const app = criarApp()
    for (let i = 0; i < MAX_TENTATIVAS; i++) {
      await request(app)
        .post('/api/auth/entrar')
        .set({ 'X-Forwarded-For': `10.0.0.${i}, ${vindoDe('198.51.100.1')['X-Forwarded-For']}` })
        .send({ email: helena.email, senha: 'errada-123' })
    }

    expect((await entrar(app, '198.51.100.1', helena.email, helena.senha)).status).toBe(429)
  })

  it(`um IP que erra em muitas contas é barrado depois de ${limiteLoginPorIp.maximo} erros`, async () => {
    const app = criarApp()
    for (let i = 0; i < limiteLoginPorIp.maximo; i++) {
      await entrar(app, '198.51.100.2', `alvo${i}@empresa.com.br`, 'senha-comum-1')
    }

    const resposta = await entrar(app, '198.51.100.2', 'outro@empresa.com.br', 'senha-comum-1')
    expect(resposta.status).toBe(429)
  })

  it('login certo não conta como erro do IP (escritório com muita gente)', async () => {
    await cadastrar(request.agent(criarApp()))
    const app = criarApp()
    for (let i = 0; i <= limiteLoginPorIp.maximo; i++) {
      expect((await entrar(app, '203.0.113.9', helena.email, helena.senha)).status).toBe(200)
    }
  })

  it('um login certo desconta só a si mesmo: não zera os erros do IP', async () => {
    await cadastrar(request.agent(criarApp()))
    const app = criarApp()
    const ip = '198.51.100.4'
    for (let i = 0; i < limiteLoginPorIp.maximo - 1; i++) {
      await entrar(app, ip, `alvo${i}@empresa.com.br`, 'senha-comum-1')
    }
    expect((await entrar(app, ip, helena.email, helena.senha)).status).toBe(200)

    expect((await entrar(app, ip, 'mais-um@empresa.com.br', 'senha-comum-1')).status).toBe(401)
    expect((await entrar(app, ip, 'outro@empresa.com.br', 'senha-comum-1')).status).toBe(429)
  })

  it(`ataque de muitos IPs a uma conta para em ${limiteLoginPorEmail.maximo} erros por hora`, async () => {
    await cadastrar(request.agent(criarApp()))
    const app = criarApp()
    for (let i = 0; i < limiteLoginPorEmail.maximo; i++) {
      await entrar(app, `198.51.${100 + Math.floor(i / 250)}.${i % 250}`, helena.email, 'errada-1')
    }

    const resposta = await entrar(app, '203.0.113.20', helena.email, helena.senha)
    expect(resposta.status).toBe(429)
    expect(resposta.body.erro).toMatch(/Tente de novo em 1 hora/)
  })

  it('IPv6: trocar de endereço dentro do mesmo /64 não fura o limite', async () => {
    await cadastrar(request.agent(criarApp()))
    const app = criarApp()
    for (let i = 1; i <= MAX_TENTATIVAS; i++) {
      await entrar(app, `2001:db8::${i}`, helena.email, 'errada-123')
    }

    expect((await entrar(app, '2001:db8::99', helena.email, helena.senha)).status).toBe(429)
  })

  it('banco fora do ar não conta como tentativa errada', async () => {
    const { db } = await import('../db.js')
    const original = db.usuario.findUnique
    db.usuario.findUnique = (() => Promise.reject(new Error('banco fora do ar'))) as never
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = criarApp()
    for (let i = 0; i < MAX_TENTATIVAS; i++) {
      expect((await entrar(app, '198.51.100.5', helena.email, 'qualquer-1')).status).toBe(500)
    }
    db.usuario.findUnique = original
    log.mockRestore()
    await cadastrar(request.agent(criarApp()))

    expect((await entrar(app, '198.51.100.5', helena.email, helena.senha)).status).toBe(200)
  })

  it(`cadastro: até ${limiteCadastroPorIp.maximo} contas por IP por hora`, async () => {
    const app = criarApp()
    for (let i = 0; i < limiteCadastroPorIp.maximo; i++) {
      const resposta = await request(app)
        .post('/api/auth/cadastro')
        .set(vindoDe('198.51.100.3'))
        .send({ ...helena, email: `conta${i}@empresa.com.br` })
      expect(resposta.status).toBe(201)
    }

    const bloqueada = await request(app)
      .post('/api/auth/cadastro')
      .set(vindoDe('198.51.100.3'))
      .send({ ...helena, email: 'mais-uma@empresa.com.br' })
    const outroIp = await request(app)
      .post('/api/auth/cadastro')
      .set(vindoDe('203.0.113.4'))
      .send({ ...helena, email: 'mais-uma@empresa.com.br' })
    expect(bloqueada.status).toBe(429)
    expect(bloqueada.body.erro).toMatch(/Tente de novo em 1 hora/)
    expect(outroIp.status).toBe(201)
  })
})

// Achados da revisão de segurança de 16/11/2026 (relatório na pasta privada)
describe('proteções', () => {
  it('corpo grande demais é recusado antes de chegar às rotas (evita travar a regex do e-mail)', async () => {
    const resposta = await request(criarApp())
      .post('/api/auth/cadastro')
      .send({ nome: 'X', email: `${'a'.repeat(20_000)}@`, senha: 'senha-forte-1' })

    expect(resposta.status).toBe(413)
    expect(banco.usuarios).toHaveLength(0)
  })

  it('e-mail acima de 254 caracteres é recusado no cadastro', async () => {
    const resposta = await request(criarApp())
      .post('/api/auth/cadastro')
      .send({ ...helena, email: `${'a'.repeat(250)}@empresa.com.br` })

    expect(resposta.status).toBe(400)
    expect(resposta.body.campos.email).toMatch(/Digite um e-mail válido/)
  })

  it(`tentativas simultâneas não passam de ${MAX_TENTATIVAS}`, async () => {
    const dados = { ...helena, email: 'simultaneo@empresa.com.br' }
    await cadastrar(request.agent(criarApp()), dados)
    const app = criarApp()

    const respostas = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app).post('/api/auth/entrar').send({ email: dados.email, senha: 'errada-123' }),
      ),
    )

    expect(respostas.filter((r) => r.status === 401).length).toBeLessThanOrEqual(MAX_TENTATIVAS)
    expect(respostas.filter((r) => r.status === 429).length).toBeGreaterThanOrEqual(5)
  })

  it('login com e-mail ou senha longos demais recebe a mesma mensagem genérica', async () => {
    const app = criarApp()
    const emailLongo = await request(app)
      .post('/api/auth/entrar')
      .send({ email: `${'a'.repeat(300)}@empresa.com.br`, senha: 'qualquer-1' })
    const senhaLonga = await request(app)
      .post('/api/auth/entrar')
      .send({ email: 'helena@empresa.com.br', senha: 'a'.repeat(200) })

    expect(emailLongo.status).toBe(401)
    expect(senhaLonga.body).toEqual({ erro: 'E-mail ou senha incorretos.' })
  })

  it('outro site não consegue deslogar nem entrar (CSRF)', async () => {
    const app = criarApp()

    const porOutroSite = await request(app)
      .post('/api/auth/sair')
      .set('Sec-Fetch-Site', 'cross-site')
    const porOrigemEstranha = await request(app)
      .post('/api/auth/entrar')
      .set('Origin', 'https://mal.exemplo')
      .send({ email: helena.email, senha: helena.senha })
    const pelasTelas = await request(app)
      .post('/api/auth/sair')
      .set('Sec-Fetch-Site', 'same-origin')

    expect(porOutroSite.status).toBe(403)
    expect(porOrigemEstranha.status).toBe(403)
    expect(pelasTelas.status).toBe(204)
  })
})

describe('excluir a conta', () => {
  async function entrarComoHelena() {
    const agente = request.agent(criarApp())
    await cadastrar(agente)
    return agente
  }
  const excluir = (agente: ReturnType<typeof request.agent>, senha: unknown) =>
    agente.post('/api/auth/excluir-conta').send({ senha })

  it('com a senha certa apaga a conta, as sessões e as avaliações, e tira o cookie', async () => {
    const agente = await entrarComoHelena()
    const outraSessao = request.agent(criarApp())
    await outraSessao.post('/api/auth/entrar').send({ email: helena.email, senha: helena.senha })
    banco.avaliacoes.push({ id: 'a1', usuarioId: 'u1', status: 'CONCLUIDA', criadaEm: new Date() })
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const resposta = await excluir(agente, helena.senha)

    expect(resposta.status).toBe(204)
    expect(banco.usuarios).toEqual([])
    expect(banco.sessoes).toEqual([])
    expect(banco.avaliacoes).toEqual([])
    expect(String(resposta.headers['set-cookie'])).toMatch(/sessao=;/)
    expect((await agente.get('/api/auth/eu')).status).toBe(401)
    expect((await outraSessao.get('/api/auth/eu')).status).toBe(401)
    // log com o id, sem o e-mail
    expect(log).toHaveBeenCalledWith('Conta excluída: u1')
    log.mockRestore()
  })

  it('sem login → 401', async () => {
    expect((await request(criarApp()).post('/api/auth/excluir-conta').send({})).status).toBe(401)
  })

  it('sem senha pede a senha; com a senha errada, avisa no campo, loga e não apaga', async () => {
    const agente = await entrarComoHelena()
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    const vazia = await excluir(agente, undefined)
    const errada = await excluir(agente, 'Outra-senha-1')

    expect(vazia.status).toBe(400)
    expect(vazia.body.campos).toEqual({ senha: 'Digite sua senha para confirmar.' })
    expect(errada.status).toBe(400)
    expect(errada.body.campos).toEqual({ senha: 'Senha incorreta. Confira e tente de novo.' })
    expect(log).toHaveBeenCalledWith('Exclusão de conta recusada (senha errada): conta u1')
    expect(banco.usuarios).toHaveLength(1)
    log.mockRestore()
  })

  it(`depois de ${limiteExclusaoPorConta.maximo} senhas erradas → 429, mesmo com a senha certa; o login segue livre`, async () => {
    const agente = await entrarComoHelena()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    for (let i = 0; i < limiteExclusaoPorConta.maximo; i++) await excluir(agente, 'Outra-senha-1')

    const resposta = await excluir(agente, helena.senha)

    expect(resposta.status).toBe(429)
    expect(banco.usuarios).toHaveLength(1)
    // limite separado: errar a confirmação não trava a entrada na conta
    const entrar = await request(criarApp())
      .post('/api/auth/entrar')
      .send({ email: helena.email, senha: helena.senha })
    expect(entrar.status).toBe(200)
  })

  it('login travado por ataque à conta não impede o dono de excluir', async () => {
    const agente = await entrarComoHelena()
    for (let i = 0; i < limiteLoginPorEmail.maximo; i++)
      limiteLoginPorEmail.registrar(helena.email.toLowerCase())
    vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect((await excluir(agente, helena.senha)).status).toBe(204)
  })

  it('dois pedidos juntos com a senha certa: um registro só no log', async () => {
    const agente = await entrarComoHelena()
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {})

    await Promise.all([excluir(agente, helena.senha), excluir(agente, helena.senha)])

    expect(log).toHaveBeenCalledTimes(1)
  })

  it('análise antiga que ainda está na fila desta instância → 409', async () => {
    const agente = await entrarComoHelena()
    const antiga = new Date(Date.now() - 30 * 60_000)
    banco.avaliacoes.push({ id: 'a1', usuarioId: 'u1', status: 'ANALISANDO', criadaEm: antiga })
    vi.spyOn(fila, 'posicao').mockImplementation((id) => (id === 'a1' ? 0 : null))

    expect((await excluir(agente, helena.senha)).status).toBe(409)
    expect(banco.usuarios).toHaveLength(1)
  })

  it('com uma análise em andamento → 409 e não apaga', async () => {
    const agente = await entrarComoHelena()
    banco.avaliacoes.push({ id: 'a1', usuarioId: 'u1', status: 'NA_FILA', criadaEm: new Date() })

    const resposta = await excluir(agente, helena.senha)

    expect(resposta.status).toBe(409)
    expect(resposta.body).toEqual({
      erro: 'Você tem uma análise em andamento. Espere ela terminar para excluir a conta.',
    })
    expect(banco.usuarios).toHaveLength(1)
  })

  it('pendente que morreu sem dono (mais de 10 min, fora da fila) não impede', async () => {
    const agente = await entrarComoHelena()
    const antiga = new Date(Date.now() - 11 * 60_000)
    banco.avaliacoes.push({ id: 'a1', usuarioId: 'u1', status: 'ANALISANDO', criadaEm: antiga })
    const log = vi.spyOn(console, 'warn').mockImplementation(() => {})

    expect((await excluir(agente, helena.senha)).status).toBe(204)
    log.mockRestore()
  })
})
