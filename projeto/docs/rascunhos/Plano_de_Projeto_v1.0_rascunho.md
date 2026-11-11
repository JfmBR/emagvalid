# Plano de Projeto — v1.0 (rascunho)

Marco: **06/11/2026**. Seções previstas para a v1.0: escopo, requisitos priorizados, entregas, equipe, metodologia e riscos (arquitetura e tecnologias entram na v1.1, em 13/11).
Legenda: **TAP** = vem do TAP v1.0. **Decisão de 05/11** = proposta aprovada pelo João em 05/11/2026 para zerar as pendências (`contexto_agente/07-pendencias-e-decisoes.md`, seção D); se o grupo ou o mentor discordarem, entra pelo controle de mudanças.
Versão oficial atual: [Plano de Projeto v1.1.docx](../contexto_projeto/Plano%20de%20Projeto%20v1.1.docx), de 11/11/2026 (público novo, RF20, RF21, RNF10, arquitetura; ver `contexto_agente/07-pendencias-e-decisoes.md`, seção D). Este rascunho descreve a v1.0: [Plano de Projeto v1.docx](../contexto_projeto/Plano%20de%20Projeto%20v1.docx), oficial desde 05/11/2026 (antes era o protótipo `Plano_de_Projeto_emagvalid_v1.0_prototipo_01-11-2026.docx`, nesta pasta, de 01/11/2026, com todas as seções do modelo). O .docx recebeu em 05/11 os ajustes de 03/11 e as primeiras decisões de 05/11 (desenvolvimento com o João, repositório, RF15 fora do MVP, regra de corte em R2 e R4) e, depois, as da segunda rodada (hospedagem, IA, nota, branches, horas, tempo, custos, pasta única; rótulos "proposta" retirados).

| | |
|---|---|
| **PROJETO** | AcessaWeb · Auditoria automatizada de acessibilidade do eMAG |
| **GRUPO** | Grupo 3 · Trilha A (produto funcional) |
| **DATA** | 01/11/2026 (rascunho; ajustado em 03/11 e 05/11/2026; nome AcessaWeb e líder Luiz Felipe desde 05/11) |

---

## Visão geral do projeto

| | | | |
|---|---|---|---|
| **PROJETO** | AcessaWeb | **SOLUÇÃO** | Sistema web de auditoria de acessibilidade pelo eMAG 3.1 |
| **EQUIPE / TURMA** | Grupo 3 | **LÍDER** | Luiz Felipe |
| **INÍCIO** | 31/08/2026 | **TÉRMINO PREVISTO** | 11/12/2026 (congelamento do programa) |

**Resumo:** MVP web para equipes de auditoria de acessibilidade. O(a) auditor(a) informa a URL de uma página pública e recebe as falhas segundo o eMAG 3.1, uma nota de 0 a 100 e orientações de correção apoiadas por IA, revisa o resultado e gera um PDF. O histórico guarda as avaliações. A nota e a IA complementam a avaliação humana; não são certificação. O objetivo é reduzir a documentação manual das auditorias.
**Referência:** TAP v1.0 de 08/10/2026 (aprovação formal pendente).

## Objetivos e escopo

| OBJETIVO GERAL | OBJETIVOS ESPECÍFICOS |
|---|---|
| Publicar o AcessaWeb para apoiar auditorias de páginas web pelo eMAG 3.1, com identificação de falhas e relatórios, complementando a avaliação humana. **Meta:** fluxo completo aprovado em teste, incluindo revisão humana das orientações da IA (TAP). | 1. Avaliar páginas e exibir falhas e nota de 0 a 100. 2. Gerar PDF com orientações de correção apoiadas por IA. 3. Oferecer login e histórico de avaliações. (TAP) |

| DENTRO DO ESCOPO | FORA DO ESCOPO |
|---|---|
| **O que será entregue:** MVP web publicado em produção, conectado ao banco de dados, com código-fonte (TAP). | **Do projeto (TAP):** varredura de várias páginas, aplicativo móvel, certificação de conformidade integral. |
| **MVP apresentado à banca:** os requisitos de prioridade alta e média (RF01 a RF14, RF16, RF17 e RNF01 a RNF08), em especial: login, avaliação por URL, falhas com local exato, nota por critério, orientações da IA com requisito verificável, revisão pelo(a) auditor(a), PDF e histórico. | **Fora do MVP, para versões futuras (decisão do João em 28/10, aprovada em 05/11):** avaliação de telas atrás de login do cliente; integração com Jira, GitHub, CI e API; exportação CSV ou texto para issue (RF18); canal de contato humano (RF19); uso em celular (RNF09); comparação entre duas avaliações da mesma URL (RF15, decisão do João em 05/11). |
| **Documentação e entrega final:** 5 documentos vivos finais, README, checklist de aceite, Kit do Pitch e pitch de janeiro/2027 (programa). | |

