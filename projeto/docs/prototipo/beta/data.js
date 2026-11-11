// Dados fictícios usados na demonstração. Nenhum site é analisado de verdade.
window.ACESSA = {
  amostra: {
    numero: '4587',
    nome: 'João da Silva',
    email: 'joao@email.com',
    url: 'www.exemplo.com.br',
    solicitacao: '12/08/2025',
    entrega: '14/08/2025'
  },

  nota: { antes: 78, depois: 96 },

  perfis: [
    { id: 'cegas', nome: 'Pessoas cegas', icone: 'olho', antes: 92, depois: 98 },
    { id: 'baixa-visao', nome: 'Baixa visão', icone: 'olho-cortado', antes: 85, depois: 97 },
    { id: 'daltonicas', nome: 'Pessoas daltônicas', icone: 'paleta', antes: 76, depois: 96 },
    { id: 'surdas', nome: 'Pessoas surdas', icone: 'orelha', antes: 68, depois: 95 },
    { id: 'motoras', nome: 'Limitações motoras', icone: 'cadeira', antes: 71, depois: 96 },
    { id: 'cognitivas', nome: 'Limitações cognitivas', icone: 'cerebro', antes: 65, depois: 93 }
  ],

  falhas: [
    {
      id: 'imagens',
      titulo: 'Imagens sem texto alternativo (alt)',
      severidade: 'Alta',
      ocorrencias: 18,
      emag: '3.6',
      wcag: '1.1.1',
      principal: true,
      afeta: ['Pessoas cegas', 'Baixa visão'],
      evidencia: 'Página inicial: as 6 imagens do carrossel de notícias não têm o atributo alt.',
      impacto: 'O leitor de tela anuncia apenas o nome do arquivo. A pessoa não sabe o que a imagem informa.',
      correcao: 'Descreva a função da imagem no atributo alt. Em imagens apenas decorativas, use alt vazio.',
      antes: '<img src="img_0231.jpg">',
      depois: '<img src="img_0231.jpg"\n     alt="Estudantes em aula de informática na escola municipal">'
    },
    {
      id: 'contraste',
      titulo: 'Contraste de cores insuficiente',
      severidade: 'Média',
      ocorrencias: 12,
      emag: '4.1',
      wcag: '1.4.3',
      principal: true,
      afeta: ['Baixa visão', 'Pessoas daltônicas'],
      evidencia: 'Rodapé: texto #9AA5B1 sobre fundo #FFFFFF, com contraste de 2,5:1.',
      impacto: 'O texto fica difícil de ler, principalmente em celulares e sob luz forte.',
      correcao: 'Use contraste mínimo de 4,5:1 em texto normal e de 3:1 em texto grande.',
      antes: '.rodape { color: #9AA5B1; }',
      depois: '.rodape { color: #4A5F76; } /* contraste de 6,5:1 */'
    },
    {
      id: 'teclado',
      titulo: 'Navegação por teclado incompleta',
      severidade: 'Média',
      ocorrencias: 8,
      emag: '2.1',
      wcag: '2.1.1',
      principal: true,
      afeta: ['Pessoas cegas', 'Limitações motoras'],
      evidencia: 'Menu principal: os submenus abrem apenas com o mouse, em um elemento div com onclick.',
      impacto: 'Quem usa teclado ou acionador não alcança as páginas internas do menu.',
      correcao: 'Use elementos nativos, como button e a, que já recebem foco e respondem ao teclado.',
      antes: '<div onclick="abrirMenu()">Serviços</div>',
      depois: '<button type="button" aria-expanded="false"\n        onclick="abrirMenu()">Serviços</button>'
    },
    {
      id: 'semantica',
      titulo: 'Estrutura semântica inadequada',
      severidade: 'Baixa',
      ocorrencias: 5,
      emag: '1.3',
      wcag: '1.3.1',
      principal: true,
      afeta: ['Pessoas cegas', 'Limitações cognitivas'],
      evidencia: 'Página de serviços: os títulos pulam de h1 para h4 e parte deles usa apenas negrito.',
      impacto: 'Quem navega por títulos perde a noção de como o conteúdo está organizado.',
      correcao: 'Marque os títulos em ordem hierárquica, sem pular níveis.',
      antes: '<h1>Serviços</h1>\n<h4>Matrículas</h4>\n<b>Documentos</b>',
      depois: '<h1>Serviços</h1>\n<h2>Matrículas</h2>\n<h3>Documentos</h3>'
    },
    {
      id: 'etiquetas',
      titulo: 'Campos de formulário sem etiqueta',
      severidade: 'Média',
      ocorrencias: 4,
      emag: '6.2',
      wcag: '3.3.2',
      principal: false,
      afeta: ['Pessoas cegas', 'Limitações cognitivas'],
      evidencia: 'Formulário de contato: os campos usam apenas placeholder como identificação.',
      impacto: 'O nome do campo desaparece durante a digitação e pode não ser lido pelo leitor de tela.',
      correcao: 'Associe uma etiqueta visível a cada campo com label e for.',
      antes: '<input type="email" placeholder="E-mail">',
      depois: '<label for="email">E-mail</label>\n<input id="email" type="email" autocomplete="email">'
    },
    {
      id: 'legendas',
      titulo: 'Vídeos sem legenda',
      severidade: 'Média',
      ocorrencias: 3,
      emag: '5.1',
      wcag: '1.2.2',
      principal: false,
      afeta: ['Pessoas surdas', 'Limitações cognitivas'],
      evidencia: 'Página institucional: os 3 vídeos de apresentação não têm legendas.',
      impacto: 'Pessoas surdas não têm acesso ao conteúdo falado.',
      correcao: 'Inclua legendas sincronizadas e, sempre que possível, janela de Libras.',
      antes: '<video src="apresentacao.mp4" controls></video>',
      depois: '<video src="apresentacao.mp4" controls>\n  <track kind="captions" srclang="pt-BR"\n         src="apresentacao.vtt" label="Português" default>\n</video>'
    }
  ],

  // Empresas inventadas para a demonstração.
  equipes: [
    {
      id: 'ponte',
      nome: 'Ponte Front-end',
      foco: 'Correção de HTML, CSS e navegação por teclado',
      resolve: 'Contraste, teclado e estrutura semântica',
      prazo: '2 a 3 semanas'
    },
    {
      id: 'trilha',
      nome: 'Trilha Inclusiva Dev',
      foco: 'Portais públicos e sistemas de grande porte',
      resolve: 'Formulários, imagens e adequação ao eMAG',
      prazo: '4 a 6 semanas'
    },
    {
      id: 'legenda',
      nome: 'Estúdio Legenda Viva',
      foco: 'Conteúdo acessível e multimídia',
      resolve: 'Legendas, Libras e textos alternativos',
      prazo: '1 a 2 semanas'
    }
  ],

  // Relatos ilustrativos: a demonstração não envolveu participantes reais.
  testes: [
    {
      perfil: 'Pessoas cegas',
      tecnologia: 'NVDA e Chrome',
      tarefa: 'Encontrar um serviço pelo menu',
      resultado: 'Concluída',
      relato: 'Consegui navegar pelos títulos e chegar ao serviço sem pedir ajuda.'
    },
    {
      perfil: 'Baixa visão',
      tecnologia: 'Ampliação de 200%',
      tarefa: 'Ler uma notícia até o fim',
      resultado: 'Concluída',
      relato: 'O texto continuou legível e não precisei rolar a página para os lados.'
    },
    {
      perfil: 'Pessoas daltônicas',
      tecnologia: 'Sem tecnologia assistiva',
      tarefa: 'Identificar erros no formulário',
      resultado: 'Concluída',
      relato: 'Os erros agora têm texto e ícone. Antes eu via apenas uma borda diferente.'
    },
    {
      perfil: 'Pessoas surdas',
      tecnologia: 'Legendas e janela de Libras',
      tarefa: 'Assistir ao vídeo institucional',
      resultado: 'Concluída',
      relato: 'As legendas acompanham a fala. A janela de Libras ajudou a entender o conteúdo.'
    },
    {
      perfil: 'Limitações motoras',
      tecnologia: 'Teclado e acionador',
      tarefa: 'Enviar o formulário de contato',
      resultado: 'Concluída',
      relato: 'Consegui chegar a todos os campos, e o foco ficou visível o tempo todo.'
    },
    {
      perfil: 'Limitações cognitivas',
      tecnologia: 'Leitura guiada',
      tarefa: 'Entender as regras de matrícula',
      resultado: 'Concluída com ressalva',
      relato: 'Consegui terminar, mas o texto das regras ainda é longo e tem termos difíceis.'
    }
  ],

  duvidas: [
    {
      p: 'O que é o eMAG?',
      r: 'É o Modelo de Acessibilidade em Governo Eletrônico, com recomendações para sites públicos brasileiros. A versão 3.1 tem 45 recomendações, organizadas em 6 seções.'
    },
    {
      p: 'Meu site é privado. A análise também serve?',
      r: 'Sim. O eMAG é voltado principalmente ao governo. Por isso, o relatório também aponta os critérios correspondentes das WCAG, a referência internacional.'
    },
    {
      p: 'A análise automática encontra todos os problemas?',
      r: 'Não. Ferramentas automáticas não avaliam, por exemplo, se um texto alternativo faz sentido. A auditoria aprofundada e os testes com pessoas com deficiência cobrem o que a automação não alcança.'
    },
    {
      p: 'O selo AcessaWeb é uma certificação oficial?',
      r: 'Não. O selo é uma avaliação própria do AcessaWeb, baseada em critérios públicos e nos testes com pessoas com deficiência. Ele não é uma certificação governamental.'
    },
    {
      p: 'Quem faz as correções no site?',
      r: 'Sua própria equipe pode usar as recomendações do relatório. Se preferir, indicamos equipes de desenvolvimento especializadas, e você negocia diretamente com a equipe escolhida.'
    },
    {
      p: 'Como funciona a validação com pessoas com deficiência?',
      r: 'Depois das correções, fazemos uma nova verificação técnica. Em seguida, pessoas com diferentes deficiências realizam tarefas reais no site e relatam o que funcionou e o que ainda precisa melhorar.'
    }
  ]
};
