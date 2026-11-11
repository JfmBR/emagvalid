# Requisitos da solução — Plano de Projeto v1.0 (rascunho)

> **Superado em 11/11/2026 pelo Plano de Projeto v1.1** (`docs/contexto_projeto/Plano de Projeto v1.1.docx`; texto em `contexto_agente/fontes/projeto/Plano_de_Projeto.md`): público novo, RF07, RF10, RF11, RF17 e RNF04 alterados, RF20, RF21 e RNF10 novos. Este rascunho guarda a v1.0.

**Projeto:** AcessaWeb · Grupo 3 · Trilha A
**Prazo:** Plano de Projeto v1.0 em 06/11/2026
**Data deste rascunho:** 28/10/2026 (ajustado em 05/11/2026)
**Seção do modelo:** "Requisitos da solução" (RF e RNF, prioridade A = alta · M = média · B = baixa)

## Como ler

- **TAP** = já está no TAP v1.0; só detalhei.
- **Proposta** = veio das entrevistas (A1, A2, A3, auditores; Ctx = pessoas com deficiência) e **não está no TAP**. Precisa de decisão do grupo e do mentor antes de entrar no Plano.
- A prioridade é sugestão do agente. Regra de atraso do programa: cortar requisitos de prioridade baixa, nunca a publicação (04/12). Requisito de prioridade média só se corta com o aval do mentor (decisão de 05/11).
- Item "a definir" é decisão que o TAP deixou aberta (07 B).
- **Decisão de 28/10/2026 (João, aceitando a sugestão do agente):** propostas de prioridade A e M entram no MVP; as de prioridade B (RF18, RF19, RNF09), as telas atrás de login e as integrações ficam fora do MVP, como versões futuras. Aprovado em 05/11; o TAP não será alterado.
- **Decisão de 05/11/2026 (João):** o RF15 (comparação) passa a prioridade B e sai do MVP, como no TAP, no protótipo e na Jornada.

---

## Requisitos funcionais — o que a solução faz

| ID | Requisito funcional | Prior. | Origem |
|---|---|---|---|
| RF01 | O sistema deve permitir que o(a) auditor(a) crie conta e entre com login e senha | A | TAP |
| RF02 | O sistema deve permitir informar a URL de uma página pública e iniciar a avaliação | A | TAP |
| RF03 | O sistema deve analisar a página com verificações baseadas no eMAG 3.1 e identificar falhas | A | TAP |
| RF04 | O sistema deve listar cada falha com o requisito do eMAG violado, o local exato na página (trecho ou seletor) e a prioridade | A | TAP (falhas) + Proposta (A1, A2, A3: detalhe) |
| RF05 | O sistema deve calcular e exibir uma nota de 0 a 100 | A | TAP (cálculo a definir) |
| RF06 | O sistema deve mostrar a nota por critério ou requisito, com a conta que levou ao total | A | Proposta (A1, A2, A3) |
| RF07 | O sistema deve gerar, com IA, orientações de correção para cada falha, com exemplo | A | TAP + Proposta (A1: exemplo) |
| RF08 | A IA só deve citar requisitos de uma lista fechada do eMAG, cada um com identificação e link verificáveis | A | Proposta (A2: a IA pode inventar requisito) |
| RF09 | O sistema deve indicar na tela o que é verificação automática e o que exige revisão humana, e deixar claro que a nota e a IA não são certificação | A | TAP (escopo) + Proposta (A1) |
| RF10 | O sistema deve permitir ao(à) auditor(a) revisar e aprovar as orientações da IA antes de gerar o PDF | A | TAP (meta: revisão humana) |
| RF11 | O sistema deve permitir editar o texto das orientações antes de gerar o PDF | M | Proposta (A1: "sem perder o controle do conteúdo") |
| RF12 | O sistema deve gerar um PDF com nota, falhas e orientações de correção | A | TAP |
| RF13 | O PDF deve trazer resumo no início, prioridade e local exato de cada falha e exemplo de correção | A | Proposta (A1, A2, A3) |
| RF14 | O sistema deve guardar o histórico de avaliações do usuário e permitir abrir uma avaliação anterior | A | TAP |
| RF15 | O sistema deve comparar duas avaliações da mesma URL (o que foi corrigido e o que continua) | B · fora do MVP | Proposta (A1, A3) — fora do TAP, do protótipo e da Jornada (decisão de 05/11) |
| RF16 | O sistema deve mostrar ajuda curta na própria tela, com exemplos | M | Proposta (A1, A2, A3; Ctx) |
| RF17 | O sistema deve exibir mensagens de erro claras (URL inválida, página indisponível, análise que falhou) com o próximo passo | M | Proposta (Ctx e hipótese de design) |
| RF18 | O sistema deve exportar o resultado em formato tabular (CSV) ou texto para colar em issue | B · fora do MVP | Proposta (A1, A2, A3) — fora do TAP |
| RF19 | O sistema deve oferecer um canal de contato humano para dúvidas (por exemplo, e-mail ou formulário) | B · fora do MVP | Proposta (A2; Ctx) |

