# Cobertura do eMAG 3.1 pelas verificações automáticas (axe-core) e lista fechada do AcessaWeb

**Data:** 05/11/2026 · **Uso:** lista fechada da IA (RF08), cálculo da nota (RF05, RF06) e separação automático × revisão humana (RF09).

**Fontes:**
- eMAG 3.1, "Versão 3.1 - Abril 2014", https://emag.governoeletronico.gov.br/ (lido em 05/11/2026). São 45 recomendações. Os nomes de 1.1 a 6.4 foram copiados literalmente da página. Os de 6.5 a 6.8 vieram de um resumo da página: conferir no PDF oficial (http://www.governoeletronico.gov.br/documentos-e-arquivos/eMAGv31.pdf).
- axe-core 4.14, lista oficial de regras: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md (lido em 05/11/2026). São 60 regras WCAG 2.0 A/AA, 3 regras WCAG 2.1 A/AA e 27 regras de boas práticas.

**O que o eMAG diz sobre prioridade:** o eMAG 3.1 não tem níveis de prioridade. Texto da página: "as recomendações de acessibilidade deste documento não estão divididas por níveis de prioridade e sim por área". Por isso, a prioridade abaixo é do **AcessaWeb**, não do eMAG, e só serve para dar peso à nota.

**Link para cada recomendação:** a página oficial não tem âncora individual por recomendação, só por seção: `#s3.1` (Marcação), `#s3.2` (Comportamento), `#s3.3` (Conteúdo/Informação), `#s3.4` (Apresentação/Design), `#s3.5` (Multimídia) e `#s3.6` (Formulário). Exemplo: https://emag.governoeletronico.gov.br/#s3.3.

**O mapeamento eMAG ↔ axe-core é do agente**, feito pela correspondência entre o eMAG e o WCAG. Conferir com o mentor José Alves. As regras de boas práticas do axe-core aparecem marcadas com (BP).

## Legenda
- **Cobertura.** **Sim:** o axe-core verifica o essencial; a qualidade (por exemplo, se o texto alternativo descreve bem a imagem) continua com a revisão humana. **Parcial:** o axe-core verifica só uma parte. **Não:** não há regra; o item fica só na revisão humana (RF09).
- **Prioridade (AcessaWeb)** e peso na nota. **Alta (3):** impede o uso por teclado ou leitor de tela. **Média (2):** dificulta o uso. **Baixa (1):** incomoda pouco.
- **Entra na nota:** só as recomendações com cobertura Sim ou Parcial. As de cobertura Não e os resultados "needs review" do axe-core aparecem à parte, como revisão humana.

## 1. Marcação (#s3.1)
| Recomendação | Regras do axe-core | Cobertura | Prioridade |
|---|---|---|---|
| 1.1 Respeitar os Padrões Web | — (precisa de validador HTML) | Não | — |
| 1.2 Organizar o código HTML de forma lógica e semântica | list, listitem, definition-list, dlitem, aria-required-children, aria-required-parent | Parcial | Média |
| 1.3 Utilizar corretamente os níveis de cabeçalho | heading-order (BP), page-has-heading-one (BP), empty-heading (BP) | Sim | Média |
| 1.4 Ordenar de forma lógica e intuitiva a leitura e tabulação | tabindex (BP) | Parcial | Média |
| 1.5 Fornecer âncoras para ir direto a um bloco de conteúdo | bypass, skip-link (BP) | Sim | Média |
| 1.6 Não utilizar tabelas para a diagramação | — | Não | — |
| 1.7 Separar links adjacentes | — | Não | — |
| 1.8 Dividir as áreas de informação | region (BP), landmark-one-main (BP), landmark-unique (BP) | Sim | Baixa |
| 1.9 Não abrir novas instâncias sem a solicitação do usuário | — | Não | — |

## 2. Comportamento (DOM) (#s3.2)
| Recomendação | Regras do axe-core | Cobertura | Prioridade |
|---|---|---|---|
| 2.1 Disponibilizar todas as funções da página via teclado | scrollable-region-focusable, frame-focusable-content, nested-interactive, server-side-image-map | Parcial | Alta |
| 2.2 Garantir que os objetos programáveis sejam acessíveis | aria-roles, aria-valid-attr, aria-valid-attr-value, aria-required-attr, aria-allowed-attr, aria-hidden-focus, button-name, aria-command-name | Parcial | Alta |
| 2.3 Não criar páginas com atualização automática periódica | meta-refresh | Sim | Média |
| 2.4 Não utilizar redirecionamento automático de páginas | meta-refresh (só o redirecionamento por meta; o feito por script não) | Sim | Média |
| 2.5 Fornecer alternativa para modificar limite de tempo | meta-refresh | Parcial | Alta |
| 2.6 Não incluir situações com intermitência de tela | blink, marquee | Parcial | Alta |
| 2.7 Assegurar o controle do usuário sobre as alterações temporais do conteúdo | marquee, blink | Parcial | Média |