## Requisitos da solução

A tabela completa está em [Requisitos_Plano_de_Projeto_v1.0.md](Requisitos_Plano_de_Projeto_v1.0.md). Resumo para colar no Plano:

**Funcionais (prioridade A = alta · M = média · B = baixa)**

| ID | Requisito funcional | Prior. |
|---|---|---|
| RF01 | Criar conta e entrar com login e senha | A |
| RF02 | Informar a URL de uma página pública e iniciar a avaliação | A |
| RF03 | Analisar a página com verificações baseadas no eMAG 3.1 e identificar falhas | A |
| RF04 | Listar cada falha com requisito violado, local exato e prioridade | A |
| RF05 | Calcular e exibir nota de 0 a 100 | A |
| RF06 | Mostrar a nota por critério, com a conta | A |
| RF07 | Gerar orientações de correção com IA, com exemplo | A |
| RF08 | A IA só cita requisitos de uma lista fechada do eMAG, com identificação e link | A |
| RF09 | Indicar o que é automático e o que exige revisão humana; nota e IA não são certificação | A |
| RF10 | Revisar e aprovar as orientações da IA antes do PDF | A |
| RF11 | Editar o texto das orientações antes do PDF | M |
| RF12 | Gerar PDF com nota, falhas e orientações | A |
| RF13 | PDF com resumo no início, prioridade, local exato e exemplo de correção | A |
| RF14 | Guardar o histórico e abrir avaliações anteriores | A |
| RF16 | Ajuda curta na tela, com exemplos | M |
| RF17 | Mensagens de erro claras, com o próximo passo | M |

(RF15, RF18 e RF19, de prioridade B, ficam fora do MVP. O RF15 passou de média para baixa em 05/11, como no TAP, no protótipo e na Jornada.)

**Cálculo da nota (RF05 e RF06), decisão de 05/11:** nota = 100 × soma dos pesos das verificações aprovadas ÷ soma dos pesos das verificações aplicáveis. Peso pela prioridade do AcessaWeb (alta 3, média 2, baixa 1), porque o eMAG 3.1 não tem níveis de prioridade. Entram na nota as 29 recomendações do eMAG que o axe-core verifica, no todo ou em parte; as outras 16 e os resultados "needs review" ficam na revisão humana (RF09). Detalhes e lista fechada da IA (RF08): [Cobertura_eMAG_axe-core.md](Cobertura_eMAG_axe-core.md).

**Não funcionais**

| ID | Requisito não funcional | Categoria |
|---|---|---|
| RNF01 | Interface conforme eMAG 3.1/WCAG: texto alternativo, teclado e leitor de tela | Usabilidade e acessibilidade |
| RNF02 | Botões e áreas de clique grandes, com espaço | Usabilidade e acessibilidade |
| RNF03 | Formulários curtos, aviso do que será pedido e progresso salvo | Usabilidade |
| RNF04 | Acesso por login e senha; senhas armazenadas de forma protegida | Segurança |
| RNF05 | Tratar só os dados necessários (LGPD); à IA (Google Gemini) vai só o trecho da página pública com a falha, sem dado do usuário, e a tela informa isso | Privacidade |
| RNF06 | Mostrar o andamento da análise; uma página analisada, com orientações, em até 60 s | Desempenho |
| RNF07 | Nota e IA sempre como apoio, nunca como certificação | Conformidade |
| RNF08 | Publicada em produção, ligada ao banco, até 04/12/2026 (Render, plano gratuito, e PostgreSQL no Neon, plano gratuito) | Disponibilidade |

## Entregas e estrutura do projeto

