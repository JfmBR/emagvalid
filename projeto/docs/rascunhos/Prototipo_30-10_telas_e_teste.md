# Protótipo de telas — 30/10/2026 (rascunho)

**Pronto em 28/10/2026.** Protótipo clicável: `docs/prototipo/prototipo_emagvalid.html` (link privado: endereço no Índice de links do Drive do grupo). Figma: endereço no Índice de links do Drive do grupo (fluxo "Teste 30/10 · fluxo principal", com os cliques ligados).

Responsável: João Francisco (UX/UI). Base: Jornada v1.0 (Contexto 1 — avaliar e entregar) e `Requisitos_Plano_de_Projeto_v1.0.md`.
Tudo o que está aqui é **dado fictício para o protótipo**: URL, nota, falhas e textos. O cálculo real da nota ainda está "a definir" (ver `contexto_agente/07`, seção B).

## Como montar
- **Ferramenta:** Figma, modo protótipo, link "qualquer pessoa com o link pode ver".
- **Fidelidade:** média. Cores e tipografia simples, textos reais (os desta página), sem lorem ipsum.
- **Tamanho:** desktop, frame de 1440 × 1024.
- **Componentes:** botão primário e secundário (altura mínima de 44 px), campo com rótulo visível, selo de prioridade (Alta, Média, Baixa) e selo de origem ("Automático" e "Revisão humana").
- **Acessibilidade do próprio protótipo** (entrevistas Ctx; regra do projeto):
  - contraste de pelo menos 4,5:1 no texto;
  - rótulo visível em todo campo;
  - foco visível desenhado num dos estados;
  - nada que dependa só de cor (selo com texto + cor);
  - ícones com texto ao lado.
- **Fluxo clicável:** 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8, mais o caminho de erro 3 → 4b → 3.

## Página avaliada no protótipo (fictícia)
`https://servicos.exemplo.gov.br/agendamento`: página de agendamento de atendimento de uma prefeitura fictícia.

**Conta da nota (fórmula ilustrativa, só para o protótipo):** verificações automáticas aprovadas ÷ verificações feitas.

| Seção do eMAG 3.1 | Aprovadas / feitas | Falhas |
|---|---|---|
| 1 · Marcação | 8 / 10 | 2 |
| 2 · Comportamento | 5 / 6 | 1 |
| 3 · Conteúdo/Informação | 9 / 12 | 3 |
| 4 · Apresentação/Design | 4 / 6 | 2 |
| 6 · Formulário | 2 / 4 | 2 |
| **Total** | **28 / 38 = 74** | **10** |

**Falhas automáticas (10 ocorrências em 5 requisitos):**

| Requisito (eMAG 3.1) | Ocorrências | Prioridade | Local (exemplo) |
|---|---|---|---|
| 3.6 Fornecer alternativa em texto para as imagens do sítio | 3 | Alta | Banner principal: `main > .banner img` |
| 6.2 Associar etiquetas aos seus campos | 2 | Alta | Campos "CPF" e "Data" do formulário de agendamento |
| 2.1 Disponibilizar todas as funções da página via teclado | 1 | Alta | Calendário de datas: `#calendario` |
| 4.1 Oferecer contraste mínimo entre plano de fundo e primeiro plano | 2 | Média | Botão "Agendar" e rodapé |
| 1.3 Utilizar corretamente os níveis de cabeçalho | 2 | Média | Página salta de `h1` para `h4` |

**Revisão humana (não entra na nota):** se o texto alternativo descreve bem a imagem (3.6); ordem lógica de leitura e tabulação (1.4); se os links são claros fora do contexto (3.5).

