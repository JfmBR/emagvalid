(function () {
  'use strict';

  var D = window.ACESSA;
  var main = document.getElementById('conteudo');
  var anuncio = document.getElementById('anuncio');
  var CHAVE = 'acessaweb-prototipo';
  var FONTES = [100, 112.5, 125, 150];

  document.documentElement.lang = 'pt-BR';

  var JORNADA = [
    { nome: 'Diagnóstico inicial', rota: 'relatorio' },
    { nome: 'Auditoria aprofundada', rota: 'auditoria' },
    { nome: 'Relatório técnico', rota: 'recomendacoes' },
    { nome: 'Apoio à implementação', rota: 'equipes' },
    { nome: 'Validação com PcD', rota: 'validacao' },
    { nome: 'Resultado documentado', rota: 'resultado' }
  ];

  function estadoInicial() {
    return { fonte: 0, contraste: false, etapa: 1, pedido: null, contatos: [], corrigidas: [], paginas: 'ate-30' };
  }

  var estado = estadoInicial();
  try {
    var salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo) estado = Object.assign(estado, salvo);
  } catch (e) { /* o protótipo funciona sem armazenamento */ }

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* idem */ }
  }

  function esc(t) {
    return String(t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function ic(nome, classe) {
    return '<svg class="ic ' + (classe || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="#i-' + nome + '"/></svg>';
  }

  function pedido() {
    return estado.pedido || D.amostra;
  }

  function avancar(etapa) {
    if (etapa > estado.etapa) estado.etapa = etapa;
    salvar();
  }

  function dataBr(d) {
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function anel(valor, tamanho, rotulo) {
    var traco = tamanho > 100 ? 13 : 7;
    var fonte = tamanho > 100 ? 30 : 17;
    return '<svg class="anel" width="' + tamanho + '" height="' + tamanho + '" viewBox="0 0 ' + tamanho + ' ' + tamanho + '" role="img" aria-label="' + esc(rotulo) + ': ' + valor + '%">' +
      '<circle class="anel-trilho" cx="' + tamanho / 2 + '" cy="' + tamanho / 2 + '" r="' + (tamanho - traco) / 2 + '" stroke-width="' + traco + '"/>' +
      '<circle class="anel-valor" cx="' + tamanho / 2 + '" cy="' + tamanho / 2 + '" r="' + (tamanho - traco) / 2 + '" stroke-width="' + traco + '" pathLength="100" stroke-dasharray="' + valor + ' 100" transform="rotate(-90 ' + tamanho / 2 + ' ' + tamanho / 2 + ')"/>' +
      '<text class="anel-texto" x="50%" y="50%" font-size="' + fonte + '" aria-hidden="true">' + valor + '%</text></svg>';
  }

  function sev(s) {
    var classe = s === 'Alta' ? 'alta' : s === 'Média' ? 'media' : 'baixa';
    return '<span class="sev sev-' + classe + '">' + s + '</span>';
  }

  function ref(f) {
    return 'eMAG ' + f.emag + ' | WCAG ' + f.wcag;
  }

  function trilhaJornada() {
    var itens = JORNADA.map(function (e, i) {
      var n = i + 1;
      var feita = n < estado.etapa;
      var atual = n === estado.etapa;
      var situacao = feita ? ic('check') + 'Concluída' : atual ? 'Etapa atual' : 'A seguir';
      return '<li><a href="#' + e.rota + '" class="' + (feita ? 'feita' : '') + '"' + (atual ? ' aria-current="step"' : '') + '>' +
        n + '. ' + e.nome + '<small>' + situacao + '</small></a></li>';
    }).join('');
    return '<nav class="jornada" aria-label="Etapas da jornada"><ol>' + itens + '</ol></nav>';
  }

  function avisoExemplo() {
    return '<p class="aviso">' + ic('alerta') + '<span><strong>Dados de exemplo.</strong> Nesta demonstração, nenhum site é analisado. Os resultados são sempre os mesmos.</span></p>';
  }

  function linha(rotulo, valor) {
    return '<div><dt>' + rotulo + '</dt><dd>' + esc(valor) + '</dd></div>';
  }

  /* Telas */

  var ilustracao = '<svg viewBox="0 0 420 340" role="img" aria-label="Ilustração de uma pessoa usando notebook, cercada por ícones de diferentes deficiências.">' +
    '<path d="M60 340c-8-90 30-160 110-160h100c70 0 120 60 120 160z" fill="var(--onda-1)"/>' +
    '<path d="M150 340c5-60 25-95 72-95s75 35 80 95z" fill="var(--azul)"/>' +
    '<path d="M198 110c-34 4-52 38-48 80 2 26-12 40-22 56 28 16 70 10 92-6 26-20 44-112-22-130z" fill="var(--topo-bg)"/>' +
    '<rect x="204" y="200" width="36" height="58" rx="16" fill="#e8ad8c"/>' +
    '<ellipse cx="228" cy="170" rx="40" ry="48" fill="#f3bf9f"/>' +
    '<path d="M186 160c6-38 34-58 66-50 18 5 26 16 28 30-30 2-58-2-74-18-2 18-8 30-20 38z" fill="var(--topo-bg)"/>' +
    '<path d="M222 192c6 5 14 5 20 0" fill="none" stroke="#8a4a35" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="222" cy="165" r="3" fill="#2a2a2a"/><circle cx="250" cy="165" r="3" fill="#2a2a2a"/>' +
    '<path d="M268 340l26-82h98l-20 82z" fill="var(--topo-bg)"/>' +
    '<circle cx="334" cy="298" r="6" fill="var(--marca-c)"/>' +
    bolha(150, 56, 32, 'var(--azul)', 'pessoa-aberta') +
    bolha(290, 38, 32, 'var(--primaria)', 'olho-cortado') +
    bolha(372, 112, 30, 'var(--azul)', 'orelha') +
    bolha(70, 136, 30, 'var(--primaria)', 'cerebro') +
    bolha(344, 200, 32, 'var(--azul)', 'cadeira') +
    '</svg>';

  function bolha(x, y, r, cor, icone) {
    var t = r * 1.2;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + cor + '"/>' +
      '<svg x="' + (x - t / 2) + '" y="' + (y - t / 2) + '" width="' + t + '" height="' + t + '" viewBox="0 0 24 24" fill="none" stroke="var(--sobre-azul)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-' + icone + '"/></svg>';
  }

  function telaInicio() {
    return '<div class="hero"><div class="hero-dentro"><div class="hero-texto">' +
      '<p class="slogan">Mais inclusão, mais oportunidades.</p>' +
      '<h1 tabindex="-1">Acessibilidade digital, com orientação para quem precisa fazer acontecer.</h1>' +
      '<p>Analisamos seu site com base nas diretrizes do eMAG e das WCAG, identificamos as barreiras de acesso e entregamos um relatório claro, técnico e com orientações práticas de correção.</p>' +
      '</div><div class="hero-arte">' + ilustracao + '</div></div>' +
      '<div class="faixa-form"><section class="cartao" aria-labelledby="titulo-form">' +
      '<div><h2 id="titulo-form">Solicite sua análise de acessibilidade</h2><p class="ajuda">Preencha os dados e receba seu relatório em até 48 horas. Campos com * são obrigatórios.</p></div>' +
      '<form id="form-analise" novalidate><div class="formulario-grade">' +
      campo('nome', 'Nome completo', 'text', 'Seu nome', 'name') +
      campo('email', 'E-mail', 'email', 'seu@email.com', 'email') +
      campo('url', 'URL do site', 'url', 'https://exemplo.com.br', 'url') +
      '<button type="submit" class="botao botao-form">Solicitar análise ' + ic('seta') + '</button>' +
      '</div></form></section></div>' +
      '<ul class="diferenciais faixa-form">' +
      '<li>' + ic('globo') + 'Baseado no eMAG e nas WCAG</li>' +
      '<li>' + ic('doc') + 'Relatório completo e em PDF</li>' +
      '<li>' + ic('relogio') + 'Prazo de entrega de 24 a 48 horas</li>' +
      '<li>' + ic('usuario') + 'Suporte e orientação especializada</li>' +
      '</ul>' +
      '<svg class="onda" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M0 70C200 20 380 110 620 80S1000 0 1200 40V120H0Z"/><path d="M0 100C260 70 480 125 720 105S1040 60 1200 80V120H0Z"/></svg>' +
      '</div>';
  }

  function campo(id, rotulo, tipo, exemplo, auto) {
    var valor = estado.pedido ? estado.pedido[id === 'url' ? 'urlOriginal' : id] || '' : '';
    return '<div class="campo"><label for="' + id + '">' + rotulo + ' <span class="obrig" aria-hidden="true">*</span></label>' +
      '<input id="' + id + '" name="' + id + '" type="' + (tipo === 'url' ? 'text' : tipo) + '" inputmode="' + (tipo === 'text' ? 'text' : tipo) + '" placeholder="' + exemplo + '" autocomplete="' + auto + '" required value="' + esc(valor) + '">' +
      '<p class="erro-campo" id="erro-' + id + '" hidden></p></div>';
  }

  function telaComoFunciona() {
    var passos = [
      ['doc', 'Diagnóstico inicial', 'Você informa o endereço do site e recebe uma avaliação preliminar.'],
      ['engrenagem', 'Auditoria aprofundada', 'Após o seu aceite, combinamos Lighthouse, WAVE e axe-core com análise manual das barreiras.'],
      ['grafico', 'Relatório técnico', 'Você recebe evidências, prioridades e recomendações práticas de correção de código.'],
      ['usuarios', 'Apoio à implementação', 'Indicamos equipes de desenvolvimento especializadas para executar os ajustes.'],
      ['pessoa-aberta', 'Validação com PcD', 'Refazemos a verificação técnica, e pessoas com deficiência testam o site em tarefas reais.'],
      ['selo', 'Resultado documentado', 'Você recebe o relatório final e pode obter o selo AcessaWeb, de acordo com critérios públicos.']
    ].map(function (p, i) {
      return '<li class="passo"><span class="passo-icone">' + ic(p[0]) + '</span><h2>' + (i + 1) + '. ' + p[1] + '</h2><p>' + p[2] + '</p></li>';
    }).join('');
    var perfis = D.perfis.map(function (p) {
      return '<li>' + ic(p.icone) + p.nome + '</li>';
    }).join('');
    return '<div class="pagina">' +
      '<div class="intro"><p class="sobretitulo">Como funciona</p><h1 tabindex="-1">Um processo simples, transparente e eficiente.</h1>' +
      '<p>Você não precisa ser especialista em acessibilidade. Acompanhamos o caminho da descoberta à correção e à validação com pessoas reais.</p></div>' +
      '<ol class="passos">' + passos + '</ol>' +
      '<div class="grade-2"><section class="intro" aria-labelledby="t-analisa"><h2 id="t-analisa">O que analisamos</h2>' +
      '<p>Avaliamos o site com base nas 45 recomendações do eMAG 3.1 e nos critérios das WCAG, para diferentes perfis de pessoas com deficiência.</p>' +
      '<p>Ferramentas automáticas não detectam todas as barreiras. Por isso, a jornada inclui análise manual e testes de uso com pessoas com deficiência.</p></section>' +
      '<section class="cartao fundo-azul" aria-labelledby="t-perfis"><h2 id="t-perfis">Perfis de deficiência contemplados</h2><ul class="perfis-grade">' + perfis + '</ul></section></div>' +
      '<div class="faixa-missao"><span class="selo-ic">' + ic('pessoa-aberta') + '</span><p>Nosso objetivo é tornar a web mais inclusiva, acessível e humana.</p><p class="mao">Mais inclusão, mais possibilidades.</p></div>' +
      '<p class="acoes"><a class="botao" href="#inicio">Solicitar análise ' + ic('seta') + '</a></p>' +
      '</div>';
  }

  var ETAPAS_ANALISE = [
    'Carregando as páginas do site',
    'Verificando as recomendações do eMAG',
    'Verificando os critérios das WCAG',
    'Calculando as notas por perfil',
    'Montando o relatório'
  ];
  var temporizador = null;

  function telaAnalise() {
    var p = pedido();
    var itens = ETAPAS_ANALISE.map(function (t, i) {
      return '<li id="ea-' + i + '"><span class="marcador"><span class="ponto"></span></span>' + t + '</li>';
    }).join('');
    return '<div class="pagina estreita"><div class="intro"><p class="sobretitulo">Solicitação #' + D.amostra.numero + '</p>' +
      '<h1 tabindex="-1">Analisando ' + esc(p.url) + '</h1>' +
      '<p>Na demonstração, a análise leva poucos segundos. No serviço real, o relatório chega em até 48 horas.</p></div>' +
      '<section class="cartao" aria-label="Andamento da análise">' +
      '<progress id="progresso" max="100" value="0" aria-label="Progresso da análise"></progress>' +
      '<ol class="etapas-analise">' + itens + '</ol>' +
      '<div id="fim-analise" hidden class="acoes"><p class="aviso sucesso">' + ic('check') + 'Análise concluída.</p>' +
      '<a class="botao" href="#relatorio">Ver relatório ' + ic('seta') + '</a></div></section>' + avisoExemplo() + '</div>';
  }

  function rodarAnalise() {
    var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var passo = 0;
    var barra = document.getElementById('progresso');
    function marcar() {
      ETAPAS_ANALISE.forEach(function (t, i) {
        var li = document.getElementById('ea-' + i);
        var feito = i < passo;
        li.className = feito ? 'feita' : i === passo ? 'atual' : '';
        li.querySelector('.marcador').innerHTML = feito ? ic('check') : '<span class="ponto"></span>';
      });
      barra.value = (passo / ETAPAS_ANALISE.length) * 100;
      if (passo < ETAPAS_ANALISE.length) {
        anunciar(ETAPAS_ANALISE[passo]);
        passo += 1;
        temporizador = setTimeout(marcar, reduzido ? 150 : 1000);
      } else {
        document.getElementById('fim-analise').hidden = false;
        anunciar('Análise concluída. O relatório está pronto.');
        document.querySelector('#fim-analise a').focus();
      }
    }
    marcar();
  }

  function lateral(ativo) {
    var p = pedido();
    function item(rota, icone, nome) {
      return '<a href="#' + rota + '"' + (ativo === rota ? ' aria-current="true"' : '') + '>' + ic(icone) + nome + '</a>';
    }
    return '<aside class="lateral" aria-label="Dados da solicitação">' +
      '<div class="lateral-id"><span class="avatar">' + ic('usuario') + '</span><div><strong>Solicitação #' + D.amostra.numero + '</strong><br><span class="etiqueta">Concluído</span></div></div>' +
      '<dl class="dados">' + linha('Site analisado', p.url) + linha('Cliente', p.nome) + linha('E-mail', p.email) + linha('Data da solicitação', p.solicitacao) + linha('Entrega do relatório', p.entrega + ' (48h)') + '</dl>' +
      '<nav class="lateral-menu" aria-label="Seções do relatório">' +
      item('relatorio', 'casa', 'Resumo') + item('relatorio-perfis', 'usuario', 'Acessibilidade por perfil') +
      item('relatorio-falhas', 'alerta', 'Falhas encontradas') + item('recomendacoes', 'doc', 'Recomendações') +
      '</nav><a class="botao azul" href="#relatorio-pdf">' + ic('doc') + 'Abrir relatório em PDF</a></aside>';
  }

  function telaRelatorio() {
    var perfis = D.perfis.map(function (p) {
      return '<li>' + anel(p.antes, 72, p.nome) + '<span>' + p.nome + '</span></li>';
    }).join('');
    var falhas = D.falhas.filter(function (f) { return f.principal; }).map(function (f) {
      return '<li>' + sev(f.severidade) + '<div><a href="#falha-' + f.id + '">' + f.titulo + '</a><small>' + ref(f) + '</small></div><span class="ocorrencias">' + f.ocorrencias + ' ocorrências</span></li>';
    }).join('');
    return '<div class="relatorio">' + lateral('relatorio') + '<div class="conteudo-relatorio">' +
      '<div class="intro"><h1 tabindex="-1">Relatório de Acessibilidade Digital</h1><p>Análise baseada nas diretrizes do eMAG e das WCAG.</p></div>' +
      avisoExemplo() + trilhaJornada() +
      '<section class="cartao nota-geral" aria-label="Conformidade geral">' + anel(D.nota.antes, 130, 'Conformidade geral') +
      '<div><h2>Conformidade geral</h2><p>Seu site tem um bom nível de acessibilidade, mas ainda há pontos de melhoria.</p></div>' +
      '<div class="nota-status"><div>' + ic('alerta') + '<span>Status do site</span><strong>Conformidade parcial com o eMAG</strong></div>' +
      '<div>' + ic('relogio') + '<span>Prazo de entrega</span><strong>Concluído em 48h</strong></div></div></section>' +
      '<section class="cartao" id="relatorio-perfis" aria-labelledby="t-perfil"><h2 id="t-perfil" tabindex="-1">Acessibilidade por perfil de deficiência</h2><ul class="perfis-notas">' + perfis + '</ul></section>' +
      '<div class="falhas-duas"><section class="cartao" id="relatorio-falhas" aria-labelledby="t-falhas"><div class="titulo-acao"><h2 id="t-falhas" tabindex="-1">Principais falhas encontradas</h2>' +
      '<a class="link-seta" href="#recomendacoes">Ver todas as falhas ' + ic('seta') + '</a></div><ul class="lista-falhas">' + falhas + '</ul></section>' +
      '<section class="cartao fundo-azul cartao-rec" aria-labelledby="t-prox"><span class="passo-icone">' + ic('selo') + '</span><h2 id="t-prox">Próximo passo</h2>' +
      '<p>Este diagnóstico é preliminar. A auditoria aprofundada confere cada barreira e entrega as recomendações de código.</p>' +
      '<a class="botao azul" href="#auditoria">Solicitar auditoria ' + ic('seta') + '</a></section></div>' +
      '</div></div>';
  }

  function telaRecomendacoes(aberta) {
    var total = D.falhas.reduce(function (s, f) { return s + f.ocorrencias; }, 0);
    var recs = D.falhas.map(function (f, i) {
      var abrir = aberta ? f.id === aberta : i === 0;
      return '<details class="rec" id="falha-' + f.id + '"' + (abrir ? ' open' : '') + '><summary>' + sev(f.severidade) +
        '<span><h2 class="rec-titulo">' + f.titulo + '</h2><span class="ref">' + ref(f) + ' · ' + f.ocorrencias + ' ocorrências</span></span>' + ic('seta', 'abre') + '</summary>' +
        '<div class="rec-corpo">' +
        '<div><h3>Onde encontramos</h3><p>' + f.evidencia + '</p></div>' +
        '<div><h3>Impacto</h3><p>' + f.impacto + '</p></div>' +
        '<div><h3>Perfis mais afetados</h3><ul class="tags">' + f.afeta.map(function (a) { return '<li>' + a + '</li>'; }).join('') + '</ul></div>' +
        '<div><h3>Como corrigir</h3><p>' + f.correcao + '</p></div>' +
        '<div class="codigos"><div><h3>Código atual</h3><pre tabindex="0" aria-label="Código atual: ' + esc(f.titulo) + '"><code>' + esc(f.antes) + '</code></pre></div>' +
        '<div><h3>Código recomendado</h3><pre tabindex="0" aria-label="Código recomendado: ' + esc(f.titulo) + '"><code>' + esc(f.depois) + '</code></pre></div></div>' +
        '</div></details>';
    }).join('');
    return '<div class="relatorio">' + lateral('recomendacoes') + '<div class="conteudo-relatorio">' +
      '<div class="intro"><p class="sobretitulo">Etapa 3 · Relatório técnico</p><h1 tabindex="-1">Falhas e recomendações</h1>' +
      '<p>' + D.falhas.length + ' tipos de falha e ' + total + ' ocorrências. Abra cada item para ver a evidência, o impacto e o código sugerido.</p></div>' +
      (confirmacao ? '<p class="aviso sucesso">' + ic('check') + '<span>' + confirmacao + '</span></p>' : '') +
      avisoExemplo() + trilhaJornada() +
      '<div class="recs">' + recs + '</div>' +
      '<section class="cartao fundo-verde" aria-labelledby="t-quem"><h2 id="t-quem">Quem vai fazer as correções?</h2><p>Sua equipe pode usar este relatório. Se preferir, indicamos equipes especializadas.</p>' +
      '<p class="acoes"><a class="botao" href="#equipes" data-etapa="4">Conhecer as equipes ' + ic('seta') + '</a></p></section>' +
      '</div></div>';
  }

  function telaAuditoria() {
    var feita = estado.etapa >= 3;
    var opcoes = [
      ['ate-10', 'Até 10 páginas', 'Para sites institucionais pequenos.'],
      ['ate-30', 'Até 30 páginas', 'Para portais com vários serviços.'],
      ['sob-medida', 'Sob medida', 'Para sistemas e portais de grande porte.']
    ].map(function (o) {
      return '<label class="opcao"><input type="radio" name="paginas" id="p-' + o[0] + '" value="' + o[0] + '"' + (estado.paginas === o[0] ? ' checked' : '') + '><span><strong>' + o[1] + '.</strong> ' + o[2] + '</span></label>';
    }).join('');
    return '<div class="pagina estreita"><div class="intro"><p class="sobretitulo">Etapa 2 · Auditoria aprofundada</p>' +
      '<h1 tabindex="-1">Confirme o escopo da auditoria</h1><p>A auditoria começa somente depois do seu aceite. O valor é definido em proposta, de acordo com o escopo.</p></div>' +
      trilhaJornada() +
      '<div class="grade-2"><section class="cartao fundo-azul" aria-labelledby="t-inclui"><h2 id="t-inclui">O que a auditoria inclui</h2><ul class="lista-check">' +
      ['Análise manual das páginas e dos fluxos principais', 'Verificação das recomendações do eMAG e dos critérios das WCAG', 'Testes com leitor de tela, teclado e ampliação', 'Evidências, prioridades e código sugerido'].map(function (t) { return '<li>' + ic('check') + t + '</li>'; }).join('') +
      '</ul></section>' +
      '<section class="cartao" aria-labelledby="t-aceite"><h2 id="t-aceite">Seu aceite</h2>' +
      '<form id="form-auditoria" novalidate class="cartao" style="padding:0;border:0;background:none"><fieldset><legend>Tamanho do site</legend>' + opcoes + '</fieldset>' +
      '<div><label class="opcao"><input type="checkbox" id="aceite"' + (feita ? ' checked' : '') + '><span>Li o escopo e autorizo o início da auditoria.</span></label><p class="erro-campo" id="erro-aceite" hidden></p></div>' +
      '<button type="submit" class="botao">Aceitar e iniciar auditoria ' + ic('seta') + '</button></form>' +
      '<div id="aceite-ok" class="acoes"' + (feita ? '' : ' hidden') + '><p class="aviso sucesso">' + ic('check') + 'Auditoria aceita. Na demonstração, o relatório técnico já está pronto.</p><a class="botao azul" href="#recomendacoes">Ver relatório técnico ' + ic('seta') + '</a></div>' +
      '</section></div></div>';
  }

  function telaEquipes() {
    var equipes = D.equipes.map(function (e) {
      var pedido = estado.contatos.indexOf(e.id) >= 0;
      return '<article class="cartao equipe"><h2>' + e.nome + '</h2><p>' + e.foco + '</p><dl class="dados">' + linha('Pode resolver', e.resolve) + linha('Prazo estimado', e.prazo) + '</dl>' +
        '<button type="button" class="botao contorno" data-contato="' + e.id + '" aria-pressed="' + pedido + '">' + (pedido ? ic('check') + 'Contato solicitado' : 'Solicitar contato') + '<span class="so-leitor"> com ' + e.nome + '</span></button></article>';
    }).join('');
    var lista = D.falhas.map(function (f) {
      var ok = estado.corrigidas.indexOf(f.id) >= 0;
      return '<li><label class="opcao"><input type="checkbox" data-corrigida="' + f.id + '" id="c-' + f.id + '"' + (ok ? ' checked' : '') + '><span>' + f.titulo + ' <span class="ref">' + ref(f) + '</span></span></label></li>';
    }).join('');
    return '<div class="pagina"><div class="intro"><p class="sobretitulo">Etapa 4 · Apoio à implementação</p><h1 tabindex="-1">Conecte-se a quem faz as correções</h1>' +
      '<p>Indicamos equipes de acordo com as falhas do seu relatório. Você negocia diretamente com a equipe escolhida.</p></div>' +
      trilhaJornada() + '<p class="aviso">' + ic('alerta') + '<span><strong>Equipes fictícias.</strong> Os nomes servem apenas para ilustrar esta demonstração.</span></p>' +
      '<section class="equipes" aria-label="Equipes indicadas">' + equipes + '</section>' +
      '<section class="cartao" aria-labelledby="t-corr"><div class="progresso-correcoes"><h2 id="t-corr">Acompanhamento das correções</h2><span id="total-corr">' + textoCorrigidas() + '</span></div>' +
      '<ul class="lista-check">' + lista + '</ul>' +
      '<div class="acoes"><button type="button" class="botao contorno" id="marcar-todas">Marcar todas as correções como concluídas</button>' +
      '<a class="botao" href="#validacao" data-etapa="5">Solicitar validação com PcD ' + ic('seta') + '</a></div></section></div>';
  }

  function textoCorrigidas() {
    return estado.corrigidas.length + ' de ' + D.falhas.length + ' tipos de falha corrigidos';
  }

  function telaValidacao() {
    var linhas = D.testes.map(function (t) {
      var com = t.resultado !== 'Concluída';
      return '<tr><th scope="row">' + t.perfil + '</th><td>' + t.tecnologia + '</td><td>' + t.tarefa + '</td><td><span class="res' + (com ? ' ressalva' : '') + '">' + ic(com ? 'alerta' : 'check') + t.resultado + '</span></td><td>' + t.relato + '</td></tr>';
    }).join('');
    return '<div class="pagina"><div class="intro"><p class="sobretitulo">Etapa 5 · Validação com PcD</p><h1 tabindex="-1">O site funciona para quem precisa dele?</h1>' +
      '<p>Depois das correções, repetimos a verificação técnica. Em seguida, pessoas com deficiência fazem tarefas reais no site.</p></div>' +
      trilhaJornada() +
      '<p class="aviso">' + ic('alerta') + '<span><strong>Relatos ilustrativos.</strong> Nenhuma pessoa participou desta demonstração.</span></p>' +
      '<div class="grade-2"><section class="cartao" aria-labelledby="t-tec"><h2 id="t-tec">Nova verificação técnica</h2><ul class="lista-check">' +
      '<li>' + ic('check') + '48 das 50 ocorrências foram corrigidas</li><li>' + ic('alerta') + '2 ocorrências de baixa severidade continuam abertas</li></ul></section>' +
      '<section class="cartao" aria-labelledby="t-uso"><h2 id="t-uso">Testes de uso</h2><ul class="lista-check">' +
      '<li>' + ic('check') + '5 de 6 tarefas foram concluídas sem ressalvas</li><li>' + ic('alerta') + '1 tarefa foi concluída com ressalva sobre a linguagem do texto</li></ul></section></div>' +
      '<section class="cartao" aria-labelledby="t-tab"><h2 id="t-tab">Resultado por perfil</h2><div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela de resultados por perfil"><table class="tabela-validacao"><thead><tr><th scope="col">Perfil</th><th scope="col">Recurso usado</th><th scope="col">Tarefa</th><th scope="col">Resultado</th><th scope="col">Relato</th></tr></thead><tbody>' + linhas + '</tbody></table></div></section>' +
      '<p class="acoes"><a class="botao" href="#resultado" data-etapa="6">Ver resultado final ' + ic('seta') + '</a></p></div>';
  }

  function telaResultado() {
    var p = pedido();
    var linhas = D.perfis.map(function (f) {
      return '<tr><th scope="row">' + f.nome + '</th><td class="num">' + f.antes + '%</td><td class="num">' + f.depois + '%</td><td class="barra-celula"><div class="barra" aria-hidden="true"><i style="width:' + f.depois + '%"></i></div></td></tr>';
    }).join('');
    return '<div class="pagina"><div class="intro"><p class="sobretitulo">Etapa 6 · Resultado documentado</p><h1 tabindex="-1">Da análise à inclusão real</h1>' +
      '<p>O relatório final registra o que mudou em ' + esc(p.url) + ' e o que ainda precisa de atenção.</p></div>' +
      trilhaJornada() + avisoExemplo() +
      '<div class="grade-2"><section class="cartao" aria-labelledby="t-comp"><h2 id="t-comp">Conformidade geral</h2><div class="antes-depois"><div class="ad">' + anel(D.nota.antes, 130, 'Antes das correções') + 'Antes</div><span class="ad-seta">' + ic('seta') + '</span><div class="ad">' + anel(D.nota.depois, 130, 'Depois das correções') + 'Depois</div></div>' +
      '<p class="ajuda">As 2 ocorrências abertas e a ressalva sobre linguagem seguem no plano de melhoria.</p></section>' +
      '<section class="cartao fundo-verde" aria-labelledby="t-selo"><h2 id="t-selo">Selo AcessaWeb</h2>' +
      '<div class="selo">' + ic('selo') + '<strong>Validado com PcD</strong><span>AcessaWeb · Avaliação própria</span></div>' +
      '<p class="ajuda"><strong>O selo não é uma certificação oficial do governo.</strong> Ele indica uma avaliação própria do AcessaWeb, com critérios públicos e testes com pessoas com deficiência, válida para a versão avaliada do site.</p></section></div>' +
      '<section class="cartao" aria-labelledby="t-evol"><h2 id="t-evol">Evolução por perfil</h2><div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela de evolução por perfil"><table><thead><tr><th scope="col">Perfil</th><th scope="col" class="num">Antes</th><th scope="col" class="num">Depois</th><th scope="col"><span class="so-leitor">Gráfico de </span>Nota atual</th></tr></thead><tbody>' + linhas + '</tbody></table></div></section>' +
      '<section class="cartao fundo-azul" aria-labelledby="t-cont"><h2 id="t-cont">Como manter o resultado</h2><p>Novas páginas e mudanças no site podem criar novas barreiras. O monitoramento contínuo repete as verificações e avisa quando algo muda.</p></section>' +
      '</div>';
  }

  function telaDuvidas() {
    var itens = D.duvidas.map(function (d) {
      return '<details><summary>' + d.p + '</summary><p>' + d.r + '</p></details>';
    }).join('');
    return '<div class="pagina estreita"><div class="intro"><p class="sobretitulo">Dúvidas</p><h1 tabindex="-1">Perguntas frequentes</h1></div><div class="faq">' + itens + '</div></div>';
  }

  function emMoldura() {
    try { return window.self !== window.top; } catch (e) { return true; }
  }

  function telaPdf() {
    var p = pedido();
    var perfis = D.perfis.map(function (f) {
      return '<tr><th scope="row">' + f.nome + '</th><td class="doc-barra"><div class="barra" aria-hidden="true"><i style="width:' + f.antes + '%"></i></div></td><td class="num">' + f.antes + '%</td></tr>';
    }).join('');
    var falhas = D.falhas.filter(function (f) { return f.principal; }).map(function (f) {
      return '<tr><td>' + sev(f.severidade) + '</td><td>' + f.titulo + '</td><td>' + ref(f) + '</td><td class="num">' + f.ocorrencias + '</td></tr>';
    }).join('');
    var baixar = emMoldura()
      ? '<span class="visor-nota">A página publicada não abre a janela de impressão. Para gerar o PDF, abra a pasta local do protótipo.</span>'
      : '<button type="button" class="botao" id="baixar-pdf">' + ic('download') + 'Baixar relatório em PDF</button>';
    return '<div class="visor"><div class="visor-barra"><a href="#relatorio">← Voltar ao relatório</a><span>Relatório.pdf</span>' + baixar + '</div>' +
      '<div class="visor-pagina"><article class="doc">' +
      '<div class="doc-topo"><div class="marca-doc">' + ic('acesso') + '<div><strong>AcessaWeb</strong><br><small>Acessibilidade Digital</small></div></div>' +
      '<p class="doc-meta">Data de emissão: ' + p.entrega + '<br>Relatório nº: ' + D.amostra.numero + '</p></div>' +
      '<div><h1 tabindex="-1">Relatório de Acessibilidade Digital</h1><p class="doc-subtitulo">Análise baseada nas diretrizes do eMAG e das WCAG</p></div>' +
      '<section class="doc-resumo" aria-label="Resumo">' + anel(D.nota.antes, 130, 'Nota geral de conformidade') +
      '<div><h2>Resumo</h2><dl class="dados">' + linha('Site analisado:', p.url) + linha('Cliente:', p.nome) + linha('Data da solicitação:', p.solicitacao) + linha('Entrega do relatório:', p.entrega + ' (48h)') + linha('Situação:', 'Conformidade parcial com o eMAG') + '</dl></div></section>' +
      '<section class="doc-secao"><h2>Conformidade por perfil de deficiência</h2><table><thead><tr><th scope="col">Perfil</th><th scope="col"><span class="so-leitor">Gráfico</span></th><th scope="col" class="num">Nota</th></tr></thead><tbody>' + perfis + '</tbody></table></section>' +
      '<section class="doc-secao"><h2>Principais falhas encontradas</h2><div class="tabela-rolagem" tabindex="0" role="region" aria-label="Tabela de principais falhas"><table><thead><tr><th scope="col">Severidade</th><th scope="col">Descrição</th><th scope="col">Referência</th><th scope="col" class="num">Ocorrências</th></tr></thead><tbody>' + falhas + '</tbody></table></div></section>' +
      '<div class="doc-proximos">' + ic('lampada') + '<div><strong>Próximos passos</strong><br>A auditoria aprofundada confere cada barreira e entrega as recomendações de código. Depois das correções, a validação com pessoas com deficiência confirma o resultado na prática.</div></div>' +
      '<p class="doc-nota">Documento de exemplo com dados fictícios, gerado pelo protótipo do AcessaWeb.</p>' +
      '</article></div></div>';
  }

  var ROTAS = {
    inicio: { titulo: 'Início', nav: 'inicio', tela: telaInicio },
    'como-funciona': { titulo: 'Como funciona', nav: 'como-funciona', tela: telaComoFunciona },
    analise: { titulo: 'Análise em andamento', nav: 'inicio', tela: telaAnalise },
    relatorio: { titulo: 'Relatório', nav: 'relatorio', tela: telaRelatorio },
    'relatorio-perfis': { titulo: 'Relatório', nav: 'relatorio', tela: telaRelatorio, secao: 't-perfil' },
    'relatorio-falhas': { titulo: 'Relatório', nav: 'relatorio', tela: telaRelatorio, secao: 't-falhas' },
    recomendacoes: { titulo: 'Falhas e recomendações', nav: 'relatorio', tela: telaRecomendacoes },
    auditoria: { titulo: 'Auditoria aprofundada', nav: 'relatorio', tela: telaAuditoria },
    equipes: { titulo: 'Equipes de desenvolvimento', nav: 'relatorio', tela: telaEquipes },
    validacao: { titulo: 'Validação com PcD', nav: 'relatorio', tela: telaValidacao },
    resultado: { titulo: 'Resultado e selo', nav: 'relatorio', tela: telaResultado },
    duvidas: { titulo: 'Dúvidas', nav: 'duvidas', tela: telaDuvidas },
    'relatorio-pdf': { titulo: 'Relatório em PDF', nav: 'relatorio', tela: telaPdf }
  };

  var primeiraCarga = true;
  var confirmacao = null;

  function rotear() {
    var nome = location.hash.replace('#', '') || 'inicio';
    var aberta = null;
    if (nome.indexOf('falha-') === 0) {
      aberta = nome.slice(6);
      nome = 'recomendacoes';
    }
    var rota = ROTAS[nome] || ROTAS.inicio;
    clearTimeout(temporizador);
    main.innerHTML = rota.tela(aberta);
    document.title = rota.titulo + ' | AcessaWeb';
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.dataset.nav === rota.nav) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (rota.tela === telaAnalise) rodarAnalise();
    if (primeiraCarga) {
      primeiraCarga = false;
      if (!rota.secao && !aberta) return;
    }
    var alvo = (rota.secao && document.getElementById(rota.secao)) ||
      (aberta && document.querySelector('#falha-' + aberta + ' summary')) ||
      main.querySelector('h1');
    if (alvo) {
      alvo.focus({ preventScroll: true });
      if (rota.secao || aberta) alvo.scrollIntoView();
      else window.scrollTo(0, 0);
    }
    if (rota.tela !== telaAnalise) anunciar(confirmacao ? confirmacao + ' ' + rota.titulo : rota.titulo);
    confirmacao = null;
  }

  function anunciar(t) {
    anuncio.textContent = '';
    setTimeout(function () { anuncio.textContent = t; }, 50);
  }

  /* Formulários */

  function erroCampo(id, msg) {
    var campo = document.getElementById(id);
    var erro = document.getElementById('erro-' + id);
    if (msg) {
      erro.hidden = false;
      erro.innerHTML = ic('alerta') + '<span>' + msg + '</span>';
      campo.setAttribute('aria-invalid', 'true');
      campo.setAttribute('aria-describedby', 'erro-' + id);
    } else {
      erro.hidden = true;
      erro.textContent = '';
      campo.removeAttribute('aria-invalid');
      campo.removeAttribute('aria-describedby');
    }
    return !msg;
  }

  function lerUrl(valor) {
    var t = valor.trim();
    if (!t) return null;
    try {
      var u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t);
      if (!/^[^.\s]+(\.[^.\s]+)+$/.test(u.hostname)) return null;
      return u.hostname + (u.pathname === '/' ? '' : u.pathname);
    } catch (e) {
      return null;
    }
  }

  function enviarAnalise(form) {
    var nome = form.nome.value.trim();
    var email = form.email.value.trim();
    var urlOriginal = form.url.value.trim();
    var url = lerUrl(urlOriginal);
    var ok = [
      erroCampo('nome', nome ? '' : 'Informe seu nome completo.'),
      erroCampo('email', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? '' : 'Informe um e-mail válido, como nome@empresa.com.br.'),
      erroCampo('url', url ? '' : 'Informe o endereço do site, como exemplo.com.br.')
    ];
    if (ok.indexOf(false) >= 0) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    var hoje = new Date();
    var entrega = new Date(hoje.getTime() + 2 * 864e5);
    estado.pedido = { nome: nome, email: email, url: url, urlOriginal: urlOriginal, solicitacao: dataBr(hoje), entrega: dataBr(entrega) };
    estado.etapa = 1;
    estado.contatos = [];
    estado.corrigidas = [];
    salvar();
    location.hash = 'analise';
  }

  function enviarAuditoria(form) {
    if (!erroCampo('aceite', form.aceite.checked ? '' : 'Marque a autorização para iniciar a auditoria.')) {
      form.aceite.focus();
      return;
    }
    estado.paginas = form.paginas.value;
    avancar(3);
    confirmacao = 'Auditoria aceita. Na demonstração, o relatório técnico já está pronto.';
    location.hash = 'recomendacoes';
  }

  /* Eventos */

  document.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (ev.target.id === 'form-analise') enviarAnalise(ev.target);
    if (ev.target.id === 'form-auditoria') enviarAuditoria(ev.target);
  });

  document.addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-etapa],[data-contato],#marcar-todas,#baixar-pdf');
    if (!alvo) return;
    if (alvo.dataset.etapa) avancar(Number(alvo.dataset.etapa));
    if (alvo.dataset.contato) {
      var id = alvo.dataset.contato;
      var i = estado.contatos.indexOf(id);
      if (i >= 0) estado.contatos.splice(i, 1); else estado.contatos.push(id);
      salvar();
      var ativo = i < 0;
      alvo.setAttribute('aria-pressed', String(ativo));
      var nome = alvo.querySelector('.so-leitor').outerHTML;
      alvo.innerHTML = (ativo ? ic('check') + 'Contato solicitado' : 'Solicitar contato') + nome;
      anunciar(ativo ? 'Contato solicitado na demonstração.' : 'Pedido de contato cancelado.');
    }
    if (alvo.id === 'marcar-todas') {
      estado.corrigidas = D.falhas.map(function (f) { return f.id; });
      salvar();
      document.querySelectorAll('[data-corrigida]').forEach(function (c) { c.checked = true; });
      atualizarCorrigidas();
    }
    if (alvo.id === 'baixar-pdf') window.print();
  });

  document.addEventListener('change', function (ev) {
    var id = ev.target.dataset && ev.target.dataset.corrigida;
    if (!id) return;
    estado.corrigidas = estado.corrigidas.filter(function (x) { return x !== id; });
    if (ev.target.checked) estado.corrigidas.push(id);
    salvar();
    atualizarCorrigidas();
  });

  function atualizarCorrigidas() {
    document.getElementById('total-corr').textContent = textoCorrigidas();
    anunciar(textoCorrigidas());
  }

  document.getElementById('pular').addEventListener('click', function (ev) {
    ev.preventDefault();
    main.focus();
    main.scrollIntoView();
  });

  function aplicarPreferencias() {
    var raiz = document.documentElement;
    raiz.style.fontSize = FONTES[estado.fonte] + '%';
    if (estado.contraste) raiz.setAttribute('data-contraste', 'alto');
    else raiz.removeAttribute('data-contraste');
    document.getElementById('contraste').setAttribute('aria-pressed', String(estado.contraste));
    document.getElementById('fonte-menos').setAttribute('aria-disabled', String(estado.fonte === 0));
    document.getElementById('fonte-mais').setAttribute('aria-disabled', String(estado.fonte === FONTES.length - 1));
  }

  function mudarFonte(delta) {
    var nova = Math.min(FONTES.length - 1, Math.max(0, estado.fonte + delta));
    if (nova === estado.fonte) {
      anunciar(delta > 0 ? 'O texto já está no tamanho máximo.' : 'O texto já está no tamanho padrão.');
      return;
    }
    estado.fonte = nova;
    salvar();
    aplicarPreferencias();
    anunciar('Tamanho do texto: ' + FONTES[nova] + '%.');
  }

  document.getElementById('fonte-mais').addEventListener('click', function () { mudarFonte(1); });
  document.getElementById('fonte-menos').addEventListener('click', function () { mudarFonte(-1); });
  document.getElementById('contraste').addEventListener('click', function () {
    estado.contraste = !estado.contraste;
    salvar();
    aplicarPreferencias();
    anunciar(estado.contraste ? 'Alto contraste ativado.' : 'Alto contraste desativado.');
  });
  document.getElementById('recomecar').addEventListener('click', function () {
    var preferencias = { fonte: estado.fonte, contraste: estado.contraste };
    estado = Object.assign(estadoInicial(), preferencias);
    salvar();
    if (location.hash === '#inicio') rotear();
    else location.hash = 'inicio';
  });

  window.addEventListener('hashchange', rotear);
  aplicarPreferencias();
  rotear();
})();
