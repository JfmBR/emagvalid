# 04 · Artefatos e entregas

Fonte: Artefatos e Cronograma §1–§2 (`fontes/projeto/Artefatos_e_Cronograma.md`) e os 4 modelos de `docs/Modelos` (`fontes/modelos/`). **O Grupo 3 está na Trilha A.** A Trilha B aparece aqui para o agente saber o que *não* se aplica ao grupo.

## Princípios
- Cada grupo de 5 pessoas idealiza o próprio projeto. O programa deu 5 temas motivadores (Saúde, Segurança, Educação, Mobilidade e Acessibilidade); a ideia e o problema são escolhidos pelos alunos.
- Duas trilhas: **A** – Produto Funcional (banco de dados, código-fonte e publicação) ou **B** – Protótipo Navegável (alta fidelidade, com regras de negócio).
- **5 documentos vivos + 1 kit do pitch.** Cada documento nasce com as seções nomeadas e é preenchido semana a semana; o mentor revisa sempre o mesmo arquivo. Cada seção deve ser curta (meia página a uma página).
- O protótipo navegável e o MVP publicado são o próprio produto, não documentos.
- Cada documento parte de um modelo "com as seções e os prazos já indicados" (na prática, os modelos de `docs/Modelos` não trazem prazos; ver `07`).
- Entregas incrementais: a cada marco o grupo entrega só as seções previstas; o documento cresce por versões até a final, em 11/12.
- Onde a Trilha B diz "Idem", vale o que está descrito para a Trilha A.

## Os 6 artefatos
| # | Artefato | Tipo | Trilha A (Grupo 3) | Trilha B |
|---|---|---|---|---|
| 1 | **TAP – Termo de Abertura** | Oficial | 1 a 2 páginas, no modelo do TAP: identificação, contexto e justificativa, objetivos, solução proposta, escopo (dentro e fora do MVP), premissas e restrições, entregas e critérios de sucesso, equipe e partes interessadas, recursos, riscos iniciais, marcos macro e aprovação. Registra também a trilha (A ou B) e o acordo de equipe (canais, horários, como decidir, o que fazer quando alguém some). **Prazo: v1.0 em 09/10** | Idem |
| 2 | **Plano de Projeto** (vivo) | Oficial | Seções: visão geral; objetivos e escopo; requisitos funcionais e não funcionais, com prioridade alta, média ou baixa; entregas e estrutura; metodologia e ferramentas de gestão (ex.: Kanban); arquitetura e tecnologias; marcos de entrega; equipe; comunicação; recursos; riscos; qualidade e testes; controle de mudanças, encerramento e lições aprendidas. **Prazos: v1.0 06/11 · v1.1 13/11 (+ arquitetura e tecnologias) · v1.2 04/12 · final 11/12** | Idem |
| 3 | **Persona** (vivo) | Oficial | Seções: ficha e perfil; quem é; objetivos e dores; motivações e barreiras; habilidades e acesso; canais e linguagem; implicações para o projeto; falas e evidências (**entrevistas com 3 a 5 pessoas do público-alvo**, com método, participantes e período). **Prazos: v0.1 falas e evidências 16/10 · v1.0 23/10 · final 11/12** | Idem |
| 4 | **Jornada do Usuário** (vivo) | Oficial | Seções: ficha da jornada (parte da Persona); premissas e contexto; mapa da jornada em 5 etapas; desenho do contexto; momentos da verdade; fontes e validação. **Prazos: v1.0 23/10 · final 11/12** | Idem |
| 5 | **Documento Técnico e de Dados** (vivo) | Oficial | Seções: README com tecnologias, como rodar e quem fez cada parte (+ repositório do código-fonte); checklist de aceite do MVP; link da solução publicada. **Prazos: v0.2 04/12 (a v0.1 é o DER, só Trilha B) · final 11/12** | Seções: Especificação Funcional (estados, variáveis, cálculos e validações); DER e dicionário de dados; checklist de aceite (regras e validações no protótipo); link compartilhável do protótipo. Prazos: v0.1 DER e dicionário 13/11 · v0.2 checklist e link 04/12 · final 11/12 |
| 6 | **Kit do Pitch** | Recomendado | Roteiro de 10 minutos (problema e dados das entrevistas, pessoa, solução, demo, como funciona, o que ficou de fora, próximos passos, **uma fala por integrante**), slides e plano B da demo em vídeo de 1 minuto. **Prazos: v1.0 04/12 (prévia) · final 11/12 · ensaio em janeiro** | Idem |