**Resumo:** 19 requisitos: 13 de prioridade alta, 3 média e 3 baixa (o RF15 passou de média para baixa em 05/11). Dos 19, 10 têm base no TAP (RF01 a RF05, RF07, RF09, RF10, RF12 e RF14; RF04 e RF09 acrescentam detalhes propostos); os outros 9 são propostas das entrevistas (RF06, RF08, RF11, RF13 e RF15 a RF19).

---

## Requisitos não funcionais — como a solução se comporta

| ID | Requisito não funcional | Categoria | Prior. | Origem |
|---|---|---|---|---|
| RNF01 | A interface do AcessaWeb deve seguir o eMAG 3.1 e o WCAG: texto alternativo em todas as imagens, navegação por teclado e uso com leitor de tela | Usabilidade e acessibilidade | A | TAP/regra do projeto + Ctx |
| RNF02 | Botões e áreas de clique grandes, com espaço entre elas | Usabilidade e acessibilidade | A | Proposta (Ctx) |
| RNF03 | Formulários curtos (login e cadastro), aviso do que será pedido antes de cada etapa e progresso salvo | Usabilidade | M | Proposta (Ctx) |
| RNF04 | O acesso deve ser protegido por login e senha; as senhas devem ficar armazenadas de forma protegida (hash) | Segurança | A | Boa prática; confirmar com o mentor de arquitetura |
| RNF05 | Tratar apenas os dados necessários do usuário e das avaliações, conforme a LGPD; informar o que é enviado ao fornecedor de IA (Google Gemini, plano gratuito: só o trecho da página pública com a falha, sem dado do usuário) | Privacidade | M | Proposta |
| RNF06 | A análise deve mostrar o andamento enquanto roda. Meta: uma página analisada, com orientações, em até 60 s (decisão de 05/11) | Desempenho | M | TAP (risco) |
| RNF07 | A nota e as orientações da IA devem sempre aparecer como apoio à avaliação humana, nunca como certificação | Conformidade | A | TAP |
| RNF08 | A solução deve estar publicada em produção e conectada ao banco de dados até 04/12/2026 (Render e Neon, planos gratuitos; decisão de 05/11) | Disponibilidade | A | TAP (Trilha A) |
| RNF09 | A solução deve funcionar nos navegadores atuais em computador; o uso em celular é a decidir (aplicativo móvel está fora do escopo) | Compatibilidade | B · fora do MVP | Proposta |

---

## Pedidos dos auditores que sugiro deixar **fora do MVP** (versões futuras)

| Pedido | Quem pediu | Por que fora do MVP |
|---|---|---|
| Avaliar telas atrás de login | A2: "sem isso, ela não serve para o meu caso" | O TAP prevê só página pública por URL. Exigir login do cliente traz risco de segurança e de tempo. |
| Integração com Jira, GitHub, CI e API | A2, A3 | Não está no TAP; a construção começa em 16/11. |
| Varredura de várias páginas | — (já fora do TAP) | Fora do escopo do TAP. |

---

## Decisões que preciso do grupo e do mentor

1. **Propostas** (itens "Proposta"): A e M entram e B fica fora do MVP; aprovado em 05/11. O TAP não será alterado (decisão de 05/11).
2. **Telas com login** (A2): fora do MVP, registrado no Plano como limite conhecido da ferramenta. Confirmar com o mentor.
3. **Cálculo da nota** (TAP: a definir). O RF06 pressupõe nota composta por critério. **Decidido em 05/11 (segunda rodada):** nota = 100 × pesos aprovados ÷ pesos aplicáveis, com peso alta 3, média 2, baixa 1; ver `Cobertura_eMAG_axe-core.md`.
4. **Fornecedor de IA:** Google Gemini, plano gratuito (decisão de 05/11). Afeta RF07, RF08 e RNF05.
5. **Hospedagem:** Render (plano gratuito) e PostgreSQL no Neon (plano gratuito) (decisão de 05/11). Afeta RNF08.
6. **Regra de corte** (07 C.11): o programa fala em cortar prioridade "baixa" na Trilha A e "baixa e média" na regra geral. **Decidido em 05/11:** a baixa já está fora do MVP; requisito de prioridade média só se corta com o aval do mentor, nunca a publicação nem a LGPD (RNF05).
7. **Cobertura do eMAG pelas verificações automáticas** (axe-core e Playwright): levantado em 05/11 em `Cobertura_eMAG_axe-core.md`: 14 das 45 recomendações com cobertura total, 15 parcial e 16 só por revisão humana.

---

## Falta para fechar o Plano v1.0 (06/11)

Este rascunho cobre só os requisitos. As demais seções do Plano v1.0 estão em `Plano_de_Projeto_v1.0_rascunho.md` e no protótipo .docx de 01/11.
