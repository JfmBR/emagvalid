import { Router } from 'express'
import { classificarEndereco, MSG_URL, prepararUrl } from '../analise/endereco.js'
import { andamento, fila } from '../analise/executar.js'
import { exigirLogin, type UsuarioDaSessao } from '../auth/sessao.js'
import { db } from '../db.js'

export const rotasAvaliacoes = Router()

const MAX_POR_HORA = 10 // RNF10
const UMA_HORA_MS = 60 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MSG_PENDENTE = 'Você já tem uma análise em andamento. Espere ela terminar para começar outra.'
const MSG_LIMITE = `Você chegou ao limite de ${MAX_POR_HORA} análises por hora. Tente de novo mais tarde.`

// shortcut: a trava vive na memória de uma instância só, como a fila; com mais de uma instância, o count do banco ainda barra o caso comum
const criando = new Set<string>()

rotasAvaliacoes.post('/', exigirLogin, async (req, res) => {
  const { id: usuarioId } = res.locals.usuario as UsuarioDaSessao
  const texto = typeof req.body?.url === 'string' ? req.body.url : ''

  const preparada = prepararUrl(texto)
  if ('erro' in preparada) {
    res.status(400).json({ erro: 'Confira os campos marcados.', campos: { url: preparada.erro } })
    return
  }
  const { url } = preparada

  const tipo = await classificarEndereco(url.hostname)
  if (tipo !== 'publico') {
    if (tipo === 'interno') {
      // Log de segurança (decisão 13): a conta e o host, nunca a URL completa
      // oxlint-disable-next-line no-console
      console.error(`Endereço interno recusado: conta ${usuarioId}, host ${url.hostname}`)
    }
    res.status(400).json({ erro: 'Confira os campos marcados.', campos: { url: MSG_URL[tipo] } })
    return
  }

  // dois cliques rápidos: o segundo pedido chega antes de o primeiro gravar, então o count sozinho não vê
  if (criando.has(usuarioId)) {
    res.status(409).json({ erro: MSG_PENDENTE })
    return
  }
  criando.add(usuarioId)
  try {
    // conta pelo banco, não pela memória: o limite vale depois de o Render reiniciar
    const pendentes = await db.avaliacao.count({
      where: { usuarioId, status: { in: ['NA_FILA', 'ANALISANDO'] } },
    })
    if (pendentes > 0) {
      res.status(409).json({ erro: MSG_PENDENTE })
      return
    }
    const naUltimaHora = await db.avaliacao.count({
      where: { usuarioId, criadaEm: { gte: new Date(Date.now() - UMA_HORA_MS) } },
    })
    if (naUltimaHora >= MAX_POR_HORA) {
      res.status(429).json({ erro: MSG_LIMITE })
      return
    }

    const { id } = await db.avaliacao.create({
      data: { usuarioId, url: url.href },
      select: { id: true },
    })
    fila.adicionar(id)
    res.status(202).json({ avaliacao: { id } })
  } finally {
    criando.delete(usuarioId)
  }
})

rotasAvaliacoes.get('/:id', exigirLogin, async (req, res) => {
  const { id: usuarioId } = res.locals.usuario as UsuarioDaSessao
  const id = req.params.id
  const naoEncontrada = () => res.status(404).json({ erro: 'Avaliação não encontrada.' })
  // texto que não é UUID nem chega ao banco
  if (typeof id !== 'string' || !UUID.test(id)) return naoEncontrada()

  // a avaliação de outra conta também dá 404: não revela que o id existe
  const avaliacao = await db.avaliacao.findFirst({
    where: { id, usuarioId },
    select: {
      url: true,
      urlFinal: true,
      status: true,
      paginaGrande: true,
      mensagemErro: true,
      falhas: {
        select: {
          requisitoEmag: true,
          descricao: true,
          prioridade: true,
          seletor: true,
          trecho: true,
          revisaoHumana: true,
        },
      },
    },
  })
  if (!avaliacao) return naoEncontrada()

  const { status } = avaliacao
  // enquanto roda, o estado vive na memória; depois, vale o que foi gravado
  const emAndamento = status === 'ANALISANDO' ? andamento.get(id) : undefined
  res.json({
    avaliacao: {
      id,
      url: avaliacao.url,
      urlFinal: avaliacao.urlFinal,
      status,
      etapa: emAndamento?.etapa ?? null,
      posicaoNaFila: status === 'NA_FILA' ? fila.posicao(id) : null,
      paginaGrande: emAndamento?.paginaGrande ?? avaliacao.paginaGrande,
      mensagemErro: avaliacao.mensagemErro,
      falhas: status === 'CONCLUIDA' ? avaliacao.falhas : [],
    },
  })
})
