# Persona

**Helena** *(nome sugerido; o grupo pode trocar)*

*Analista de acessibilidade em consultoria de software que audita páginas pelo eMAG e pelo WCAG e quer gastar menos horas no relatório sem perder o controle da conclusão.*

| | |
|---|---|
| **PROJETO / Grupo** | AcessaWeb · Grupo 3 |
| **DATA** | 28/10/2026 |
| **VERSÃO** | v1.0 (rascunho para colar no .docx) |

Legenda: **A1** (analista, perfil principal) · **A2** (QA, 34) · **A3** (dev front-end, 26), entrevistas com auditores. Localização, escolaridade, família, tempo de estudo, dispositivo, conexão e objetivo de longo prazo são **ficcionais**, criados pelo grupo para compor a persona (as entrevistas não perguntaram). Helena é uma persona fictícia que reúne as 3 entrevistas com auditores: perfil e rotina vêm de A1; dores, canais e ferramentas também de A2 e A3. Ctx1 a Ctx4 = entrevistas com pessoas com deficiência (contexto); Ctx3 e Ctx4 desse grupo não são A2 e A3.

---

## Perfil

| Campo | Conteúdo |
|---|---|
| Retrato | `docs/imagem/persona_helena.jpg` (banco de imagens com licença gratuita), recortada em rosto e ombros; legenda "Helena · Imagem ilustrativa" |
| Idade | 29 anos (os 3 entrevistados têm de 26 a 34) |
| Localização | Asa Norte, Brasília, DF (ficcional) |
| Escolaridade | Graduação em Sistemas de Informação (concluída); especialização em UX (concluída) (ficcional) |
| Ocupação atual | Analista de acessibilidade em consultoria de software; atende órgãos públicos e clientes privados; equipe de 4 pessoas; 5 anos na área (A1) |
| Composição familiar | Mora com o companheiro; os dois dividem as despesas da casa (ficcional) |
| Online por dia | 8 a 9 h, quase todas no computador (A1, A2, A3) |
| Trabalha por dia | 8 a 9 h (A1, A2, A3) |
| Livres para estudar por semana | 3 h (ficcional) |

> "Só pediria que a ferramenta deixasse claro o que é automático e o que precisa de revisão humana." (A1)

## Quem é

Helena trabalha numa consultoria de software, atende órgãos públicos e alguns clientes privados e usa o eMAG nos projetos públicos e o WCAG 2.1 nos privados, cruzando os dois. Define as páginas do escopo, roda uma ferramenta automática, revisa à mão com teclado e leitor de tela e escreve o relatório: é aí que vão as horas. **Quer poupar tempo no relatório sem perder o controle do conteúdo e da conclusão de conformidade.** *(Fonte: A1.)*

## Objetivos e dores

| OBJETIVOS E SONHOS | DORES E DESAFIOS |
|---|---|
| **Curto prazo:** poupar tempo no relatório (A1). | **Principal obstáculo hoje:** a revisão manual e o relatório; "descrever cada falha com o requisito certo leva horas" (A1). |
| **Longo prazo:** coordenar a área de acessibilidade da consultoria e oferecer auditorias recorrentes aos clientes, em vez de projetos avulsos (ficcional). | **O que desmotiva:** o retrabalho de refazer tudo quando o cliente corrige parte e pede nova auditoria; o time de desenvolvimento não entender por que algo é falha (A1). |
| **Sucesso:** entregar um relatório com resumo no início, prioridade, local exato na página e exemplo de correção, exportado no formato que o cliente já recebe (A1). | **O que falta para o próximo passo:** uma ferramenta que mostre como chegou à nota, requisito por requisito (A1, A2, A3). |

## Motivações e barreiras