## 3. Conteúdo/Informação (#s3.3)
| Recomendação | Regras do axe-core | Cobertura | Prioridade |
|---|---|---|---|
| 3.1 Identificar o idioma principal da página | html-has-lang, html-lang-valid, html-xml-lang-mismatch | Sim | Média |
| 3.2 Informar mudança de idioma no conteúdo | valid-lang (só confere o valor; não acha trecho sem marcação) | Parcial | Baixa |
| 3.3 Oferecer um título descritivo e informativo à página | document-title (se é descritivo: revisão humana) | Sim | Média |
| 3.4 Informar o usuário sobre sua localização na página | — | Não | — |
| 3.5 Descrever links clara e sucintamente | link-name (se é claro: revisão humana) | Parcial | Alta |
| 3.6 Fornecer alternativa em texto para as imagens do sítio | image-alt, role-img-alt, svg-img-alt, object-alt, image-redundant-alt (BP) | Sim | Alta |
| 3.7 Utilizar mapas de imagem de forma acessível | area-alt, server-side-image-map | Sim | Alta |
| 3.8 Disponibilizar documentos em formatos acessíveis | — | Não | — |
| 3.9 Em tabelas, utilizar títulos e resumos de forma apropriada | empty-table-header (BP), table-duplicate-name (BP) | Parcial | Baixa |
| 3.10 Associar células de dados às células de cabeçalho | td-headers-attr, th-has-data-cells, scope-attr-valid (BP) | Sim | Média |
| 3.11 Garantir a leitura e compreensão das informações | — | Não | — |
| 3.12 Disponibilizar uma explicação para siglas, abreviaturas e palavras incomuns | — | Não | — |

## 4. Apresentação/Design (#s3.4)
| Recomendação | Regras do axe-core | Cobertura | Prioridade |
|---|---|---|---|
| 4.1 Oferecer contraste mínimo entre plano de fundo e primeiro plano | color-contrast | Sim | Média |
| 4.2 Não utilizar apenas cor ou outras características sensoriais para diferenciar elementos | link-in-text-block | Parcial | Média |
| 4.3 Permitir redimensionamento sem perda de funcionalidade | meta-viewport, avoid-inline-spacing | Parcial | Média |
| 4.4 Possibilitar que o elemento com foco seja visualmente evidente | — | Não | — |

## 5. Multimídia (#s3.5)
| Recomendação | Regras do axe-core | Cobertura | Prioridade |
|---|---|---|---|
| 5.1 Fornecer alternativa para vídeo | video-caption | Parcial | Alta |
| 5.2 Fornecer alternativa para áudio | — | Não | — |
| 5.3 Oferecer audiodescrição para vídeo pré-gravado | — | Não | — |
| 5.4 Fornecer controle de áudio para som | no-autoplay-audio | Sim | Média |
| 5.5 Fornecer controle de animação | blink, marquee | Parcial | Média |

## 6. Formulário (#s3.6)
| Recomendação | Regras do axe-core | Cobertura | Prioridade |
|---|---|---|---|
| 6.1 Fornecer alternativa em texto para os botões de imagem de formulários | input-image-alt, input-button-name | Sim | Alta |
| 6.2 Associar etiquetas aos seus campos | label, select-name, form-field-multiple-labels, aria-input-field-name, aria-toggle-field-name, label-title-only (BP), label-content-name-mismatch | Sim | Alta |
| 6.3 Estabelecer uma ordem lógica de navegação | tabindex (BP) | Parcial | Média |
| 6.4 Não provocar automaticamente alteração no contexto | — | Não | — |
| 6.5 Fornecer instruções para entrada de dados (conferir o nome no PDF) | — | Não | — |
| 6.6 Identificar e descrever erros de entrada de dados e confirmar o envio das informações (conferir o nome no PDF) | — | Não | — |
| 6.7 Agrupar campos de formulário (conferir o nome no PDF) | — | Não | — |
| 6.8 Fornecer estratégias de segurança específicas ao invés de CAPTCHA (conferir o nome no PDF) | — | Não | — |

## Resumo
| Cobertura | Quantas | Recomendações |
|---|---|---|
| Sim | 14 | 1.3, 1.5, 1.8, 2.3, 2.4, 3.1, 3.3, 3.6, 3.7, 3.10, 4.1, 5.4, 6.1, 6.2 |
| Parcial | 15 | 1.2, 1.4, 2.1, 2.2, 2.5, 2.6, 2.7, 3.2, 3.5, 3.9, 4.2, 4.3, 5.1, 5.5, 6.3 |
| Não (só revisão humana) | 16 | 1.1, 1.6, 1.7, 1.9, 3.4, 3.8, 3.11, 3.12, 4.4, 5.2, 5.3, 6.4, 6.5, 6.6, 6.7, 6.8 |

- **Total que entra na nota:** 29 das 45 recomendações. O protótipo de 30/10 mostra "Verificando 38 itens do eMAG 3.1", um número ilustrativo; no MVP, o texto deve dizer 29.
- **Lista fechada da IA (RF08):** as 45 recomendações acima, com número, nome e link da seção. A IA só pode citar itens desta lista.
- **Nomes do protótipo conferidos:** os nomes 3.6, 6.2, 2.1, 4.1 e 1.3 da tela de resultado, e os nomes 1.4 e 3.5 da revisão humana, são iguais aos do texto oficial.

## Cálculo da nota (decisão de 05/11/2026)
Nota = 100 × (soma dos pesos das verificações aprovadas) ÷ (soma dos pesos das verificações aplicáveis).

- **Verificação** é cada recomendação com cobertura Sim ou Parcial que se aplica à página: o axe-core encontrou ao menos um elemento para avaliar.
- **Aprovada** é a recomendação sem nenhuma violação (resultado "failure") nas regras ligadas a ela.
- **Peso** pela prioridade do AcessaWeb: Alta 3, Média 2 e Baixa 1.
- **Revisão humana:** os resultados "needs review" e as 16 recomendações sem regra não entram na nota. Aparecem à parte, como revisão humana (RF09).
- **Nota por critério (RF06):** a tela mostra, para cada recomendação, se foi aprovada ou reprovada e o peso dela, com a conta que leva à nota total.
