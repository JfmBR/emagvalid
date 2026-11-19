// Lista fechada das 45 recomendações do eMAG 3.1 (RF08) e o que o axe-core cobre de cada uma.
// Fonte: projeto/docs/rascunhos/Cobertura_eMAG_axe-core.md (mapeamento do agente, a conferir com o mentor José Alves).
// Os nomes de 6.5 a 6.8 vieram de um resumo da página: conferir no PDF oficial do eMAG.
// shortcut: arquivo de dados passa de 350 linhas com os textos; se crescer mais, mover `textos` para um arquivo próprio.
/* oxlint-disable max-lines */

export type Cobertura = 'sim' | 'parcial' | 'nao'
export type Prioridade = 'alta' | 'media' | 'baixa'

export interface Requisito {
  numero: string
  nome: string
  link: string
  cobertura: Cobertura
  // Prioridade do AcessaWeb (o eMAG não tem níveis); só existe quando o axe-core cobre
  prioridade?: Prioridade
  regras: string[]
  // Por que é falha (quem é prejudicado e como); só nas que entram na nota
  porque?: string
  // HTML de correção para o que as regras do axe-core apontam; só nas que entram na nota
  exemplo?: string
  // O que conferir à mão na página; só nas de cobertura 'nao' (revisão humana, RF09)
  conferir?: string
}

// Peso de cada prioridade na nota (RF05)
export const PESO: Record<Prioridade, number> = { alta: 3, media: 2, baixa: 1 }

type Linha = [string, string, Cobertura, Prioridade | '', string]