| O QUE MOTIVA | O QUE AFASTA |
|---|---|
| **Valor:** poupar tempo sem perder o controle (A1); usar uma ferramenta que funcione dentro do fluxo que já tem (Jira, CI) (A2, A3). | **Acesso:** ferramenta pesada (ASES, A1); que não testa telas com login (A2); que cobre poucos critérios (Lighthouse, A1). |
| **Quem influencia:** o cliente, que pede nova auditoria (A1), e o time de desenvolvimento, que contesta ("o validador passou", A2). | **Confiança:** nota única sem explicação (A1, A2, A3); IA que cita requisito do eMAG que não existe (A2); correção sem explicação (A1); correção com ARIA que piora a página (A3). |
| **O que faz persistir:** poupar tempo no relatório e exportar no formato do cliente (A1); comparar com a versão anterior (A3). | **Experiência anterior negativa:** Lighthouse como meta ou em auditoria formal, que dá "falsa segurança" (A1, A3); ASES sem suporte a telas com login (A2). |

## Habilidades e acesso

| DIMENSÃO | NÍVEL (1 A 5) | OBSERVAÇÃO |
|---|---|---|
| Familiaridade com tecnologia | ● ● ● ● ● | Estimativa do grupo: usa ASES, WAVE, axe, Lighthouse, NVDA, teclado; A3 usa CI e GitHub. |
| Autonomia para aprender | ● ● ● ● ○ | Estimativa do grupo: os 3 migraram para a acessibilidade por conta de projeto ou edital (A1, A2, A3). Evitam tutorial longo. |
| Acesso a dispositivo próprio | ● ● ● ● ● | Ficcional: notebook próprio, além do da empresa; celular para e-mail e testes rápidos. |
| Qualidade da conexão à internet | ● ● ● ● ○ | Ficcional: fibra em casa e no escritório; instável em alguns clientes. |
| Tempo disponível para estudar | ● ● ○ ○ ○ | Ficcional: cerca de 3 h por semana, à noite. Dos entrevistados, A2 dedica cerca de 30% do tempo à acessibilidade. |

*(Familiaridade e autonomia: estimativa do grupo a partir das respostas. Dispositivo, conexão e tempo para estudar: dados ficcionais da persona.)*

## Canais e linguagem

| CANAIS E FORMATOS | TOM DE VOZ QUE CONECTA |
|---|---|
| **Ferramentas:** ASES, WAVE, axe, Lighthouse, pa11y, Jira, GitHub (A1, A2, A3). | **Como gosta de ser orientada(o):** texto curto e ajuda na própria tela, no ponto em que está; exemplos; chat com uma pessoa quando trava (A1, A2, A3). |
| **Formato de entrega:** PDF por e-mail e planilha (A1); bug no Jira (A2); pull request e issue (A3). | **Palavras e referências:** requisito, recomendação do eMAG, critério, conformidade, prioridade. |
| **Momento:** manhã; revisão manual terça e quarta, relatórios na sexta (A1); fim da sprint, à tarde (A2); ao longo da semana (A3). | **O que evitar:** tutorial em vídeo longo (A1, A2; A3 aceita até 3 min); nota apresentada como certificação; sugestão sem explicação. |

## Implicações para o projeto

**Como o AcessaWeb se conecta com a Helena**

1. **Decisão de conteúdo:**
   - mostrar a nota **por critério** e como foi calculada (A1, A2, A3);
   - citar cada requisito do eMAG com link ou identificação verificável, porque a IA pode inventar um (A2);
   - separar na tela o que é automático do que precisa de revisão humana (A1);
   - em cada falha, trazer local exato, requisito, prioridade e exemplo de correção (A1, A2, A3).
2. **Ajuste de apoio:** a conclusão de conformidade e a prioridade ficam com o(a) auditor(a); a IA sugere, a pessoa revisa (A1, A2, A3). Ajuda curta na tela, com exemplos.
3. **Oportunidades que pedem decisão do grupo** (fora do TAP v1.0 ou ainda não previstas; levar ao Plano de Projeto de 06/11 e, se o escopo mudar, ao ajuste do TAP):
   - exportar também como planilha ou texto pronto para colar em issue (A1, A2, A3);
   - avaliar telas atrás de login (A2: "sem isso, ela não serve para o meu caso");
   - comparar com a avaliação anterior (A1, A3) — o histórico já está no TAP;
   - integração com Jira, GitHub, CI e API (A2, A3).
