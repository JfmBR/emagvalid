# AcessaWeb

Resumo do produto para quem vai construir. A fonte completa é `projeto/contexto_agente/01-projeto-emagvalid.md` (TAP v1.0) e `projeto/docs/rascunhos/Requisitos_Plano_de_Projeto_v1.0.md` (requisitos com prioridade); em divergência, valem eles.

## Problema e objetivo

Documentar à mão as falhas de acessibilidade de uma página pelo eMAG 3.1 leva horas e dificulta a auditoria. O AcessaWeb avalia uma página pública, mostra as falhas com o requisito do eMAG violado e uma nota de 0 a 100, gera orientações de correção com IA e um PDF, e guarda o histórico. Ele **complementa** a avaliação humana; não é certificação.

## Público e papéis

- Desde 11/11/2026 (decisão do João): o cliente que tem ou vai criar um site, não entende de acessibilidade e quer melhorar o site e alcançar mais pessoas. Antes, o público eram auditores de acessibilidade (persona Helena, `projeto/contexto_agente/05-persona-e-pesquisa.md`); TAP, Persona e Jornada v1.0 ainda falam em auditor (ver "Suposições e pendências").
- Um único papel no MVP: o cliente com conta própria. Não há administrador nem equipes.

## Fluxos da primeira versão

Caminho a seguir: o protótipo beta, `projeto/docs/prototipo/beta/index.html` (11/11/2026). Ele orienta o fluxo e os textos, não o visual (o visual é o de `design-system/`), e não define escopo: o que ele mostra fora do MVP fica fora. O que o MVP tem e o beta não mostra continua (login, histórico, revisão das orientações da IA, nota com a conta). Protótipo anterior, só como histórico: `projeto/docs/prototipo/prototipo_emagvalid.html` e `projeto/docs/rascunhos/Prototipo_30-10_telas_e_teste.md`.

1. Criar conta ou entrar com e-mail e senha.
2. Informar a URL de uma página pública e iniciar a avaliação; acompanhar o andamento.
3. Ver o resultado: nota, nota por requisito com a conta, falhas com requisito, local exato e prioridade, e o que exige revisão humana.
4. Revisar, editar e aprovar as orientações da IA.
5. Gerar o PDF.
6. Abrir uma avaliação anterior no histórico.
7. Em erro (URL inválida, página indisponível, análise que falhou), ver mensagem clara com o próximo passo.

## MVP

Requisitos de prioridade alta (A) e média (M) do Plano de Projeto v1: RF01–RF14, RF16, RF17 e RNF01–RNF08. A média só se corta com o aval do mentor; nunca se corta a publicação nem a LGPD (RNF05).

## Fora do escopo

O que o protótipo beta mostra além do MVP: nota por perfil de deficiência, critérios WCAG, auditoria aprofundada, indicação de equipes parceiras, validação com pessoas com deficiência e selo próprio (decisão de 11/11/2026). Também: varredura de várias páginas, aplicativo móvel, certificação de conformidade integral, comparação entre avaliações (RF15), exportação CSV (RF18), canal de contato humano (RF19), uso em celular (RNF09), páginas atrás de login e integrações com Jira, GitHub ou CI.

## Requisitos

- **Acessibilidade da própria interface (RNF01, RNF02):** eMAG 3.1/WCAG, teclado, leitor de tela (NVDA e Orca), foco visível, rótulos, contraste e alvos de 44 px ou mais. Detalhes: `docs/design.md`.
- **Segurança e dados (RNF04, RNF05):** login com senha guardada em hash; só os dados necessários (LGPD); à IA vai só o trecho público da página com a falha.
- **IA (RF07, RF08):** Google Gemini, plano gratuito; só cita requisitos de uma lista fechada do eMAG (`projeto/docs/rascunhos/Cobertura_eMAG_axe-core.md`).
- **Nota (RF05, RF06):** 100 × pesos aprovados ÷ pesos aplicáveis; peso alta 3, média 2, baixa 1, nas 29 recomendações do eMAG que o axe-core cobre no todo ou em parte.
- **Desempenho (RNF06):** andamento visível; meta de até 60 s por página com orientações.

## Restrições e decisões técnicas

- Stack existente, mantida: React + Vite, Express, Prisma, PostgreSQL, Playwright + axe-core (`docs/architecture.md`). O toolkit sugere Next.js e Drizzle para projetos novos; não se aplica aqui.
- Hospedagem: Render (telas e API) e Neon (PostgreSQL), planos gratuitos. Custo total: R$ 0.
- Prazos: construção a partir de 16/11/2026; MVP publicado até 04/12/2026 (RNF08); congelamento em 11/12/2026.

## Suposições e pendências

- Responsável pelo Plano de Projeto v1.1 (13/11), antes Matheus Francisconi: não consta nos arquivos (`projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D, 10/11/2026).
- Mapeamento eMAG ↔ axe-core e pesos: a conferir com o mentor José Alves (`07`, seção E).
- Público mudou de auditor para cliente leigo em 11/11/2026: TAP v1.0, Persona v1.0, Jornada v1.0 e os requisitos ainda descrevem o auditor; alinhar no Plano v1.1 (13/11) e com o mentor. Em aberto: como o cliente leigo revisa as orientações da IA (RF08) e o que exige revisão humana (`07`, seção D, 11/11/2026).
- Demais pendências do programa e do mentor: `07`, seções A e E.

## Critérios de aceite

- Fluxo completo aprovado em teste: login → URL → avaliação → nota e falhas → orientações da IA revisadas por humano → PDF → histórico (meta do TAP).
- Telas usáveis só com teclado e com leitor de tela, sem violações sérias ou críticas do axe (checagem automática em `docs/quality.md`).
- Solução publicada e ligada ao banco até 04/12/2026.

## Próxima entrega

Sprint 1 (a partir de 16/11): telas principais e estrutura, conforme `docs/passo-a-passo-mvp.md`.

## Manutenção

Atualize este arquivo quando objetivo, escopo, restrições ou aceite mudarem, e registre a decisão em `projeto/contexto_agente/07-pendencias-e-decisoes.md` (seção D). Decisões técnicas detalhadas vão para `docs/architecture.md`; evidências do setup, para `docs/setup.md`.
