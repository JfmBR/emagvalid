import { Router } from 'express'
import { classificarEndereco, MSG_URL, prepararUrl } from '../analise/endereco.js'
import { andamento, fila, MENSAGEM_ERRO } from '../analise/executar.js'
import { itensDeRevisao, resultadoDaAvaliacao } from '../analise/resultado.js'
import { chaveDoIp } from '../auth/ip.js'
import { exigirLogin, type UsuarioDaSessao } from '../auth/sessao.js'
import { limiteAvaliacaoPorConta, limiteAvaliacaoPorIp } from '../auth/tentativas.js'
import { db } from '../db.js'
import type { StatusAvaliacao } from '../../generated/prisma/enums.js'

export const rotasAvaliacoes = Router()

const MAX_POR_HORA = 10 // RNF10; cada link da lista conta como uma análise
const UMA_HORA_MS = 60 * 60 * 1000
// Links por envio (RF20, decisão do João, 19/11/2026)
export const MAX_URLS = 10
// Teto da fila de todas as contas (decisão do João, 19/11/2026): com até 60 s por análise, a última
// espera cerca de 30 min. Cada conta fica em até 10 na fila por causa do limite por hora.
const MAX_NA_FILA = 30
// Pendente fora da fila desta instância e mais velha que isso morreu sem dono (deploy ou banco fora):
// vira ERRO quando a Tela 4 ou o histórico perguntam (decisão do João, 19/11/2026)
const PRAZO_PENDENTE_MS = 10 * 60 * 1000
// Histórico (Tela 8): avaliações por página, com "Mostrar mais" (decisão do João, 19/11/2026)
const POR_PAGINA = 20
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MSG_ENVIANDO = 'Seu envio anterior ainda está sendo processado. Espere um instante.'
const MSG_MUITOS_PEDIDOS = 'Muitas tentativas. Tente de novo em 15 minutos.'
const MSG_LIMITE = `Você chegou ao limite de ${MAX_POR_HORA} análises por hora. Tente de novo mais tarde.`
const MSG_FILA_CHEIA = 'Há muitas análises na fila agora. Tente de novo em alguns minutos.'
const MSG_REPETIDA = 'Este endereço já está na lista.'
const MSG_CAMPOS = 'Confira os campos marcados.'

const msgSobram = (n: number) =>
  `Você pode avaliar mais ${n} ${n === 1 ? 'página' : 'páginas'} nesta hora. Tire alguns endereços e envie de novo.`

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
// a exclusão da conta também consulta (rotas/auth.ts)
export const criando = new Set<string>()