4. **Acessibilidade da própria interface** (entrevistas com pessoas com deficiência, contexto): descrever todas as imagens, botões e áreas de clique grandes, formulário curto com progresso salvo, avisar o que será pedido; contato humano fica fora do TAP v1.0.

## Falas e evidências

| FALA OU EVIDÊNCIA | FONTE |
|---|---|
| "Já descrever cada falha com o requisito certo leva horas." | A1, 29, analista de acessibilidade · entrevista, 22 min · 19/10/2026 |
| "Desconfiaria da nota sozinha, porque uma página pode ter nota alta e ainda ser inacessível para quem usa leitor de tela." | A1 · entrevista · 19/10/2026 |
| "Se eu tiver que sair do Jira, esqueço a ferramenta." | A2, 34, QA · entrevista, 19 min · 20/10/2026 |
| "Que a ferramenta consiga testar telas com login. Sem isso, ela não serve para o meu caso." | A2 · entrevista · 20/10/2026 |
| "O time começou a perseguir 100 pontos sem testar com leitor de tela. Parei de usar a nota como critério de aceite." | A3, 26, dev front-end · entrevista, 20 min · 21/10/2026 |
| "Quando só aparece 'imagem' ou 'botão', sem nome, eu não sei o que é. Não consigo seguir." | Ctx1, 23, cegueira, usa leitor de tela · entrevista com pessoa com deficiência (contexto) · 22/10/2026 |

| MÉTODO | PARTICIPANTES | PERÍODO |
|---|---|---|
| Entrevistas com roteiro de 18 perguntas (blocos A a E) e fechamento; pesquisa documental (Cetic.br/NIC.br, 2020) como apoio | 3 profissionais de acessibilidade: 1 perfil principal (analista) e 2 aceitos (QA e dev front-end), de 26 a 34 anos · mais 4 pessoas com deficiência (contexto) | Auditores: 19/10/2026 a 21/10/2026 · pessoas com deficiência: 22/10/2026 |

---

## Notas para o João (apagar antes de colar no .docx)

1. **Dois primeiros nomes aparecem nos dois arquivos de entrevistas, com pessoas diferentes** (QA de 34 anos e dev de 26; pessoas com deficiência de 21 e 25). Citei só Ctx1 nas pessoas com deficiência para não confundir. No documento final, use os códigos A1, A2 e A3. Resolvido em 28/10/2026 (feedback do mentor): A1 a A3 para auditores e Ctx1 a Ctx4 para pessoas com deficiência.
2. **Só há 1 entrevistado de perfil principal** (A1). Os 3 cumprem o mínimo do programa, mas a Helena se apoia sobretudo na A1. Vale entrevistar mais 1 ou 2 analistas de acessibilidade.
3. **Datas das entrevistas com auditores:** você definiu 19/10, 20/10 e 21/10. Assumi A1 em 19/10, A2 em 20/10 e A3 em 21/10; confira a ordem. Entrevistas com pessoas com deficiência: 22/10/2026 (informado pelo João em 28/10).
4. **Não perguntado:** localização, escolaridade, família, tempo para estudar, dispositivo próprio, conexão e objetivo de longo prazo. Por decisão do João (28/10), foram preenchidos com dados ficcionais da persona e marcados como tal.
5. **Níveis de habilidade:** os dois níveis preenchidos são estimativa nossa, não resposta dos entrevistados.
6. **Nome Helena e idade 29:** sugestão minha; a idade é a da A1. Troque à vontade.
7. **Conflitos com o TAP** (item 3 das Implicações): login, integrações e exportação além de PDF não estão no escopo do TAP v1.0 (página pública por URL, PDF e histórico). Não decidi nada; é pauta do Plano de Projeto (06/11) e, se mudar o escopo, de um ajuste do TAP.
8. **O arquivo de entrevistas errou numa linha da síntese:** diz que "QA e dev precisam de teste em telas com login", mas só o QA (A2) disse isso. A3 pediu integração com CI e GitHub.