Cobertura do programa: os 5 documentos vivos cobrem tudo o que o programa exige na Entrega Final, no mesmo documento para reduzir a quantidade de arquivos. Design = Persona + Jornada (documentos separados); Gestão = TAP + Plano de Projeto (reúne requisitos e arquitetura); Técnico e de Dados = código-fonte com instruções (A) ou Especificação Funcional, DER e dicionário (B).

## Entregas finais por trilha (não são documentos)
| Item | Trilha A (Grupo 3) | Trilha B |
|---|---|---|
| Produto final | Solução com banco de dados e código-fonte, publicada | Protótipo de alta fidelidade com estados, variáveis, cálculos e validações reais (não só desenhados) |
| Publicação (04/12) | Ambiente acessível, em produção, conectada ao banco | Link compartilhável do protótipo |
| Checklist de aceite | Cada requisito de prioridade alta funciona no ambiente publicado | Cada regra e validação se comporta como especificado, no protótipo |
| Demo no pitch | Uso da solução em produção | Navegação do protótipo com as regras em ação |
| Se faltar tempo | **Cortar requisitos de prioridade baixa, nunca a publicação** | Cortar telas, nunca as regras de negócio |

## Além dos 6 documentos
- **Solução publicada (MVP) ou protótipo navegável:** é o produto e a própria entrega do Projeto Integrador, apresentada no pitch, **não um documento**. Trilha A em produção; Trilha B com link compartilhável do protótipo. Prazo 04/12.
- **Pesquisa, protótipo e teste de usabilidade:** parte é trabalhada no módulo Projeto Integrador do programa; por isso **não há entregável separado** para o teste de usabilidade nem para o link do protótipo.
- **Autorização de gravação:** termo para gravar as mentorias. Menor de 18 anos precisa de autorização do responsável (LGPD/ECA). Pronta antes da primeira reunião gravada (possível já na semana de 28/09).
- **Ata de mentoria:** 1 por reunião, registrada pelo mentor (modelo em `06`).
- **Pasta única do projeto:** com índice de links para todos os artefatos, criada até 09/10 e mantida pelo grupo.

## Entregas incrementais: versão esperada em cada marco
Legenda: v0.x = parcial, só com as seções previstas · v1.0 = primeira versão completa · v1.1 = atualizações (v1.2 no Plano) · Final = versão fechada em 11/12.
- **Como se entrega:** o grupo atualiza o documento na pasta única até a sexta-feira do marco. Não envia nada à parte.
- **Como se confere:** o mentor revisa na reunião da semana e registra na ata, em "Situação dos documentos", cada seção como **entregue, parcial ou atrasada**. O que não foi entregue vira pendência para o marco seguinte.

| Marco | TAP | Plano de Projeto | Persona | Jornada | Documento Técnico | Kit do Pitch |
|---|---|---|---|---|---|---|
| 09/10 | v1.0: completo, com acordo de equipe | — | — | — | — | — |
| 16/10 | — | — | v0.1: falas e evidências (entrevistas) | — | — | — |
| 23/10 | — | — | v1.0: completa, a partir das entrevistas | v1.0: completa | — | — |
| 06/11 | Ajuste, se o escopo mudou | v1.0: escopo, requisitos priorizados, entregas, equipe, metodologia e riscos | — | — | — | — |
| 13/11 | — | v1.1: + arquitetura e tecnologias | — | — | v0.1: DER e dicionário (só Trilha B) | — |
| 04/12 | — | v1.2: atualizado, com qualidade e testes | — | — | v0.2: + checklist de aceite e link da solução publicada | v1.0: roteiro, slides e plano B |
| 09 ou 10/12 | Prévia do Pitch: sem entrega nova. Apresenta Kit v1.0 e a solução publicada e recebe feedback da banca | | | | | |
| 11/12 | Final: revisão | Final: + lições aprendidas | Final: revisão | Final: revisão | Final: README (ou Especificação Funcional na B) e solução em produção | Final: ajustes da prévia |
| Jan./2027 | Pitch oficial (dia a agendar): nenhum documento novo; só ensaio final e checagem técnica | | | | | |