| FASE | ENTREGAS PRINCIPAIS | RESPONSÁVEL | PRAZO |
|---|---|---|---|
| Planejamento | TAP v1.0 (entregue em 08/10); Plano de Projeto v1.0, v1.1 (+ arquitetura e tecnologias) e v1.2 (+ qualidade e testes); requisitos priorizados | Luiz Felipe (requisitos e v1.0); Matheus Francisconi (TAP e v1.1) | v1.0 06/11 · v1.1 13/11 · v1.2 04/12 |
| Design e protótipo | Persona v1.0 e Jornada v1.0; protótipo clicável das 8 telas | João Francisco | Persona e Jornada: 23/10 (entregues em 28/10, com atraso) · protótipo 30/10 (pronto em 28/10) |
| Desenvolvimento | Código-fonte; sprints de 16/11 a 04/12; primeira publicação na semana de 23/11; MVP publicado | João Francisco (desde 03/11; no TAP: Matheus Francisconi) | MVP em produção: 04/12 |
| Testes e ajustes | Checklist de aceite; plano e resultado de testes (funcional, usabilidade com pessoa de fora do grupo, acessibilidade da interface); correções finais | Luis Otavio | Checklist 04/12 · correções 11/12 |
| Entrega final | Solução em produção; 5 documentos finais; Kit do Pitch v1.0 (04/12) e final; prévia do pitch (09 ou 10/12); pitch oficial em janeiro/2027 | Toda a equipe | 11/12/2026 · pitch: janeiro/2027, dia a agendar |

## Metodologia de trabalho

| | |
|---|---|
| **ABORDAGEM** | Adaptativa, com Kanban (acordo de equipe do TAP). Escolhida porque as datas são fixas (sextas-feiras) e o que varia é o escopo: se houver atraso, cortam-se requisitos, nunca os documentos oficiais nem a publicação. |
| **CICLOS E REUNIÕES** | Reunião semanal com o mentor Rodrigo Pereira, de 1 h a 1 h 30 (programa). Reuniões do grupo conforme a necessidade (TAP). Construção em ciclos de uma semana: 16–20/11 (telas e estrutura), 23–27/11 (regras e primeira publicação), 30/11–04/12 (fechar prioridade alta e publicar). Checkpoint na quinta 19/11, por causa do feriado de 20/11. Retrospectiva curta a cada sexta. |
| **FERRAMENTAS DE GESTÃO** | Trello, no quadro "emagvalid · Grupo 3", já em uso e suficiente para o Kanban com responsáveis e prazos previsto no TAP. Comunicação por WhatsApp (TAP). Pasta única do projeto no Google Drive, compartilhada com o grupo e o mentor, com os .docx oficiais, as atas e um documento-índice com os links (Trello, GitHub, Figma, protótipo, Render). |
| **CONTROLE DE VERSÃO** | Repositório no GitHub: https://github.com/JfmBR/emagvalid (criado em 03/11; público desde 05/11, para permitir a proteção da `main`), com CI que confere lint, testes e build a cada envio. Regras: a `main` é protegida; cada tarefa tem uma branch curta (`feat/`, `fix/` ou `docs/`); a PR só entra com o CI verde e a revisão de outro integrante (Matheus); merge por squash; commits em pt-BR. O grupo é convidado para o repositório. |
| **DEFINIÇÃO DE PRONTO** | Um requisito está pronto quando: funciona no ambiente publicado; foi revisado por outro integrante; foi testado pelo Luis Otavio; e, se for de interface, passou na checagem de acessibilidade com teclado e leitor de tela. |

## Equipe e responsabilidades

| NOME | FUNÇÃO | RESPONSABILIDADES | HORAS POR SEMANA |
|---|---|---|---|
| Luiz Felipe | Líder e gerente | Gerenciar tarefas | 3 h |
| Leandro Cobra | Documentação | Organizar e atualizar os documentos do projeto | 3 h |
| João Francisco | UX/UI e desenvolvimento | Projetar interfaces e protótipo de telas; Persona e Jornada; desenvolver e publicar a solução (desde 03/11) | 10 h |
| Luis Otavio | Testes | Testar o fluxo e registrar falhas | 3 h |
| Matheus Francisconi | Analista de requisitos | Levantar e organizar os requisitos; revisar as pull requests do código | 3 h |

**Atenção:** desde 03/11 o João é o único responsável pelo código (antes, o Matheus), e a pilha prevista (React, TypeScript, Node.js, PostgreSQL, Playwright, axe-core, IA) é grande. Com 10 h por semana (decisão de 05/11; o TAP pedia no mínimo 2 h), são 30 h de programação nos 3 ciclos de 16/11 a 04/12. Ver o risco R4. O restante do grupo (3 h por semana cada) assume o que não é código (testes, textos padrão das orientações por requisito, documentação e revisão das PRs).

## Gestão de riscos

A = alta · M = média · B = baixa