// Uma ou mais páginas (RF20): cada link vira uma avaliação, analisada uma por vez na fila.
// A lista que não cabe (na hora ou na fila) é recusada inteira (decisão do João, 19/11/2026).
rotasAvaliacoes.post('/', exigirLogin, async (req, res) => {
  const { id: usuarioId } = res.locals.usuario as UsuarioDaSessao
  const textos: unknown[] = Array.isArray(req.body?.urls) ? req.body.urls : []
  if (textos.length === 0 || textos.length > MAX_URLS) {
    res.status(400).json({ erro: `Informe de 1 a ${MAX_URLS} endereços.` })
    return
  }

  // erro de cada link no campo dele (urls.0, urls.1…)
  const campos: Record<string, string> = {}
  const pedidas: { campo: string; url: URL }[] = []
  textos.forEach((texto, indice) => {
    const campo = `urls.${indice}`
    const preparada = prepararUrl(typeof texto === 'string' ? texto : '')
    if ('erro' in preparada) campos[campo] = preparada.erro
    else if (pedidas.some((p) => p.url.href === preparada.url.href)) campos[campo] = MSG_REPETIDA
    else pedidas.push({ campo, url: preparada.url })
  })
  if (Object.keys(campos).length > 0) {
    res.status(400).json({ erro: MSG_CAMPOS, campos })
    return
  }

  // Todo link bem formado conta, mesmo se recusado depois: sem isso, as respostas diferentes
  // (interno, inexistente, ok) serviriam de oráculo do DNS interno. Cada link conta uma vez, senão
  // uma lista de 10 sondaria 10 endereços pelo preço de um. A lista só passa se couberem todos os
  // links. Conta antes de qualquer await, para pedidos ao mesmo tempo não furarem o limite.
  const ip = chaveDoIp(req.ip ?? 'desconhecido')
  const n = pedidas.length
  if (limiteAvaliacaoPorConta.restantes(usuarioId) < n || limiteAvaliacaoPorIp.restantes(ip) < n) {
    res.status(429).json({ erro: MSG_MUITOS_PEDIDOS })
    return
  }
  for (let i = 0; i < n; i += 1) {
    limiteAvaliacaoPorConta.registrar(usuarioId)
    limiteAvaliacaoPorIp.registrar(ip)
  }
  // as recusas baratas abaixo não chegam ao DNS (não servem de sonda): devolvem as tentativas
  const recusarSemDns = (codigo: number, erro: string) => {
    for (let i = 0; i < n; i += 1) {
      limiteAvaliacaoPorConta.descontar(usuarioId)
      limiteAvaliacaoPorIp.descontar(ip)
    }
    res.status(codigo).json({ erro })
  }

  // dois envios ao mesmo tempo da mesma conta passariam juntos do limite por hora (o count não vê o outro)
  if (criando.has(usuarioId)) return recusarSemDns(409, MSG_ENVIANDO)
  criando.add(usuarioId)
  try {
    const naUltimaHora = await db.avaliacao.count({
      where: { usuarioId, criadaEm: { gte: new Date(Date.now() - UMA_HORA_MS) } },
    })
    const sobram = MAX_POR_HORA - naUltimaHora
    if (n > sobram) return recusarSemDns(429, sobram > 0 ? msgSobram(sobram) : MSG_LIMITE)
    if (fila.tamanho() + n > MAX_NA_FILA) return recusarSemDns(503, MSG_FILA_CHEIA)

    // o DNS só roda depois de todas as recusas baratas; os links em paralelo (até 3 s cada)
    const tipos = await Promise.all(pedidas.map(({ url }) => classificarEndereco(url.hostname)))
    tipos.forEach((tipo, indice) => {
      const { campo, url } = pedidas[indice]!
      if (tipo === 'publico') return
      if (tipo === 'interno') {
        // Log de segurança (decisão 13): a conta e o host, nunca a URL completa
        // oxlint-disable-next-line no-console
        console.error(`Endereço interno recusado: conta ${usuarioId}, host ${url.hostname}`)
      }
      campos[campo] = MSG_URL[tipo]
    })
    if (Object.keys(campos).length > 0) {
      res.status(400).json({ erro: MSG_CAMPOS, campos })
      return
    }

    // de novo: o DNS pode levar até 3 s, e a fila enche nesse meio-tempo
    // shortcut: pedidos de contas diferentes no mesmo instante do create podem passar do teto por alguns; trocar por reserva se a fila crescer
    if (fila.tamanho() + pedidas.length > MAX_NA_FILA) {
      res.status(503).json({ erro: MSG_FILA_CHEIA })
      return
    }
    // Tudo ou nada. O histórico mostra a mais nova em cima; com 1 ms a menos por link, o 1º link do
    // envio fica em cima e os outros seguem a ordem da lista (o now() do banco seria igual para todos)
    const agora = Date.now()
    const criadas = await db.$transaction(
      pedidas.map(({ url }, indice) =>
        db.avaliacao.create({
          data: { usuarioId, url: url.href, criadaEm: new Date(agora - indice) },
          select: { id: true },
        }),
      ),
    )
    for (const { id } of criadas) fila.adicionar(id)
    res.status(202).json({ avaliacoes: criadas.map(({ id }) => ({ id })) })
  } finally {
    criando.delete(usuarioId)
  }
})

// Pendente que morreu sem dono vira ERRO (sem isso, a Tela 4 e o histórico perguntariam para sempre).
// Devolve o status e a mensagem que valem agora.
async function conferirMorta(avaliacao: {
  id: string
  status: StatusAvaliacao
  criadaEm: Date
  mensagemErro: string | null
}) {
  const { id, status, mensagemErro, criadaEm } = avaliacao
  const morta =
    (status === 'NA_FILA' || status === 'ANALISANDO') &&
    fila.posicao(id) === null &&
    criadaEm.getTime() < Date.now() - PRAZO_PENDENTE_MS
  if (!morta) return { status, mensagemErro }
  // só se ainda estiver pendente: outra instância pode ter terminado nesse meio-tempo
  const { count } = await db.avaliacao.updateMany({
    where: { id, status: { in: ['NA_FILA', 'ANALISANDO'] } },
    data: { status: 'ERRO', mensagemErro: MENSAGEM_ERRO.INTERROMPIDA },
  })
  // se outra terminou antes, a próxima pergunta traz o que ela gravou
  return count > 0
    ? { status: 'ERRO' as const, mensagemErro: MENSAGEM_ERRO.INTERROMPIDA }
    : { status, mensagemErro }
}

// enquanto roda, o estado vive na memória; depois, vale o que foi gravado
function andamentoDe(id: string, status: StatusAvaliacao) {
  const emAndamento = status === 'ANALISANDO' ? andamento.get(id) : undefined
  return {
    etapa: emAndamento?.etapa ?? null,
    posicaoNaFila: status === 'NA_FILA' ? fila.posicao(id) : null,
    paginaGrande: emAndamento?.paginaGrande,
  }
}