> Nomes conferidos em 05/11/2026 no texto oficial do eMAG 3.1 (https://emag.governoeletronico.gov.br/): 3.6, 6.2, 2.1, 4.1, 1.3, 1.4 e 3.5 estão corretos (`Cobertura_eMAG_axe-core.md`). A prioridade (Alta/Média/Baixa) é do AcessaWeb e do(a) auditor(a), não do eMAG.

---

## Tela 1 · Inicial
**Objetivo:** dizer logo o que é automático e o que fica com a auditora (RF09; Jornada, etapa 1; A1).
- **Título:** "Audite páginas pelo eMAG 3.1 e entregue o relatório em menos tempo."
- **Dois blocos lado a lado:**
  - **O que o AcessaWeb faz:** verifica a página automaticamente, calcula a nota mostrando a conta, sugere correções com IA e gera o PDF.
  - **O que continua com você:** revisar as sugestões, testar com teclado e leitor de tela e dar a conclusão de conformidade.
- **Aviso fixo:** "A nota é um apoio à auditoria. Não é certificação de conformidade."
- **Botões:** "Criar conta" (primário) · "Entrar" (secundário).

## Tela 2 · Cadastro e login
**Objetivo:** cadastro curto, avisando antes o que será pedido (RF01; Ctx).
- **Texto de apoio:** "Vamos pedir só 3 dados: nome, e-mail e senha."
- **Campos:** Nome · E-mail · Senha (com "mostrar senha" e a regra escrita embaixo: "mínimo de 8 caracteres").
- **Botões:** "Criar conta" · link "Já tenho conta".
- **Estado de erro (desenhar um):** "Digite um e-mail válido, como nome@empresa.com.br."
- Depois do cadastro: "Olá, Helena" no topo, e vai para a tela 3.

## Tela 3 · Nova avaliação
**Objetivo:** informar a URL sem precisar de tutorial (RF02, RF16; A1, A2: nada de tutorial longo).
- **Título:** "Qual página você quer avaliar?"
- **Campo:** rótulo "Endereço da página (URL)" · exemplo embaixo: "Ex.: https://servicos.exemplo.gov.br/agendamento".
- **Ajuda curta, ao lado do campo:** "Uma página pública por vez. Páginas que pedem login ainda não são avaliadas." (escopo do TAP)
- **Botão:** "Avaliar página".

## Tela 4 · Analisando (e 4b · Erro)
**Objetivo:** mostrar o progresso e, se der erro, dizer o que fazer (RF17; Jornada, etapa 4).
- **4 · Progresso, em 3 passos:** "Carregando a página" ✓ → "Verificando 38 itens do eMAG 3.1" (em andamento) → "Preparando as orientações".
- **4b · Erro de URL inválida:**
  - **Título:** "Não conseguimos abrir essa página."
  - **Texto:** "Confira se o endereço começa com https:// e se a página abre sem login."
  - **Botões:** "Corrigir o endereço" (volta à tela 3) · "Ver ajuda".
- (Opcional) **4c · A análise falhou:** "A página demorou demais para responder. Tente de novo em alguns minutos." · botão "Tentar de novo".

## Tela 5 · Resultado — MV1: a nota aparece com a conta
**Objetivo:** nota com explicação critério a critério, falhas com local e prioridade (RF04, RF05, RF06, RF09; A1, A2, A3).
- **Topo:** URL avaliada · data "28/10/2026, 14:32" · **Nota 74/100**.
- **Aviso:** "Nota automática: não é certificação. A conclusão de conformidade é sua."
- **"Como chegamos a 74":** a tabela de seções acima, que abre e fecha.
- **Abas:**
  - "Falhas automáticas (10)";
  - "Revisão humana (3)": a lista de revisão humana acima, com caixas de marcar.
- **Lista de falhas:** um cartão por requisito, ordenado por prioridade, mostrando o selo de prioridade, o requisito com número e nome, o número de ocorrências e o local. Botão "Ver orientação" (vai para a tela 6).
- **Rodapé da tela:** "Orientações revisadas: 0 de 5" · botão "Prévia do relatório".

## Tela 6 · Orientação da IA — MV2: as orientações são verificáveis
**Objetivo:** o requisito citado pode ser conferido e a decisão é da Helena (RF07, RF08, RF10, RF11; A2: a IA não pode inventar requisito).
- **Cabeçalho:** selo "Alta" · "3.6 Fornecer alternativa em texto para as imagens do sítio" · link "Ler a recomendação no eMAG 3.1" (abre o site oficial).
- **Ocorrência 1 de 3:**
  - Local: banner principal, `main > .banner img`.
  - Trecho encontrado: `<img src="/img/banner-vacina.jpg">`.
- **Bloco "Sugestão da IA — revise antes de usar":**
  - Por que é falha: "A imagem não tem texto alternativo. Quem usa leitor de tela ouve só 'imagem' e perde a informação da campanha."
  - Exemplo de correção: `<img src="/img/banner-vacina.jpg" alt="Campanha de vacinação contra a gripe, de 15/04 a 31/05, nas unidades de saúde">`.
- **Botões:** "Aprovar" · "Editar" · "Descartar".
- **Estado "Editar" (desenhar):** caixa de texto com a sugestão editável e o botão "Salvar edição".
- **Navegação:** "← Falha anterior" · "Próxima falha →" · "Voltar ao resultado".

## Tela 7 · Prévia do relatório — MV3: o relatório sai pronto para o cliente
**Objetivo:** PDF com resumo, prioridade, local exato e correção, sem precisar refazer o texto (RF12, RF13; A1, A2).
- **Prévia da página do PDF:**
  - capa: nome do cliente e URL;
  - **resumo no início:** nota 74, 10 falhas (6 de prioridade alta e 4 de média) e 3 itens de revisão humana;
  - tabela de falhas: requisito, prioridade, local e correção;
  - seção "Revisão humana";
  - rodapé: "Relatório gerado com apoio do AcessaWeb. Conclusão de conformidade: Helena, analista de acessibilidade." (sem sobrenome, decidido ao montar o protótipo)
- **Aviso, se faltar revisão:** "2 orientações ainda não foram revisadas." · botões "Revisar agora" · "Gerar mesmo assim".
- **Botão:** "Baixar PDF".

## Tela 8 · Histórico
**Objetivo:** guardar e reabrir avaliações; base para a nova auditoria do Contexto 2 (RF14; A1).

| Data | Página | Nota | Ações |
|---|---|---|---|
| 28/10/2026 | servicos.exemplo.gov.br/agendamento | 74 | Abrir · Baixar PDF · Avaliar de novo |
| 14/10/2026 | servicos.exemplo.gov.br/agendamento | 61 | Abrir · Baixar PDF · Avaliar de novo |
| 07/10/2026 | servicos.exemplo.gov.br/ouvidoria | 82 | Abrir · Baixar PDF · Avaliar de novo |

- A comparação lado a lado fica **fora** do protótipo, porque está fora do TAP v1.0 (F). Não desenhar o botão.

---

## Roteiro do teste — 30/10/2026
> **Não será usado** (decisão do João em 29/10/2026): não haverá teste com auditores; o protótipo será só enviado ao mentor (Rodrigo Pereira). Roteiro mantido para referência.

**Quem:** 2 auditores já entrevistados (sugestão: A1 e A2 ou A3). Convidar em 29/10.
**Como:** chamada de vídeo de 15 a 20 minutos, com tela compartilhada. A pessoa navega pelo link do Figma e fala em voz alta o que pensa. Pedir autorização antes de gravar.
**Quem conduz:** João conduz; Luis Otavio (Testes) anota.

### Abertura (1 min)
"Estamos testando o protótipo, não você. Pode criticar à vontade. Fale em voz alta o que está pensando. Eu não vou ajudar durante as tarefas, só no final."

### Tarefas
| # | Tarefa (dizer assim) | Mede | Deu certo se… |
|---|---|---|---|
| 1 | "Avalie a página de agendamento da prefeitura e me diga a nota e por que ela deu esse valor." | MV1 | Chega à tela 5 e explica a nota pela tabela "Como chegamos a 74" |
| 2 | "Digite este endereço: servicos.exemplo/agendamento." (URL sem https) | Caminho de erro | Entende a mensagem da tela 4b e corrige sozinha |
| 3 | "Escolha uma falha, confira se a orientação está certa e decida se usa ou não." | MV2 | Abre o link do eMAG ou comenta a fonte; aprova, edita ou descarta |
| 4 | "Gere o relatório para mandar ao cliente." | MV3 | Chega à tela 7 e baixa o PDF sem pedir ajuda |

### Perguntas finais (3 min)
1. "Em que ponto você confiou ou desconfiou do resultado?"
2. "O relatório da tela 7 você mandaria ao cliente como está? O que mudaria?"
3. "Você usaria isso no lugar do que usa hoje? Por quê?"

### Registro (uma linha por tarefa e por pessoa)
| Pessoa | Tarefa | Concluiu? (sim / com ajuda / não) | Onde travou | Fala literal |
|---|---|---|---|---|
| | | | | |

Depois do teste:
- os resultados entram em "Como validar" (seção Fontes e validação) da **Jornada v1.1**;
- as falas entram em `contexto_agente/07` (seção D) e, se forem fortes, em "Falas e evidências" da Persona.

## Pendências deste protótipo
- Enviar ao mentor (Rodrigo Pereira) em 30/10 o link do protótipo e o arquivo do Figma (os dois são privados; compartilhar antes).
- ~~Conferir no texto oficial do eMAG 3.1 os nomes das recomendações citadas e o link.~~ Conferido em 05/11/2026: nomes corretos. O site não tem âncora por recomendação, só por seção (ex.: `#s3.3`). No MVP, "Verificando 38 itens" passa a 29 (`Cobertura_eMAG_axe-core.md`).
- O cálculo da nota é ilustrativo; o real foi definido em 05/11 (pesos por prioridade; `Cobertura_eMAG_axe-core.md`).