// Número, nome, cobertura, prioridade e regras do axe-core (separadas por espaço)
const linhas: Linha[] = [
  ['1.1', 'Respeitar os Padrões Web', 'nao', '', ''],
  [
    '1.2',
    'Organizar o código HTML de forma lógica e semântica',
    'parcial',
    'media',
    'list listitem definition-list dlitem aria-required-children aria-required-parent',
  ],
  [
    '1.3',
    'Utilizar corretamente os níveis de cabeçalho',
    'sim',
    'media',
    'heading-order page-has-heading-one empty-heading',
  ],
  [
    '1.4',
    'Ordenar de forma lógica e intuitiva a leitura e tabulação',
    'parcial',
    'media',
    'tabindex',
  ],
  [
    '1.5',
    'Fornecer âncoras para ir direto a um bloco de conteúdo',
    'sim',
    'media',
    'bypass skip-link',
  ],
  ['1.6', 'Não utilizar tabelas para a diagramação', 'nao', '', ''],
  ['1.7', 'Separar links adjacentes', 'nao', '', ''],
  [
    '1.8',
    'Dividir as áreas de informação',
    'sim',
    'baixa',
    'region landmark-one-main landmark-unique',
  ],
  ['1.9', 'Não abrir novas instâncias sem a solicitação do usuário', 'nao', '', ''],
  [
    '2.1',
    'Disponibilizar todas as funções da página via teclado',
    'parcial',
    'alta',
    'scrollable-region-focusable frame-focusable-content nested-interactive server-side-image-map',
  ],
  [
    '2.2',
    'Garantir que os objetos programáveis sejam acessíveis',
    'parcial',
    'alta',
    'aria-roles aria-valid-attr aria-valid-attr-value aria-required-attr aria-allowed-attr aria-hidden-focus button-name aria-command-name',
  ],
  ['2.3', 'Não criar páginas com atualização automática periódica', 'sim', 'media', 'meta-refresh'],
  ['2.4', 'Não utilizar redirecionamento automático de páginas', 'sim', 'media', 'meta-refresh'],
  ['2.5', 'Fornecer alternativa para modificar limite de tempo', 'parcial', 'alta', 'meta-refresh'],
  ['2.6', 'Não incluir situações com intermitência de tela', 'parcial', 'alta', 'blink marquee'],
  [
    '2.7',
    'Assegurar o controle do usuário sobre as alterações temporais do conteúdo',
    'parcial',
    'media',
    'marquee blink',
  ],
  [
    '3.1',
    'Identificar o idioma principal da página',
    'sim',
    'media',
    'html-has-lang html-lang-valid html-xml-lang-mismatch',
  ],
  ['3.2', 'Informar mudança de idioma no conteúdo', 'parcial', 'baixa', 'valid-lang'],
  ['3.3', 'Oferecer um título descritivo e informativo à página', 'sim', 'media', 'document-title'],
  ['3.4', 'Informar o usuário sobre sua localização na página', 'nao', '', ''],
  ['3.5', 'Descrever links clara e sucintamente', 'parcial', 'alta', 'link-name'],
  [
    '3.6',
    'Fornecer alternativa em texto para as imagens do sítio',
    'sim',
    'alta',
    'image-alt role-img-alt svg-img-alt object-alt image-redundant-alt',
  ],
  [
    '3.7',
    'Utilizar mapas de imagem de forma acessível',
    'sim',
    'alta',
    'area-alt server-side-image-map',
  ],
  ['3.8', 'Disponibilizar documentos em formatos acessíveis', 'nao', '', ''],
  [
    '3.9',
    'Em tabelas, utilizar títulos e resumos de forma apropriada',
    'parcial',
    'baixa',
    'empty-table-header table-duplicate-name',
  ],
  [
    '3.10',
    'Associar células de dados às células de cabeçalho',
    'sim',
    'media',
    'td-headers-attr th-has-data-cells scope-attr-valid',
  ],
  ['3.11', 'Garantir a leitura e compreensão das informações', 'nao', '', ''],
  [
    '3.12',
    'Disponibilizar uma explicação para siglas, abreviaturas e palavras incomuns',
    'nao',
    '',
    '',
  ],
  [
    '4.1',
    'Oferecer contraste mínimo entre plano de fundo e primeiro plano',
    'sim',
    'media',
    'color-contrast',
  ],
  [
    '4.2',
    'Não utilizar apenas cor ou outras características sensoriais para diferenciar elementos',
    'parcial',
    'media',
    'link-in-text-block',
  ],
  [
    '4.3',
    'Permitir redimensionamento sem perda de funcionalidade',
    'parcial',
    'media',
    'meta-viewport avoid-inline-spacing',
  ],
  ['4.4', 'Possibilitar que o elemento com foco seja visualmente evidente', 'nao', '', ''],
  ['5.1', 'Fornecer alternativa para vídeo', 'parcial', 'alta', 'video-caption'],
  ['5.2', 'Fornecer alternativa para áudio', 'nao', '', ''],
  ['5.3', 'Oferecer audiodescrição para vídeo pré-gravado', 'nao', '', ''],
  ['5.4', 'Fornecer controle de áudio para som', 'sim', 'media', 'no-autoplay-audio'],
  ['5.5', 'Fornecer controle de animação', 'parcial', 'media', 'blink marquee'],
  [
    '6.1',
    'Fornecer alternativa em texto para os botões de imagem de formulários',
    'sim',
    'alta',
    'input-image-alt input-button-name',
  ],
  [
    '6.2',
    'Associar etiquetas aos seus campos',
    'sim',
    'alta',
    'label select-name form-field-multiple-labels aria-input-field-name aria-toggle-field-name label-title-only label-content-name-mismatch',
  ],
  ['6.3', 'Estabelecer uma ordem lógica de navegação', 'parcial', 'media', 'tabindex'],
  ['6.4', 'Não provocar automaticamente alteração no contexto', 'nao', '', ''],
  ['6.5', 'Fornecer instruções para entrada de dados', 'nao', '', ''],
  [
    '6.6',
    'Identificar e descrever erros de entrada de dados e confirmar o envio das informações',
    'nao',
    '',
    '',
  ],
  ['6.7', 'Agrupar campos de formulário', 'nao', '', ''],
  ['6.8', 'Fornecer estratégias de segurança específicas ao invés de CAPTCHA', 'nao', '', ''],
]