## DER e dicionário de dados — só Trilha B (13/11)
O Grupo 3 **não entrega** (na Trilha A, o banco real cumpre esse papel). Registro para referência:
- DER: entidades, atributos, chaves primárias e estrangeiras, relações e cardinalidades, em diagrama legível, incluindo variáveis e estados das regras de negócio.
- Dicionário: tabela com nome, tipo, formato ou tamanho, obrigatório, regra de validação e exemplo, por campo.
- Devem ser coerentes com os requisitos do Plano de Projeto e com o protótipo (todo dado das telas existe no DER). Mentor revisa na semana de 09/11 e o grupo corrige antes de começar a construção em escala.

## Estrutura dos modelos (`docs/Modelos`; literal em `fontes/modelos/`)
Os modelos têm marca "Conecta Jovem" no rodapé. Texto entre `[colchetes]` deve ser substituído.

- **TAP** (modelo `Termo_de_Abertura_de_Projeto_Conecta_Jovem.docx`; o TAP preenchido segue as mesmas seções, em `01`). Instrução do modelo: "Preencha cada seção com a sua equipe, substituindo os textos entre colchetes. Seja objetivo: este termo é a base do planejamento do projeto integrador." O que cada campo pede:
  - Identificação: projeto, solução, grupo, líder, início, término previsto (data do termo e grupo no cabeçalho).
  - Contexto e justificativa: problema ou oportunidade ("qual problema real a solução vai resolver, ou qual oportunidade ela aproveita?") · quem é afetado ("descreva o público e o contexto") · por que agora · relação com o curso (conteúdos e habilidades aplicados).
  - Objetivos: geral (uma frase clara e **mensurável**) · 3 específicos.
  - Solução proposta: tipo (caixas de marcar: ☐ Sistema web, ☐ Aplicativo móvel, ☐ Sistema web e aplicativo) · público-alvo · tecnologias (linguagens, frameworks, banco e ferramentas) · funcionalidades principais (4 espaços no modelo) · diferenciais (o que torna útil e diferente; como melhora a vida do usuário).
  - Escopo: dentro (o que será entregue, funcionalidades do MVP, documentação e apresentação final) · fora (o que não será feito agora, ideias para versões futuras).
  - Premissas (o que assumimos como verdadeiro; do que dependemos para começar) e restrições (prazo, tempo, equipamentos; limites técnicos ou de conhecimento).
  - Entregas e critérios de sucesso: três linhas fixas (Protótipo de telas, Versão funcional/MVP, Apresentação final) com descrição e prazo · benefícios esperados (para os usuários; para a comunidade) · indicadores (como saberemos que deu certo; meta mensurável).
  - Equipe (nome, função, responsabilidades; funções de exemplo: design, front-end, back-end, dados, testes, documentação; a primeira linha é o líder) · partes interessadas (usuários; orientador(a) externo; facilitador Conecta Jovem "um dos facilitadores"; outra parte) · recursos (recurso, uso, custo em R$) · riscos (risco, chance e impacto "alta, média ou baixa", resposta) · marcos macro (seis marcos fixos: início, levantamento de requisitos, protótipo de telas iniciais, desenvolvimento, testes e ajustes, apresentação final; entrega, data, responsável) · aprovação (líder, orientador(a), facilitador) · histórico de revisões.
  - O modelo **não tem campo** para a trilha (A ou B) nem para o acordo de equipe, que o documento de Artefatos exige no TAP. O TAP do Grupo 3 pôs a trilha na linha de abertura, logo após o cabeçalho, e o acordo como parágrafo depois de "Recursos necessários".