| RISCO | CHANCE | IMPACTO | MITIGAÇÃO | CONTINGÊNCIA |
|---|---|---|---|---|
| R1 · Dificuldade para aprender as bibliotecas e adequar as verificações ao eMAG (TAP) | M | A | Estudar a documentação, testar páginas simples, conferir critérios do eMAG e buscar apoio do orientador (TAP) | Reduzir os requisitos do eMAG cobertos no MVP e registrar o limite na própria ferramenta |
| R2 · Atrasos ou falta de comunicação nas tarefas (TAP) | M | A | Definir prazos; conversar com o integrante e reportar ao orientador (TAP) | Redistribuir a tarefa; se faltar tempo, cortar primeiro RF11 e RF16 (prioridade média), só com o aval do mentor (regra da Trilha A); nunca a publicação nem a LGPD (RNF05) |
| R3 · Repetir nos marcos de novembro o atraso de Persona e Jornada, entregues 5 dias após o marco | M | M | Prazos e responsáveis no Trello; checkpoint semanal às sextas | Avisar o mentor na semana do marco e entregar as seções prontas |
| R4 · Desenvolvimento concentrado em uma pessoa (o João, desde 03/11), que nunca trabalhou num projeto desse tamanho: com 10 h por semana, são 30 h de programação nos 3 ciclos | A | A | Cumprir as 10 h semanais; começar antes de 16/11 pelas partes de maior risco (análise e publicação); passar ao grupo o que não é código; pedir apoio ao mentor José Alves; revisão das PRs por outro integrante | Com o aval do mentor, cortar requisitos de prioridade média, exceto a LGPD (RNF05) |
| R5 · IA gerar orientação errada ou citar requisito inexistente (A2) | M | A | Lista fechada de requisitos (RF08); revisão pelo(a) auditor(a) (RF10); aviso de que não é certificação (RF09) | Usar texto padrão por requisito no lugar do texto livre da IA |
| R6 · Pedidos fora do TAP (telas com login do cliente, integrações) ampliarem o escopo | M | M | Registrar como versão futura e usar o controle de mudanças | Aprovar mudança de escopo só com o mentor, trocando por requisito de mesmo peso |
| R7 · Limites dos planos gratuitos (Render hiberna e tem pouca memória para o Chromium; Gemini limita as chamadas) derrubarem a análise ou estourarem os 60 s | M | A | Publicar cedo, na semana de 23/11, e testar páginas pesadas; mostrar o andamento (RNF06); guardar as orientações já geradas | Usar texto padrão por requisito no lugar da IA (como no R5) e avaliar com os mentores Fábio Rezente e Rodrigo Pereira um plano pago de baixo custo |

## Controle de mudanças e encerramento (adianto para a v1.0)

- **Mudanças de escopo:** propostas por qualquer integrante, avaliadas pelo líder e pelo analista de requisitos e aprovadas com o mentor; registradas no histórico de revisões. Pivô de público ou de tema depois de 09/10 exige justificativa em ata.
- **Encerramento:** solução em produção, 5 documentos finais, checklist de aceite cumprido e lições aprendidas registradas até 11/12.

---

## Notas para o João (apagar antes de colar no .docx)

1. **Propostas aprovadas em 05/11** (07, seção D): hospedagem, IA, nota, branches, horas, meta de 60 s, pasta única, definição de pronto, retrospectiva, controle de mudanças e riscos R3–R7. O repositório já existe (https://github.com/JfmBR/emagvalid, público desde 05/11; convidar o grupo). Desde 03/11 o João é o responsável pelo desenvolvimento, confirmado com o grupo e o mentor em 05/11 (07, seção D); o TAP ainda diz Matheus.
2. **Escopo:** a decisão de deixar de fora login, integrações e prioridade B foi aprovada em 05/11. O TAP não será alterado (decisão de 05/11); o Plano registra as diferenças.
3. **Responsável pelo Plano:** Luiz Felipe na v1.0 (TAP e cartão do Trello) e Matheus Francisconi na v1.1 (cartão do Trello).
4. **Mentor responsável pelo Grupo 3:** Rodrigo Pereira (confirmado pelo João em 29/10).
5. **Datas do cronograma** (sprints, checkpoint de 19/11, feriado de 20/11) vêm do cronograma do programa. Feriados locais não foram considerados.
6. **Arquitetura e tecnologias** ficam para a v1.1 (13/11), mas hospedagem (Render + Neon), IA (Google Gemini, plano gratuito) e cálculo da nota já foram decididos em 05/11.
