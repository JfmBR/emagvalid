import type { resultadoDaAvaliacao } from '../analise/resultado.js'

// HTML do relatório em PDF (RF12, RF13). O Chromium do PDF roda sem JavaScript e sem rede:
// tudo vai inline, e todo texto passa por escapar, porque seletor e trecho vêm da página avaliada.

export type DadosDoRelatorio = {
  pagina: string
  nomeDaConta: string
  avaliadaEm: Date
  resultado: ReturnType<typeof resultadoDaAvaliacao>
}

const ROTULO = { alta: 'alta', media: 'média', baixa: 'baixa' } as const

const formatoBrasilia = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
})

export function dataBrasilia(data: Date): string {
  return formatoBrasilia.format(data)
}

function escapar(texto: string): string {
  return texto
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function plural(n: number, singular: string, mais: string) {
  return `${n} ${n === 1 ? singular : mais}`
}

// Cores do tema claro de design-system/tokens.css; fonte do sistema, sem nada externo
const CSS = `
  @page { size: A4; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #16202e; }
  h1 { font-size: 18pt; margin: 4pt 0; overflow-wrap: anywhere; }
  h2 { font-size: 14pt; margin: 18pt 0 6pt; border-bottom: 1px solid #d5dbe4; padding-bottom: 2pt; }
  h3 { font-size: 12pt; margin: 0 0 4pt; }
  p { margin: 4pt 0; }
  .sobre, .meta { color: #4a5568; }
  .aviso { border: 1px solid #7a4f00; background: #fff2cc; padding: 6pt 8pt; border-radius: 4pt; margin: 10pt 0; }
  .caixa { border: 1px solid #d5dbe4; border-radius: 4pt; padding: 8pt; margin: 8pt 0; }
  .alta { color: #b42318; } .media { color: #7a4f00; } .baixa { color: #4a5568; }
  code, pre { font-family: ui-monospace, 'DejaVu Sans Mono', monospace; font-size: 9pt; background: #eef1f6; overflow-wrap: anywhere; word-break: break-word; }
  pre { white-space: pre-wrap; padding: 4pt 6pt; margin: 2pt 0 0; border-radius: 3pt; }
  ol, ul { margin: 4pt 0; padding-left: 18pt; }
  li { margin: 3pt 0; break-inside: avoid; }
  ul.revisao { list-style: none; padding-left: 0; }
  table { border-collapse: collapse; width: 100%; font-size: 10pt; }
  th, td { border-bottom: 1px solid #d5dbe4; padding: 3pt 4pt; text-align: left; vertical-align: top; }
  thead th { border-bottom: 1px solid #16202e; }
  tr { break-inside: avoid; }
`

function resumo({ resultado }: DadosDoRelatorio) {
  const { nota, cartoes, revisao } = resultado
  const falhas = cartoes.reduce((total, c) => total + c.ocorrencias.length, 0)
  const porPrioridade = (p: keyof typeof ROTULO) => cartoes.filter((c) => c.prioridade === p).length
  const feitas = revisao.filter((r) => r.feita).length
  return `
    <h2>Resumo</h2>
    <ul>
      <li><strong>${nota === null ? 'Sem nota (avaliação anterior ao cálculo da nota)' : `Nota ${nota}/100`}</strong></li>
      <li>${plural(falhas, 'falha', 'falhas')} em ${plural(cartoes.length, 'recomendação', 'recomendações')}: ${porPrioridade('alta')} de prioridade alta, ${porPrioridade('media')} média, ${porPrioridade('baixa')} baixa</li>
      <li>Revisão humana: ${feitas} de ${plural(revisao.length, 'item conferido', 'itens conferidos')}</li>
    </ul>`
}

function falhas({ resultado }: DadosDoRelatorio) {
  const caixas = resultado.cartoes.map(
    (c) => `
    <section class="caixa">
      <h3>${escapar(`${c.numero} ${c.nome}`)}</h3>
      <p class="${c.prioridade}"><strong>Prioridade ${ROTULO[c.prioridade]}</strong>${c.revisaoHumana ? ' · Confirme à mão' : ''}</p>
      ${c.porque ? `<p><strong>Por que é falha:</strong> ${escapar(c.porque)}</p>` : ''}
      ${c.exemplo ? `<p><strong>Como corrigir:</strong></p><pre>${escapar(c.exemplo)}</pre>` : ''}
      <p><strong>Onde (${plural(c.ocorrencias.length, 'ocorrência', 'ocorrências')}):</strong></p>
      <ol>${c.ocorrencias
        .map(
          (o) => `
        <li>${escapar(o.descricao)}<br><code>${escapar(o.seletor)}</code>${o.trecho ? `<pre>${escapar(o.trecho)}</pre>` : ''}</li>`,
        )
        .join('')}
      </ol>
    </section>`,
  )
  return `
    <h2>Falhas, da mais urgente para a menos</h2>
    ${caixas.length > 0 ? caixas.join('') : '<p>Nenhuma falha automática encontrada.</p>'}`
}

function revisao({ resultado }: DadosDoRelatorio) {
  const itens = resultado.revisao.map(
    (r) => `
      <li><strong>${r.feita ? '☑ conferido' : '☐ a conferir'}</strong> · ${escapar(`${r.numero} ${r.nome}`)}${r.conferir ? `<br>${escapar(r.conferir)}` : ''}</li>`,
  )
  return `
    <h2>Revisão humana</h2>
    <p>O que a ferramenta não confere sozinha. As marcações vêm da aba "Revisão humana" do resultado.</p>
    <ul class="revisao">${itens.join('')}
    </ul>`
}

function conta({ resultado }: DadosDoRelatorio) {
  const { nota, verificacoes } = resultado
  if (nota === null) return ''
  const linhas = verificacoes.map(
    (v) => `
        <tr><th scope="row">${escapar(`${v.numero} ${v.nome}`)}</th><td>${ROTULO[v.prioridade]}</td><td>${v.peso}</td><td>${v.aprovada ? 'Aprovada' : 'Reprovada'}</td></tr>`,
  )
  return `
    <h2>Como chegamos na nota</h2>
    <table>
      <thead><tr><th scope="col">Recomendação do eMAG 3.1</th><th scope="col">Prioridade</th><th scope="col">Peso</th><th scope="col">Resultado</th></tr></thead>
      <tbody>${linhas.join('')}
      </tbody>
    </table>
    <p>Nota = 100 × soma dos pesos das recomendações aprovadas ÷ soma dos pesos das recomendações que se aplicam à página, arredondada para baixo. Peso pela prioridade: alta 3, média 2, baixa 1.</p>`
}

export function htmlDoRelatorio(dados: DadosDoRelatorio): string {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${escapar(`Relatório de acessibilidade · ${dados.pagina}`)}</title>
  <style>${CSS}</style>
</head>
<body>
  <header>
    <p class="sobre">AcessaWeb · Relatório de acessibilidade · eMAG 3.1</p>
    <h1>${escapar(dados.pagina)}</h1>
    <p class="meta">${escapar(`Avaliação de ${dataBrasilia(dados.avaliadaEm)} · Preparado para: ${dados.nomeDaConta}`)}</p>
  </header>
  <main>
    <p class="aviso">Esta nota é automática e não é certificação. Parte do eMAG só uma pessoa confere (seção "Revisão humana").</p>
    ${resumo(dados)}
    ${falhas(dados)}
    ${revisao(dados)}
    ${conta(dados)}
  </main>
</body>
</html>`
}

// footerTemplate do page.pdf: o Chromium preenche pageNumber e totalPages
export function rodapeDoRelatorio(geradoEm: Date): string {
  return `<div style="font-size:9px;width:100%;padding:0 14mm;color:#4a5568;font-family:system-ui,sans-serif">Gerado pelo AcessaWeb em ${escapar(dataBrasilia(geradoEm))} · Nota automática, não é certificação · Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`
}
