// Lista fechada das 45 recomendações do eMAG 3.1 (RF08) e o que o axe-core cobre de cada uma.
// Fonte: projeto/docs/rascunhos/Cobertura_eMAG_axe-core.md (mapeamento do agente, a conferir com o mentor José Alves).
// Os nomes de 6.5 a 6.8 vieram de um resumo da página: conferir no PDF oficial do eMAG.

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

// A página oficial só tem âncora por seção (#s3.1 a #s3.6), não por recomendação
export const requisitos: Requisito[] = linhas.map(
  ([numero, nome, cobertura, prioridade, regras]) => ({
    numero,
    nome,
    link: `https://emag.governoeletronico.gov.br/#s3.${numero.split('.')[0]}`,
    cobertura,
    prioridade: prioridade || undefined,
    regras: regras ? regras.split(' ') : [],
  }),
)

// Uma regra do axe-core pode ligar a mais de um requisito (ex.: meta-refresh → 2.3, 2.4 e 2.5)
export function requisitosDaRegra(regra: string): Requisito[] {
  return requisitos.filter((r) => r.regras.includes(regra))
}
