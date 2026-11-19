import { PESO, requisitos } from '../emag/requisitos.js'

// Nota de 0 a 100 (RF05, decisão de 05/11/2026): 100 × pesos aprovados ÷ pesos aplicáveis.
// Fonte: projeto/docs/rascunhos/Cobertura_eMAG_axe-core.md, "Cálculo da nota".

const peso = (numero: string) => {
  const prioridade = requisitos.find((r) => r.numero === numero)?.prioridade
  return prioridade ? PESO[prioridade] : 0
}

// Números dos requisitos com prioridade ligados a essas regras do axe-core, sem repetir, na ordem do eMAG
export function requisitosDasRegras(regras: string[]): string[] {
  const conjunto = new Set(regras)
  return requisitos
    .filter((r) => r.prioridade && r.regras.some((regra) => conjunto.has(regra)))
    .map((r) => r.numero)
}

// Aplicável: o axe achou elemento para avaliar. Reprovado: tem ao menos uma falha gravada.
export function calcularNota(aplicaveis: string[], reprovados: string[]): number | null {
  const total = aplicaveis.reduce((soma, numero) => soma + peso(numero), 0)
  if (total === 0) return null
  const aprovados = aplicaveis.filter((numero) => !reprovados.includes(numero))
  const pontos = aprovados.reduce((soma, numero) => soma + peso(numero), 0)
  return Math.round((100 * pontos) / total)
}