// Rascunho redigido pelo Claude em 19/11/2026 a partir do eMAG 3.1, a revisar pelo grupo (decisão do João).
const textos: Record<string, Pick<Requisito, 'porque' | 'exemplo' | 'conferir'>> = {
  '1.1': {
    conferir:
      'Passe a página no validador do W3C (validator.w3.org) e confira se o HTML e o CSS não têm erros. Confira também se o visual está no CSS e o comportamento no JavaScript, e não misturados no HTML.',
  },
  '1.2': {
    porque:
      'Quem usa leitor de tela depende da marcação para saber o que é lista, item ou grupo. Com a estrutura quebrada, o leitor anuncia o conteúdo de forma errada.',
    exemplo: '<ul>\n  <li>Serviços</li>\n  <li>Notícias</li>\n</ul>',
  },
  '1.3': {
    porque:
      'Quem usa leitor de tela navega pelos cabeçalhos para achar o assunto. Nível pulado, cabeçalho vazio ou falta do h1 deixam a página sem mapa.',
    exemplo: '<h1>Secretaria de Saúde</h1>\n<h2>Vacinação</h2>\n<h3>Calendário</h3>',
  },
  '1.4': {
    porque:
      'Quem navega pelo teclado segue a ordem do código. Um tabindex maior que 0 faz o foco pular para fora dessa ordem e confunde.',
    exemplo:
      '<!-- Antes: <a href="/contato" tabindex="3">Contato</a> -->\n<a href="/contato">Contato</a>',
  },
  '1.5': {
    porque:
      'Quem usa teclado ou leitor de tela passa por todo o menu em cada página. Um link para o conteúdo, logo no início, poupa esse caminho.',
    exemplo: '<a href="#conteudo">Ir para o conteúdo</a>\n<main id="conteudo">...</main>',
  },
  '1.6': {
    conferir:
      'Confira se há tabela usada só para posicionar o layout. Tabela deve conter apenas dados organizados em linhas e colunas.',
  },
  '1.7': {
    conferir:
      'Confira se links vizinhos estão em uma lista ou separados por um caractere, como vírgula ou barra vertical.',
  },
  '1.8': {
    porque:
      'Quem usa leitor de tela pula entre as áreas da página (topo, menu, conteúdo, rodapé). Sem essas áreas marcadas, precisa ouvir tudo em sequência.',
    exemplo: '<header>...</header>\n<nav aria-label="Menu principal">...</nav>\n<main>...</main>',
  },
  '1.9': {
    conferir:
      'Confira se algum link, botão ou script abre nova janela, aba ou pop-up sem a pessoa pedir. Se abrir, o link deve avisar, por exemplo "abre em nova janela".',
  },
  '2.1': {
    porque:
      'Quem não usa mouse precisa chegar a todas as funções pelo teclado. Área com rolagem que não recebe foco, ou controle dentro de outro controle, fica fora de alcance.',
    exemplo:
      '<div tabindex="0" role="region" aria-label="Lista de unidades">...</div>\n<button type="button">Baixar edital</button> <!-- sem link dentro do botão -->',
  },
  '2.2': {
    porque:
      'Quem usa leitor de tela só entende um componente feito com script se ele tiver nome, papel e estado corretos. Botão sem nome ou ARIA errado vira um elemento mudo.',
    exemplo:
      '<button type="button" aria-expanded="false" aria-controls="menu">Menu</button>\n<button type="button" aria-label="Fechar"><svg aria-hidden="true">...</svg></button>',
  },
  '2.3': {
    porque:
      'A página que recarrega sozinha tira o leitor de tela do ponto em que estava e interrompe quem lê devagar.',
    exemplo:
      '<!-- Tire: <meta http-equiv="refresh" content="60"> -->\n<button type="button">Atualizar notícias</button>',
  },
  '2.4': {
    porque:
      'O redirecionamento automático troca a página sem aviso, e quem usa leitor de tela perde a referência de onde está.',
    exemplo:
      '<!-- Tire: <meta http-equiv="refresh" content="0; url=/novo"> -->\n<!-- Faça o redirecionamento no servidor (HTTP 301), sem tempo de espera -->',
  },
  '2.5': {
    porque:
      'Quem lê ou digita devagar, ou usa tecnologia assistiva, pode não terminar antes de o tempo acabar e perder o que fez.',
    exemplo:
      '<!-- Tire o <meta http-equiv="refresh"> com tempo -->\n<p role="alert">Sua sessão termina em 2 minutos.</p>\n<button type="button">Continuar conectado</button>',
  },
  '2.6': {
    porque:
      'Conteúdo que pisca pode provocar crise em quem tem epilepsia fotossensível e atrapalha quem tem dificuldade de atenção.',
    exemplo:
      '<!-- Antes: <blink>Inscrições abertas</blink> -->\n<strong>Inscrições abertas</strong>',
  },
  '2.7': {
    porque:
      'Texto que se move sozinho, sem como pausar, é difícil de ler para quem tem baixa visão, dislexia ou leitura lenta.',
    exemplo:
      '<!-- Antes: <marquee>Atendimento em novo horário</marquee> -->\n<p>Atendimento em novo horário</p>',
  },
  '3.1': {
    porque:
      'O leitor de tela usa o idioma da página para escolher a pronúncia. Sem ele, pode ler o português com as regras de outra língua.',
    exemplo: '<html lang="pt-BR">',
  },
  '3.2': {
    porque:
      'Sem a marcação do idioma, o leitor de tela pronuncia a palavra estrangeira como se fosse português.',
    exemplo: '<p>Consulte o <span lang="en">Open Data Handbook</span>.</p>',
  },
  '3.3': {
    porque:
      'O título é a primeira coisa que o leitor de tela anuncia e é o nome da aba. Sem ele, a pessoa não sabe em que página está.',
    exemplo: '<title>Vacinação - Secretaria de Saúde</title>',
  },
  '3.4': {
    conferir:
      'Confira se a página mostra onde a pessoa está, como uma trilha (migalhas de pão) com as páginas anteriores em link e a atual sem link.',
  },
  '3.5': {
    porque:
      'Quem usa leitor de tela costuma ouvir a lista de links fora do texto. Link sem nome é anunciado só como "link", sem dizer para onde vai.',
    exemplo:
      '<a href="/edital.pdf">Edital 2026 (PDF, 1,2 MB)</a>\n<a href="/"><img src="logo.png" alt="Página inicial da Prefeitura"></a>',
  },
  '3.6': {
    porque:
      'Quem usa leitor de tela não sabe o que a imagem mostra. Sem texto alternativo, ela é ignorada ou lida pelo nome do arquivo.',
    exemplo:
      '<img src="logo.png" alt="Logo da Prefeitura">\n<svg role="img" aria-label="Gráfico de vacinação por mês">...</svg>',
  },
  '3.7': {
    porque:
      'Quem usa leitor de tela não sabe para onde leva cada área de um mapa de imagem sem texto. O mapa processado no servidor também não funciona pelo teclado.',
    exemplo:
      '<img src="mapa.png" alt="Regiões da cidade" usemap="#regioes">\n<map name="regioes"><area shape="rect" coords="0,0,80,60" href="/norte" alt="Região Norte"></map>',
  },
  '3.8': {
    conferir:
      'Confira se os documentos para baixar (PDF e outros) têm versão em HTML ou em formato acessível, como ODF.',
  },
  '3.9': {
    porque:
      'Quem usa leitor de tela ouve o título da tabela antes dos dados. Cabeçalho vazio, ou resumo que só repete o título, não diz do que a tabela trata.',
    exemplo:
      '<table>\n  <caption>Horário das unidades de saúde</caption>\n  <tr><th scope="col">Unidade</th><th scope="col">Horário</th></tr>',
  },
  '3.10': {
    porque:
      'Quem usa leitor de tela ouve cada célula isolada. Sem a ligação com o cabeçalho, ouve "8h" sem saber a que coluna o valor pertence.',
    exemplo:
      '<tr><th scope="col">Unidade</th><th scope="col">Abre às</th></tr>\n<tr><td>UBS Centro</td><td>8h</td></tr>',
  },
  '3.11': {
    conferir:
      'Leia o texto e confira se uma pessoa com ensino fundamental completo o entende. Se não, deve haver uma versão simplificada ou explicação extra.',
  },
  '3.12': {
    conferir:
      'Confira se siglas, abreviaturas e palavras incomuns são explicadas na primeira vez que aparecem: no próprio texto, em um glossário ou com <abbr>.',
  },
  '4.1': {
    porque:
      'Quem tem baixa visão ou daltonismo, ou usa a tela sob luz forte, não consegue ler texto com pouco contraste.',
    exemplo:
      '<!-- Texto comum: contraste de pelo menos 4,5:1 com o fundo -->\n<p style="color: #595959; background-color: #ffffff">Horário de atendimento</p>',
  },
  '4.2': {
    porque: 'Quem não distingue cores não percebe um link marcado só pela cor no meio do texto.',
    exemplo:
      '<p>Veja o <a href="/edital" style="text-decoration: underline">edital completo</a>.</p>',
  },
  '4.3': {
    porque:
      'Quem tem baixa visão amplia a página ou aumenta o espaçamento do texto. Com o zoom bloqueado ou o espaçamento travado, não consegue ler.',
    exemplo:
      '<meta name="viewport" content="width=device-width, initial-scale=1">\n<p style="line-height: 1.5">Espaçamento sem !important</p>',
  },
  '4.4': {
    conferir:
      'Navegue com Tab e confira se o elemento com foco fica sempre visível. A borda de foco não pode ter sido removida no CSS.',
  },
  '5.1': {
    porque: 'Quem é surdo ou tem deficiência auditiva não acompanha a fala do vídeo sem legenda.',
    exemplo:
      '<video controls src="aula.mp4">\n  <track kind="captions" src="aula.vtt" srclang="pt-BR" label="Português">\n</video>',
  },
  '5.2': {
    conferir:
      'Confira se cada áudio gravado (entrevista, podcast) tem transcrição em texto logo após o conteúdo.',
  },
  '5.3': {
    conferir:
      'Assista aos vídeos e confira se o que só aparece na imagem é narrado (audiodescrição) nas pausas entre as falas.',
  },
  '5.4': {
    porque:
      'Som que toca sozinho encobre a voz do leitor de tela, e a pessoa não consegue achar onde desligar.',
    exemplo: '<!-- Sem autoplay e com controles -->\n<audio controls src="hino.mp3"></audio>',
  },
  '5.5': {
    porque:
      'Animação que não para distrai quem tem dificuldade de atenção e atrapalha quem lê devagar.',
    exemplo:
      '<!-- Antes: <marquee><a href="/noticias">Últimas notícias</a></marquee> -->\n<p><a href="/noticias">Últimas notícias</a></p>',
  },
  '6.1': {
    porque:
      'Quem usa leitor de tela ouve só "botão" quando o botão não tem texto, e não sabe o que ele faz.',
    exemplo:
      '<input type="image" src="buscar.png" alt="Buscar">\n<input type="submit" value="Enviar">',
  },
  '6.2': {
    porque:
      'Quem usa leitor de tela não sabe o que digitar em um campo sem etiqueta. A etiqueta ligada ao campo também aumenta a área de clique.',
    exemplo: '<label for="cpf">CPF</label>\n<input id="cpf" name="cpf" type="text">',
  },
  '6.3': {
    porque:
      'Quem preenche o formulário pelo teclado segue a ordem do código. Um tabindex maior que 0 faz o foco pular de campo, e a pessoa se perde.',
    exemplo:
      '<!-- Campos na ordem do código, sem tabindex positivo -->\n<label for="nome">Nome</label> <input id="nome" name="nome">\n<label for="email">E-mail</label> <input id="email" name="email" type="email">',
  },
  '6.4': {
    conferir:
      'Percorra o formulário com Tab e mude as opções. Confira se nada muda sozinho (página, envio, foco) antes de a pessoa acionar um botão.',
  },
  '6.5': {
    conferir:
      'Confira se as instruções de preenchimento (por exemplo, o formato da data) aparecem junto à etiqueta e se os campos obrigatórios estão indicados.',
  },
  '6.6': {
    conferir:
      'Envie o formulário com erros e confira se cada erro é identificado e descrito em texto. Confira também se há uma etapa para revisar os dados antes do envio.',
  },
  '6.7': {
    conferir:
      'Confira se campos relacionados (endereço, dados pessoais) estão agrupados em <fieldset>, com um <legend> que diga o propósito do grupo.',
  },
  '6.8': {
    conferir:
      'Confira se o formulário usa CAPTCHA. Se usar, o ideal é outra proteção; se for indispensável, deve ser uma pergunta simples de senso comum.',
  },
}

// A página oficial só tem âncora por seção (#s3.1 a #s3.6), não por recomendação
export const requisitos: Requisito[] = linhas.map(
  ([numero, nome, cobertura, prioridade, regras]) => ({
    numero,
    nome,
    link: `https://emag.governoeletronico.gov.br/#s3.${numero.split('.')[0]}`,
    cobertura,
    prioridade: prioridade || undefined,
    regras: regras ? regras.split(' ') : [],
    ...textos[numero],
  }),
)

// Uma regra do axe-core pode ligar a mais de um requisito (ex.: meta-refresh → 2.3, 2.4 e 2.5)
export function requisitosDaRegra(regra: string): Requisito[] {
  return requisitos.filter((r) => r.regras.includes(regra))
}
