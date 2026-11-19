import { Router } from 'express'
import { classificarEndereco, MSG_URL, prepararUrl } from '../analise/endereco.js'
import { andamento, fila, MENSAGEM_ERRO } from '../analise/executar.js'
import { chaveDoIp } from '../auth/ip.js'
import { exigirLogin, type UsuarioDaSessao } from '../auth/sessao.js'
import { limiteAvaliacaoPorConta, limiteAvaliacaoPorIp } from '../auth/tentativas.js'
import { db } from '../db.js'

export const rotasAvaliacoes = Router()

const MAX_POR_HORA = 10 // RNF10
const UMA_HORA_MS = 60 * 60 * 1000
// Teto da fila de todas as contas (decisão do João, 19/11/2026): com até 60 s por análise, a última
// espera cerca de 10 min
const MAX_NA_FILA = 10
// Pendente fora da fila desta instância e mais velha que isso morreu sem dono (deploy ou banco fora):
// não trava mais a conta e vira ERRO quando a Tela 4 pergunta (decisão do João, 19/11/2026)
const PRAZO_PENDENTE_MS = 10 * 60 * 1000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MSG_PENDENTE = 'Você já tem uma análise em andamento. Espere ela terminar para começar outra.'
const MSG_MUITOS_PEDIDOS = 'Muitas tentativas. Tente de novo em 15 minutos.'
const MSG_LIMITE = `Você chegou ao limite de ${MAX_POR_HORA} análises por hora. Tente de novo mais tarde.`
const MSG_FILA_CHEIA = 'Há muitas análises na fila agora. Tente de novo em alguns minutos.'

// Conta pelo banco, não pela memória: a regra vale depois de o Render reiniciar. Viva: ainda na fila
// desta instância (a que está rodando também) ou recente demais para ter morrido. Também barra a
// exclusão da conta (rotas/auth.ts).
export async function temAnaliseViva(usuarioId: string) {
  const pendentes = await db.avaliacao.findMany({
    where: { usuarioId, status: { in: ['NA_FILA', 'ANALISANDO'] } },
    select: { id: true, criadaEm: true },
  })
  const recente = Date.now() - PRAZO_PENDENTE_MS
  return pendentes.some((p) => fila.posicao(p.id) !== null || p.criadaEm.getTime() >= recente)
}

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

  // Todo pedido com URL bem formada conta, mesmo o recusado depois: sem isso, as respostas diferentes
  // (interno, inexistente, ok) serviriam de oráculo do DNS interno. Conta antes de qualquer await.
  const ip = chaveDoIp(req.ip ?? 'desconhecido')
  if (limiteAvaliacaoPorConta.bloqueado(usuarioId) || limiteAvaliacaoPorIp.bloqueado(ip)) {
    res.status(429).json({ erro: MSG_MUITOS_PEDIDOS })
    return
  }
  limiteAvaliacaoPorConta.registrar(usuarioId)
  limiteAvaliacaoPorIp.registrar(ip)

  // dois cliques rápidos: o segundo pedido chega antes de o primeiro gravar, então o count sozinho não vê
  if (criando.has(usuarioId)) {
    res.status(409).json({ erro: MSG_PENDENTE })
    return
  }
  criando.add(usuarioId)
  try {
    if (await temAnaliseViva(usuarioId)) {
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
    if (fila.tamanho() >= MAX_NA_FILA) {
      res.status(503).json({ erro: MSG_FILA_CHEIA })
      return
    }

    // o DNS só roda depois de todas as recusas baratas
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

    // de novo: o DNS pode levar até 3 s, e a fila enche nesse meio-tempo
    // shortcut: pedidos de contas diferentes no mesmo instante do create podem passar do teto por 1 ou 2; trocar por reserva se a fila crescer
    if (fila.tamanho() >= MAX_NA_FILA) {
      res.status(503).json({ erro: MSG_FILA_CHEIA })
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
  // minúsculas: o banco, a fila e o andamento guardam o UUID assim
  const id = typeof req.params.id === 'string' ? req.params.id.toLowerCase() : ''
  const naoEncontrada = () => res.status(404).json({ erro: 'Avaliação não encontrada.' })
  // texto que não é UUID nem chega ao banco
  if (!UUID.test(id)) return naoEncontrada()

  // a avaliação de outra conta também dá 404: não revela que o id existe
  const avaliacao = await db.avaliacao.findFirst({
    where: { id, usuarioId },
    select: {
      url: true,
      urlFinal: true,
      status: true,
      paginaGrande: true,
      mensagemErro: true,
      criadaEm: true,
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

  let { status, mensagemErro } = avaliacao
  // pendente que morreu sem dono: sem isso, a Tela 4 perguntaria para sempre
  const morta =
    (status === 'NA_FILA' || status === 'ANALISANDO') &&
    fila.posicao(id) === null &&
    avaliacao.criadaEm.getTime() < Date.now() - PRAZO_PENDENTE_MS
  if (morta) {
    // só se ainda estiver pendente: outra instância pode ter terminado nesse meio-tempo
    const { count } = await db.avaliacao.updateMany({
      where: { id, status: { in: ['NA_FILA', 'ANALISANDO'] } },
      data: { status: 'ERRO', mensagemErro: MENSAGEM_ERRO.INTERROMPIDA },
    })
    // se outra terminou antes, a próxima pergunta da Tela 4 traz o que ela gravou
    if (count > 0) {
      status = 'ERRO'
      mensagemErro = MENSAGEM_ERRO.INTERROMPIDA
    }
  }
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
      mensagemErro,
      falhas: status === 'CONCLUIDA' ? avaliacao.falhas : [],
    },
  })
})
