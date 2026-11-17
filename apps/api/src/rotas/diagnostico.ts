import { Router } from 'express'

export const rotasDiagnostico = Router()

// shortcut: rota TEMPORÁRIA (17/11/2026) para descobrir quantos proxies o Render põe na frente da API
// e se o IP repassado pode ser falsificado; sai na PR dos limites por IP.
// Devolve só os cabeçalhos do próprio pedido de quem chama: não expõe dado de outra pessoa.
rotasDiagnostico.get('/ip', (req, res) => {
  res.json({
    xForwardedFor: req.get('x-forwarded-for') ?? null,
    forwarded: req.get('forwarded') ?? null,
    xRealIp: req.get('x-real-ip') ?? null,
    cfConnectingIp: req.get('cf-connecting-ip') ?? null,
    trueClientIp: req.get('true-client-ip') ?? null,
    xForwardedProto: req.get('x-forwarded-proto') ?? null,
    remoto: req.socket.remoteAddress ?? null,
  })
})
