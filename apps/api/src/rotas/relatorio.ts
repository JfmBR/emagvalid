import { Router } from 'express'
import { CAMPOS_DO_RESULTADO, resultadoDaAvaliacao } from '../analise/resultado.js'
import { exigirLogin, type UsuarioDaSessao } from '../auth/sessao.js'
import { limitePdfPorConta } from '../auth/tentativas.js'
import { db } from '../db.js'
import { htmlDoRelatorio, rodapeDoRelatorio } from '../relatorio/html.js'
import { GeradorOcupado, gerarPdf } from '../relatorio/pdf.js'
import { UUID } from './avaliacoes.js'

// Montado em /api/avaliacoes, ao lado de rotasAvaliacoes
export const rotasRelatorio = Router()

// Data no nome do arquivo, no fuso de Brasília (en-CA dá AAAA-MM-DD)
const diaBrasilia = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' })

// Relatório em PDF de uma avaliação concluída (RF12, RF13), só no plano pago (RF21).
// Gerado na hora, um por vez (design de 19/11/2026); nada fica guardado.
rotasRelatorio.get('/:id/pdf', exigirLogin, async (req, res) => {
  const usuario = res.locals.usuario as UsuarioDaSessao
  const id = typeof req.params.id === 'string' ? req.params.id.toLowerCase() : ''
  const naoEncontrada = () => res.status(404).json({ erro: 'Avaliação não encontrada.' })
  if (!UUID.test(id)) return naoEncontrada()

  // 404 antes do 403: quem não tem plano também não descobre se o id existe
  const avaliacao = await db.avaliacao.findFirst({
    where: { id, usuarioId: usuario.id },
    select: {
      url: true,
      urlFinal: true,
      status: true,
      criadaEm: true,
      concluidaEm: true,
      ...CAMPOS_DO_RESULTADO,
    },
  })
  if (!avaliacao) return naoEncontrada()
  if (!usuario.planoPago) {
    return res.status(403).json({ erro: 'O relatório em PDF faz parte do plano pago.' })
  }
  if (avaliacao.status !== 'CONCLUIDA') {
    return res
      .status(409)
      .json({ erro: 'Esta avaliação não tem resultado para gerar o relatório.' })
  }
  if (limitePdfPorConta.bloqueado(usuario.id)) {
    return res.status(429).json({
      erro: `Você chegou ao limite de ${limitePdfPorConta.maximo} relatórios por hora. Tente de novo mais tarde.`,
    })
  }
  limitePdfPorConta.registrar(usuario.id)

  const pagina = avaliacao.urlFinal ?? avaliacao.url
  const avaliadaEm = avaliacao.concluidaEm ?? avaliacao.criadaEm
  try {
    const pdf = await gerarPdf(
      htmlDoRelatorio({
        pagina,
        nomeDaConta: usuario.nome,
        avaliadaEm,
        resultado: resultadoDaAvaliacao(avaliacao),
      }),
      rodapeDoRelatorio(new Date()),
    )
    const host = URL.parse(pagina)?.hostname || 'pagina'
    res
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="acessaweb-${host}-${diaBrasilia.format(avaliadaEm)}.pdf"`,
        'Cache-Control': 'no-store',
      })
      .send(pdf)
  } catch (erro) {
    if (erro instanceof GeradorOcupado) {
      // não foi culpa da pessoa: o pedido não conta no limite
      limitePdfPorConta.descontar(usuario.id)
      return res
        .status(503)
        .set('Retry-After', '5')
        .json({ erro: 'Outro relatório está sendo gerado. Tente de novo em instantes.' })
    }
    // oxlint-disable-next-line no-console
    console.error('Falha ao gerar o PDF da avaliação', id, erro)
    res.status(500).json({ erro: 'Não conseguimos gerar o relatório. Tente de novo em instantes.' })
  }
})
