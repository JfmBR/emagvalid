<!-- GERADO por _gerar_fontes.py em 10/11/2026 a partir de docs/contexto_projeto/Plano de Projeto v1.docx. NÃO EDITAR. -->
# Fonte literal: Plano de Projeto v1.docx
Origem: `docs/contexto_projeto/Plano de Projeto v1.docx` · Conversão automática, sem resumo. Linhas `- a | b` são linhas de tabela; células vazias aparecem como vazio.

Plano de
Projeto
[tabela]
- PROJETO / AcessaWeb | GRUPO / Grupo 3 · Trilha A
- DATA / 05/11/2026 | 
[fim da tabela]
Este plano descreve, de forma oficial, como a equipe vai executar o projeto integrador, a partir do TAP v1.0 de 08/10/2026. As seções de versões futuras indicam quando entram.
[tabela]
-  | Visão geral do projeto
[fim da tabela]
[tabela]
- PROJETO | AcessaWeb | SOLUÇÃO | Auditoria automatizada de acessibilidade do eMAG
- EQUIPE / TURMA | Grupo 3 | LÍDER DA EQUIPE | Luiz Felipe
- INÍCIO | 31/08/2026 | TÉRMINO PREVISTO | 11/12/2026 (congelamento do programa)
[fim da tabela]
[tabela]
- RESUMO DO PROJETO | MVP web para equipes de auditoria de acessibilidade. O(a) auditor(a) informa a URL de uma página pública e recebe as falhas segundo o eMAG 3.1, uma nota de 0 a 100 e orientações de correção apoiadas por IA, revisa o resultado e gera um PDF. O histórico guarda as avaliações. A nota e a IA complementam a avaliação humana; não são certificação. O objetivo é reduzir a documentação manual das auditorias.
- REFERÊNCIA | TAP v1.0 de 08/10/2026.
[fim da tabela]
[tabela]
-  | Objetivos e escopo
[fim da tabela]
[tabela]
- OBJETIVO GERAL |  | OBJETIVOS ESPECÍFICOS
- Publicar o AcessaWeb para apoiar auditorias de páginas web pelo eMAG 3.1, com identificação de falhas e relatórios, complementando a avaliação humana. Meta: fluxo completo aprovado em teste, incluindo revisão humana das orientações da IA. |  | Avaliar páginas e exibir falhas e nota de 0 a 100. / Gerar PDF com orientações de correção apoiadas por IA. / Oferecer login e histórico de avaliações.
[fim da tabela]
[tabela]
- DENTRO DO ESCOPO |  | FORA DO ESCOPO
- MVP web publicado em produção, conectado ao banco de dados, com código-fonte. / MVP para a banca: requisitos de prioridade alta e média (RF01 a RF14, RF16, RF17 e RNF01 a RNF08): login, avaliação por URL, falhas com local exato, nota por critério, orientações da IA com requisito verificável, revisão pelo(a) auditor(a), PDF e histórico. / Documentação e entrega final: 5 documentos vivos finais, README, checklist de aceite, Kit do Pitch e pitch de janeiro/2027. |  | Do projeto: varredura de várias páginas, aplicativo móvel e certificação de conformidade integral. / Fora do MVP, para versões futuras: avaliação de telas atrás de login do cliente; integração com Jira, GitHub, CI e API; comparação entre duas avaliações da mesma URL (RF15); exportação CSV ou texto para issue (RF18); canal de contato humano (RF19); uso em celular (RNF09).
[fim da tabela]
[tabela]
-  | Requisitos da solução
[fim da tabela]
REQUISITOS FUNCIONAIS · O QUE A SOLUÇÃO FAZ
[tabela]
- ID | REQUISITO FUNCIONAL | PRIORIDADE
- RF01 | O sistema deve permitir que o(a) auditor(a) crie conta e entre com login e senha | A
- RF02 | O sistema deve permitir informar a URL de uma página pública e iniciar a avaliação | A
- RF03 | O sistema deve analisar a página com verificações baseadas no eMAG 3.1 e identificar falhas | A
- RF04 | O sistema deve listar cada falha com o requisito do eMAG violado, o local exato na página (trecho ou seletor) e a prioridade | A
- RF05 | O sistema deve calcular e exibir uma nota de 0 a 100 | A
- RF06 | O sistema deve mostrar a nota por critério ou requisito, com a conta que levou ao total | A
- RF07 | O sistema deve gerar, com IA, orientações de correção para cada falha, com exemplo | A
- RF08 | A IA só deve citar requisitos de uma lista fechada do eMAG, cada um com identificação e link verificáveis | A
- RF09 | O sistema deve indicar na tela o que é verificação automática e o que exige revisão humana, e deixar claro que a nota e a IA não são certificação | A
- RF10 | O sistema deve permitir ao(à) auditor(a) revisar e aprovar as orientações da IA antes de gerar o PDF | A
- RF11 | O sistema deve permitir editar o texto das orientações antes de gerar o PDF | M
- RF12 | O sistema deve gerar um PDF com nota, falhas e orientações de correção | A
- RF13 | O PDF deve trazer resumo no início, prioridade e local exato de cada falha e exemplo de correção | A
- RF14 | O sistema deve guardar o histórico de avaliações do usuário e permitir abrir uma avaliação anterior | A
- RF15 | O sistema deve comparar duas avaliações da mesma URL (o que foi corrigido e o que continua) | B · fora do MVP
- RF16 | O sistema deve mostrar ajuda curta na própria tela, com exemplos | M
- RF17 | O sistema deve exibir mensagens de erro claras (URL inválida, página indisponível, análise que falhou) com o próximo passo | M
- RF18 | O sistema deve exportar o resultado em formato tabular (CSV) ou texto para colar em issue | B · fora do MVP
- RF19 | O sistema deve oferecer um canal de contato humano para dúvidas (por exemplo, e-mail ou formulário) | B · fora do MVP
[fim da tabela]
Prioridade: A = alta · M = média · B = baixa. Nota (RF05 e RF06) = 100 × pesos das verificações aprovadas ÷ pesos das verificações aplicáveis, com peso alta 3, média 2 e baixa 1, nas 29 recomendações do eMAG que o axe-core verifica; as demais vão para a revisão humana (RF09).
REQUISITOS NÃO FUNCIONAIS · COMO A SOLUÇÃO SE COMPORTA
[tabela]
- ID | REQUISITO NÃO FUNCIONAL | CATEGORIA
- RNF01 | A interface deve seguir o eMAG 3.1 e o WCAG: texto alternativo em todas as imagens, navegação por teclado e uso com leitor de tela | Usabilidade e acessibilidade
- RNF02 | Botões e áreas de clique grandes, com espaço entre elas | Usabilidade e acessibilidade
- RNF03 | Formulários curtos (login e cadastro), aviso do que será pedido antes de cada etapa e progresso salvo | Usabilidade
- RNF04 | Acesso protegido por login e senha; senhas armazenadas de forma protegida (hash) | Segurança
- RNF05 | Tratar apenas os dados necessários do usuário e das avaliações, conforme a LGPD; enviar à IA (Google Gemini) só o trecho da página pública com a falha, sem dado do usuário, e informar isso na tela | Privacidade
- RNF06 | Mostrar o andamento da análise enquanto ela roda; uma página analisada, com orientações, em até 60 segundos | Desempenho
- RNF07 | A nota e as orientações da IA devem sempre aparecer como apoio à avaliação humana, nunca como certificação | Conformidade
- RNF08 | Publicada em produção e conectada ao banco de dados até 04/12/2026 (Render e Neon, planos gratuitos) | Disponibilidade
- RNF09 | Funcionar nos navegadores atuais em computador; uso em celular a decidir (fora do MVP) | Compatibilidade
[fim da tabela]
[tabela]
-  | Entregas e estrutura do projeto
[fim da tabela]
[tabela]
- FASE | ENTREGAS PRINCIPAIS | RESPONSÁVEL | PRAZO
- Planejamento | TAP v1.0 (entregue em 08/10); requisitos priorizados; Plano de Projeto v1.0, v1.1 (+ arquitetura e tecnologias) e v1.2 (+ qualidade e testes) | Luiz Felipe (requisitos e v1.0); Matheus Francisconi (TAP e v1.1) | v1.0 06/11 · v1.1 13/11 · v1.2 04/12
- Design e protótipo | Persona v1.0 e Jornada v1.0 (entregues em 28/10, com atraso); protótipo clicável das 8 telas (pronto em 28/10) | João Francisco | 23/10 · protótipo 30/10
- Desenvolvimento | Código-fonte; ciclos de 16/11 a 04/12; primeira publicação na semana de 23/11; MVP publicado | João Francisco | 04/12
- Testes e ajustes | Checklist de aceite; plano e resultado de testes (funcional, usabilidade com pessoa de fora do grupo, acessibilidade da interface); correções finais | Luis Otavio | Checklist 04/12 · correções 11/12
- Entrega final | Solução em produção; 5 documentos finais; Kit do Pitch v1.0 (04/12) e final; Prévia do Pitch (09 ou 10/12); pitch oficial | Toda a equipe | 11/12 · pitch: jan./2027, a agendar
[fim da tabela]
[tabela]
-  | Metodologia de trabalho
[fim da tabela]
[tabela]
- ABORDAGEM | Adaptativa, com Kanban. Escolhida porque as datas são fixas (sextas-feiras) e o que varia é o escopo: se houver atraso, cortam-se requisitos, nunca os documentos oficiais nem a publicação.
- CICLOS E REUNIÕES | Reunião semanal com o mentor Rodrigo Pereira, de 1 h a 1 h 30. Reuniões do grupo conforme a necessidade. Construção em ciclos de uma semana: 16–20/11 (telas e estrutura, com checkpoint na quinta 19/11 por causa do feriado de 20/11), 23–27/11 (regras e primeira publicação) e 30/11–04/12 (fechar a prioridade alta e publicar). Retrospectiva curta a cada sexta.
- FERRAMENTAS DE GESTÃO | Trello, no quadro “emagvalid · Grupo 3”, já em uso e suficiente para o Kanban com responsáveis e prazos previsto no TAP. Comunicação por WhatsApp. Pasta única no Google Drive, com os documentos oficiais, as atas e um índice de links.
- CONTROLE DE VERSÃO | Repositório no GitHub: https://github.com/JfmBR/emagvalid (criado em 03/11; público desde 05/11), com CI que confere lint, testes e build a cada envio. A main é protegida; cada tarefa tem uma branch curta (feat/, fix/ ou docs/); a pull request só entra com o CI verde e a revisão de Matheus Francisconi; merge por squash; commits em português.
- DEFINIÇÃO DE PRONTO | Um requisito está pronto quando funciona no ambiente publicado, foi revisado por outro integrante, foi testado por Luis Otavio e, se for de interface, passou na checagem com teclado e leitor de tela.
[fim da tabela]
[tabela]
-  | Arquitetura e tecnologias
[fim da tabela]
[tabela]
- TIPO DE SOLUÇÃO | ☒ Sistema web      ☐ Aplicativo móvel      ☐ Sistema web e aplicativo
- FRONT-END | Entra na v1.1 (13/11). Previsto no TAP: React e TypeScript.
- BACK-END | Entra na v1.1 (13/11). Previsto no TAP: Node.js e Express; Playwright e axe-core. API de IA: Google Gemini, plano gratuito (decidido em 05/11).
- BANCO DE DADOS | Entra na v1.1 (13/11). Previsto no TAP: PostgreSQL.
- HOSPEDAGEM | Render (plano gratuito) para telas e API e PostgreSQL no Neon (plano gratuito), decididos em 05/11. Detalhes na v1.1 (13/11).
[fim da tabela]
[tabela]
- TELAS E FLUXOS PRINCIPAIS |  | DADOS E SEGURANÇA
- Entrada: tela inicial, cadastro e login. / Avaliação: nova avaliação, análise em andamento (e erro), resultado, orientação da IA. / Saída: prévia do relatório e histórico. |  | Entra na v1.1 (13/11): dados pessoais tratados e como são protegidos. / Entra na v1.1 (13/11): perfis de acesso e permissões.
[fim da tabela]
[tabela]
-  | Marcos de Entrega
[fim da tabela]
[tabela]
- ATIVIDADE | RESPONSÁVEL | INÍCIO | FIM
- Requisitos priorizados e Plano de Projeto v1.0 | Luiz Felipe | 02/11 | 06/11
- Arquitetura e tecnologias (Plano de Projeto v1.1) | Matheus Francisconi | 09/11 | 13/11
- Ciclo 1: telas principais e estrutura | João Francisco | 16/11 | 19/11
- Ciclo 2: regras de negócio e primeira publicação | João Francisco | 23/11 | 27/11
- Ciclo 3: fechar a prioridade alta e publicar o MVP | João Francisco | 30/11 | 04/12
- Checklist de aceite e Plano de Projeto v1.2 | Luis Otavio | 30/11 | 04/12
- Kit do Pitch v1.0 | Toda a equipe | 30/11 | 04/12
- Prévia do Pitch (sugestão: 09 ou 10/12) | Toda a equipe | 09/12 | 10/12
- Testes finais e correções | Luis Otavio | 07/12 | 11/12
- Congelamento: 5 documentos finais e lições aprendidas | Leandro Cobra | 07/12 | 11/12
- Pitch oficial | Toda a equipe | Jan./2027 | A agendar
[fim da tabela]
[tabela]
-  | Equipe e responsabilidades
[fim da tabela]
[tabela]
- NOME | FUNÇÃO | RESPONSABILIDADES | HORAS POR SEMANA
- Luiz Felipe | Líder da equipe e gerente | Gerenciar tarefas | 3 h
- Leandro Cobra | Documentação | Organizar e atualizar os documentos do projeto | 3 h
- João Francisco | UX/UI e desenvolvimento | Projetar interfaces e protótipo de telas; desenvolver e publicar a solução (desde 03/11) | 10 h
- Luis Otavio | Testes | Testar o fluxo e registrar falhas | 3 h
- Matheus Francisconi | Analista de requisitos | Levantar e organizar os requisitos e revisar as pull requests do código | 3 h
[fim da tabela]
[tabela]
-  | Plano de comunicação
[fim da tabela]
[tabela]
- COMUNICAÇÃO | PÚBLICO | FREQUÊNCIA | CANAL | RESPONSÁVEL
- Reunião de acompanhamento | Grupo 3 e mentor Rodrigo Pereira | Semanal | A combinar com o mentor; reunião gravada | Luiz Felipe
- Relatório de status | Grupo 3 e mentor | Semanal: ata em até 48 h | Pasta única do projeto | João Francisco (ata)
- Apresentação de resultados | Mentores e banca | Prévia (dezembro) e pitch (jan./2027) | Prévia e pitch do programa | Toda a equipe
- Dia a dia do grupo | Grupo 3 | Conforme a necessidade | WhatsApp e Trello | Luiz Felipe
[fim da tabela]
[tabela]
-  | Recursos e orçamento
[fim da tabela]
[tabela]
- RECURSO | DESCRIÇÃO | QUANTIDADE | CUSTO ESTIMADO
- Computadores e internet | Desenvolvimento, testes e comunicação da equipe | 5 | R$ 0 (de cada integrante)
- Ferramentas de desenvolvimento | Programação, UX/UI, análise e banco de dados | Gratuitas | R$ 0
- Hospedagem e infraestrutura | Render, Neon e Google Gemini, em planos gratuitos | 3 serviços | R$ 0
- Total estimado |  |  | R$ 0
[fim da tabela]
[tabela]
-  | Gestão de riscos
[fim da tabela]
[tabela]
- RISCO | CHANCE | IMPACTO | MITIGAÇÃO | CONTINGÊNCIA
- R1 · Dificuldade para aprender as bibliotecas e adequar as verificações ao eMAG | M | A | Estudar a documentação, testar páginas simples, conferir critérios do eMAG e buscar apoio do orientador | Reduzir os requisitos do eMAG cobertos no MVP e registrar o limite na própria ferramenta
- R2 · Atrasos ou falta de comunicação nas tarefas | M | A | Definir prazos; conversar com o integrante e reportar ao orientador | Redistribuir a tarefa; se faltar tempo, cortar primeiro RF11 e RF16, só com o aval do mentor (regra da Trilha A); nunca a publicação nem a LGPD (RNF05)
- R3 · Repetir nos marcos de novembro o atraso de Persona e Jornada, entregues 5 dias após o marco | M | M | Prazos e responsáveis no Trello; checkpoint semanal às sextas | Avisar o mentor na semana do marco e entregar as seções prontas
- R4 · Desenvolvimento concentrado em uma pessoa (João Francisco, desde 03/11): com 10 h por semana, são 30 h de programação nos 3 ciclos | A | A | Cumprir as 10 h semanais; começar antes de 16/11 pelas partes de maior risco (análise e publicação); passar ao grupo o que não é código; pedir apoio ao mentor José Alves; revisão das pull requests por outro integrante | Com o aval do mentor, cortar requisitos de prioridade média, exceto a LGPD (RNF05)
- R5 · IA gerar orientação errada ou citar requisito inexistente | M | A | Lista fechada de requisitos (RF08), revisão pelo(a) auditor(a) (RF10) e aviso de que não é certificação (RF09) | Usar texto padrão por requisito no lugar do texto livre da IA
- R6 · Pedidos fora do TAP (telas com login do cliente, integrações) ampliarem o escopo | M | M | Registrar como versão futura e usar o controle de mudanças | Aprovar a mudança só com o mentor, trocando por requisito de mesmo peso
- R7 · Limites dos planos gratuitos (Render hiberna e tem pouca memória; Gemini limita as chamadas) derrubarem a análise ou estourarem os 60 s | M | A | Publicar cedo e testar páginas pesadas; mostrar o andamento (RNF06); guardar as orientações já geradas | Usar texto padrão por requisito no lugar da IA e avaliar um plano pago de baixo custo com os mentores Fábio Rezente e Rodrigo Pereira
[fim da tabela]
A = alta · M = média · B = baixa
[tabela]
-  | Qualidade e testes
[fim da tabela]
[tabela]
- CRITÉRIOS DE ACEITAÇÃO |  | TIPOS DE TESTE
- Entra na v1.2 (04/12). Prévia: cada requisito de prioridade alta funciona no ambiente publicado. / Fluxo completo aprovado em teste, incluindo revisão humana das orientações da IA. / Interface aprovada na checagem com teclado e leitor de tela. |  | Entra na v1.2 (04/12). Prévia: teste funcional do fluxo completo. / Teste de usabilidade com pessoa de fora do grupo. / Teste de segurança do login e de acessibilidade da interface.
[fim da tabela]
[tabela]
- RESPONSÁVEL PELOS TESTES | Luis Otavio
- REGISTRO DE ERROS | Trello: um cartão por falha, com responsável e prazo (fecha na v1.2).
[fim da tabela]
[tabela]
-  | Controle de mudanças e encerramento
[fim da tabela]
[tabela]
- MUDANÇAS DE ESCOPO | Qualquer integrante propõe; o líder e o analista de requisitos avaliam; o grupo decide por votação e aprova com o mentor; a mudança entra no histórico de revisões. Pivô de público ou de tema depois de 09/10 exige justificativa em ata e acordo entre mentor e grupo.
- CRITÉRIOS DE ENCERRAMENTO | Solução em produção, 5 documentos finais, checklist de aceite cumprido, Kit do Pitch com os ajustes da prévia e lições aprendidas registradas até 11/12.
- ENTREGA FINAL | Solução e documentos na pasta única até 11/12. Pitch oficial de 10 minutos em janeiro/2027, com demonstração da solução em produção e perguntas da banca.
- LIÇÕES APRENDIDAS | Entra na versão final (11/12). Anotar o aprendizado na retrospectiva de sexta e consolidar aqui.
[fim da tabela]
[tabela]
-  | Aprovação e histórico de revisões
[fim da tabela]
Ao assinar, as partes concordam com o planejamento descrito neste documento.
[tabela]
- Luiz Felipe / LÍDER DA EQUIPE / Data: ____/____/______ |  | Rodrigo Pereira / ORIENTADOR(A) EXTERNO(A) / Data: ____/____/______ |  | Luiz Eduardo de Souza Nunes / FACILITADOR CONECTA JOVEM / Data: ____/____/______
[fim da tabela]
HISTÓRICO DE REVISÕES
[tabela]
- VERSÃO | DATA | AUTOR | O QUE MUDOU
- v1.0 (protótipo) | 01/11/2026 | João Francisco | Protótipo no modelo oficial, a partir do rascunho de 28/10, para revisão do grupo e do mentor
- v1.0 (revisão) | 05/11/2026 | João Francisco | Ajustes de 03/11 e 05/11: João no desenvolvimento, repositório, RF15 fora do MVP, nota na v1.1, regra de corte
- v1.0 (revisão 2) | 05/11/2026 | João Francisco | Hospedagem, IA, nota, branches, horas, tempo, custos e pasta única; propostas aprovadas
- v1.0 (revisão 3) | 05/11/2026 | João Francisco | Projeto renomeado para AcessaWeb; Luiz Felipe passa a líder e Matheus Francisconi a analista de requisitos; repositório de código público
- v1.0 | 05/11/2026 | João Francisco | Versão oficial: retirados o aviso de revisão e os rótulos (TAP); data oficial no cabeçalho; grafia corrigida em ORIENTADOR(A) EXTERNO(A) e FACILITADOR
[fim da tabela]

## Cabeçalhos e rodapés
- word/footer1.xml: Conecta Jovem  ·  Plano de projetoPágina
