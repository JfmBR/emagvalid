// Aplica o tema salvo antes de o navegador pintar a página (sem piscar no tema errado).
// Script clássico no <head>: roda antes do CSS e do app. A CSP só aceita script do próprio site,
// por isso fica neste arquivo e não inline. Mesmas regras de apps/web/src/tema.ts (temaDaPagina).
;(function () {
  try {
    var tema = localStorage.getItem('acessaweb-tema')
    if (localStorage.getItem('acessaweb-contraste') === 'sim') tema = 'contraste'
    if (tema === 'contraste' || tema === 'claro' || tema === 'escuro') {
      document.documentElement.dataset.theme = tema
    }
  } catch {
    // sem armazenamento: a página segue o tema do sistema
  }
})()