- **Plano de Projeto** (instrução do modelo: "Este plano descreve, de forma oficial, como a equipe vai executar o projeto integrador. Parta do Termo de Abertura de Projeto, detalhe cada seção e substitua os textos entre colchetes."). Detalhes além da lista de seções abaixo: escopo dentro = o que será entregue em detalhe + funcionalidades da primeira versão (MVP – o que será apresentado à banca) + documentação e entrega final (pós-MVP); escopo fora = o que não será feito no projeto + o que não será feito agora (MVP). Entregas por fase: planejamento = documentos; design e protótipo = imagens ou navegação básica; desenvolvimento = código-fonte; testes e ajustes = plano e resultado de teste; entrega final = versão final funcionando. Exemplos de RNF do modelo: responder em até 3 segundos (desempenho), acesso por login e senha (segurança), funcionar em celular e computador (usabilidade). Plano de comunicação, linhas de exemplo: reunião de acompanhamento (semanal), relatório de status (quinzenal), apresentação de resultados (ao final); colunas comunicação, público, frequência, canal, responsável. Tipos de teste: funcional, usabilidade com usuários, desempenho ou segurança. Dados e segurança: dados pessoais tratados e como são protegidos; perfis de acesso e permissões. Exemplos do modelo: abordagem "preditivo, adaptativo ou outra, e por que foi escolhida" · ferramentas de gestão "Trello, Jira, GitHub Projects ou outra" · controle de versão "repositório de código e regras de branches e commits" · hospedagem "onde a solução será publicada e como será acessada" · comunicação em canal "presencial ou online" / "e-mail ou plataforma" · marcos: tabela com 8 linhas (atividade, responsável, início, fim). Seções: visão geral (projeto, solução, equipe/turma, líder, início, término, resumo de 5–6 linhas, referência ao TAP aprovado) · objetivos e escopo · requisitos (RF01…, prioridade A/M/B; RNF01…, categoria: desempenho, segurança, usabilidade) · entregas por fase (planejamento, design e protótipo, desenvolvimento, testes e ajustes, entrega final: entrega, responsável, prazo) · metodologia (abordagem, ciclos e reuniões, ferramentas, controle de versão, definição de pronto) · arquitetura e tecnologias (tipo, front-end, back-end, banco, hospedagem, telas e fluxos principais, dados e segurança) · marcos (atividade, responsável, início, fim) · equipe (nome, função, responsabilidades, horas por semana) · plano de comunicação · recursos e orçamento (quantidade, custo, total) · gestão de riscos (risco, chance A/M/B, impacto A/M/B, mitigação, contingência) · qualidade e testes (critérios de aceitação, tipos de teste, responsável, registro de erros) · controle de mudanças e encerramento (mudanças de escopo, critérios de encerramento, entrega final, lições aprendidas) · aprovação e histórico de revisões.
- **Persona:** ver `05`.
- **Jornada do Usuário:**
  - *Cabeçalho:* nome da persona, persona e data (dd/mm/aaaa).
  - *Ficha da jornada:* persona (ver Documento de Persona) · cenário · objetivo da persona · início da jornada (gatilho) · fim da jornada (resultado esperado) · período e fontes.
  - *Premissas e contexto:* premissas, limites do que foi analisado, quem participou · momento do projeto, fatores externos, dados e pesquisas de apoio.
  - *Mapa da jornada* em **5 etapas fixas:** 1 Descoberta · 2 Primeiro acesso · 3 Uso principal · 4 Suporte · 5 Retorno. Linhas por etapa: o que faz na solução · o que pensa · como se sente (escala de 5 círculos + emoção predominante) · telas e canais · dores e fricções · oportunidades. Exemplos do modelo por etapa: 1 busca a solução, decide testar / "serve para mim?", expectativa inicial / canal de descoberta, tela inicial / não entende o valor, pouca confiança / mensagem mais clara, demonstração rápida · 2 cria conta ou entra, explora as telas / "é fácil começar?", dúvida nos dados / tela de cadastro, boas-vindas / cadastro demorado, instruções confusas / onboarding guiado, cadastro simplificado · 3 executa a tarefa, usa funções de apoio / "consigo concluir?", espero um resultado / tela principal, web ou app / fluxo difícil, lentidão ou falhas / atalhos e clareza, nova funcionalidade · 4 busca ajuda, reporta o problema / "por que deu erro?", "vale continuar?" / tela de ajuda, canal de suporte / resposta demorada, erro sem explicação / ajuda dentro da tela, erros mais claros · 5 volta a usar, indica a alguém / "me ajuda mesmo?", "vou recomendar?" / aviso ou e-mail, avaliação / perde o interesse, falta de novidades / lembretes úteis, convite a amigos.
  - *Desenho do Contexto 1 e 2:* duas páginas para imagem, esquema, storyboard ou foto do desenho da jornada.
  - *Momentos da verdade:* 3 momentos decisivos em que a persona pode mais se aproximar ou afastar da solução, com o motivo.
  - *Fontes e validação:* evidências usadas (entrevistas, pesquisas, observações) · como validar (quem confirma a jornada; resultado e evidências).
- **Documento Técnico e Kit do Pitch:** **não há modelo** em `docs/Modelos`; a estrutura vem só da tabela dos 6 artefatos acima.