// O cursor do "Mostrar mais" junta a data e o id: as avaliações de um envio podem ter a mesma data
const cursorDe = (a: { criadaEm: Date; id: string }) => `${a.criadaEm.toISOString()}_${a.id}`
function lerCursor(texto: unknown) {
  if (typeof texto !== 'string') return null
  const [data = '', id = ''] = texto.split('_')
  const criadaEm = new Date(data)
  return UUID.test(id) && !Number.isNaN(criadaEm.getTime())
    ? { criadaEm, id: id.toLowerCase() }
    : null
}

// Histórico (Tela 8, RF14): as avaliações da conta, da mais nova para a mais antiga, 20 por vez
rotasAvaliacoes.get('/', exigirLogin, async (req, res) => {
  const { id: usuarioId } = res.locals.usuario as UsuarioDaSessao
  const antes = req.query.antes === undefined ? null : lerCursor(req.query.antes)
  if (req.query.antes !== undefined && !antes) {
    res.status(400).json({ erro: 'Pedido inválido.' })
    return
  }
  const linhas = await db.avaliacao.findMany({
    where: {
      usuarioId,
      ...(antes
        ? {
            OR: [
              { criadaEm: { lt: antes.criadaEm } },
              { criadaEm: antes.criadaEm, id: { lt: antes.id } },
            ],
          }
        : {}),
    },
    orderBy: [{ criadaEm: 'desc' }, { id: 'desc' }],
    take: POR_PAGINA + 1,
    select: { id: true, url: true, status: true, criadaEm: true, nota: true, mensagemErro: true },
  })
  const pagina = linhas.slice(0, POR_PAGINA)
  const avaliacoes = await Promise.all(
    pagina.map(async (linha) => {
      const { status, mensagemErro } = await conferirMorta(linha)
      const { etapa, posicaoNaFila } = andamentoDe(linha.id, status)
      return { ...linha, status, mensagemErro, etapa, posicaoNaFila }
    }),
  )
  const ultima = pagina.at(-1)
  res.json({
    avaliacoes,
    proximo: linhas.length > POR_PAGINA && ultima ? cursorDe(ultima) : null,
  })
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
      concluidaEm: true,
      nota: true,
      requisitosAplicaveis: true,
      requisitosEmDuvida: true,
      revisados: true,
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

  const { status, mensagemErro } = await conferirMorta({ id, ...avaliacao })
  const { etapa, posicaoNaFila, paginaGrande } = andamentoDe(id, status)
  res.json({
    avaliacao: {
      id,
      url: avaliacao.url,
      urlFinal: avaliacao.urlFinal,
      status,
      etapa,
      posicaoNaFila,
      paginaGrande: paginaGrande ?? avaliacao.paginaGrande,
      mensagemErro,
      concluidaEm: avaliacao.concluidaEm,
      // Tela 5: só existe depois de concluída
      resultado: status === 'CONCLUIDA' ? resultadoDaAvaliacao(avaliacao) : null,
    },
  })
})

// Marca ou desmarca um item da revisão humana como conferido (RF09). POST, e não PUT, como as outras telas.
rotasAvaliacoes.post('/:id/revisao', exigirLogin, async (req, res) => {
  const { id: usuarioId } = res.locals.usuario as UsuarioDaSessao
  const id = typeof req.params.id === 'string' ? req.params.id.toLowerCase() : ''
  const { numero, feita } = req.body ?? {}
  if (!UUID.test(id)) return res.status(404).json({ erro: 'Avaliação não encontrada.' })
  if (typeof numero !== 'string' || typeof feita !== 'boolean') {
    return res.status(400).json({ erro: 'Pedido inválido.' })
  }

  const avaliacao = await db.avaliacao.findFirst({
    where: { id, usuarioId },
    select: { status: true, requisitosEmDuvida: true },
  })
  if (!avaliacao) return res.status(404).json({ erro: 'Avaliação não encontrada.' })
  if (avaliacao.status !== 'CONCLUIDA') {
    return res.status(409).json({ erro: 'A análise ainda não terminou.' })
  }
  if (!itensDeRevisao(avaliacao.requisitosEmDuvida).some((r) => r.numero === numero)) {
    return res.status(400).json({ erro: 'Pedido inválido.' })
  }

  // Num comando só: duas caixas marcadas ao mesmo tempo não apagam uma à outra (ler e regravar a lista apagaria)
  await db.$executeRaw`
    UPDATE avaliacoes
    SET revisados = CASE WHEN ${feita}
      THEN array_append(array_remove(revisados, ${numero}), ${numero})
      ELSE array_remove(revisados, ${numero}) END
    WHERE id = ${id} AND "usuarioId" = ${usuarioId}`
  res.status(204).end()
})
