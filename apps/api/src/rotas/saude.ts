import { Router } from 'express'

export const rotasSaude = Router()

// Usada pelo front-end e pela hospedagem para saber se a API está no ar
rotasSaude.get('/', (_req, res) => {
  res.json({ status: 'ok' })
})
