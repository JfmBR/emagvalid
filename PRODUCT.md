# AcessaWeb

Resumo do produto para quem vai construir. A fonte oficial do escopo é o Plano de Projeto v1.1 (`projeto/docs/contexto_projeto/Plano de Projeto v1.1.docx`, texto literal em `projeto/contexto_agente/fontes/projeto/Plano_de_Projeto.md`); em divergência, vale ele. O TAP v1.0 (`projeto/contexto_agente/01-projeto-emagvalid.md`) ainda descreve o público antigo.

## Problema e objetivo

Pequenas e médias empresas têm site, mas não sabem se ele é acessível nem como corrigir. O AcessaWeb vende o serviço de analisar uma página pública pelo eMAG 3.1: mostra as falhas com o requisito violado e uma nota de 0 a 100, e a IA traduz cada falha numa explicação simples e numa sugestão de código (antes e depois) para quem quiser corrigir sozinho. A análise de amostra é gratuita; o relatório em PDF fica no plano pago. Ele **complementa** a avaliação humana; não é certificação.

## Público e papéis

- Desde 11/11/2026 (Plano v1.1, com acordo do mentor): pequenas e médias empresas e devs que terceirizam a validação de acessibilidade. Persona: dona de uma pequena empresa com site próprio, que não entende de acessibilidade e quer que o site alcance mais pessoas (fictícia; esse público ainda não foi entrevistado, risco R8). Antes, o público eram auditores (persona Helena, `projeto/contexto_agente/05-persona-e-pesquisa.md`); TAP, Persona e Jornada v1.0 ainda falam em auditor.
- Um único papel no MVP: o cliente com conta própria. Não há administrador nem equipes.

## Fluxos da primeira versão

Caminho a seguir: o protótipo beta, `projeto/docs/prototipo/beta/index.html` (11/11/2026). Ele orienta o fluxo e os textos, não o visual (o visual é o de `design-system/`), e não define escopo: o que ele mostra fora do MVP fica fora. O que o MVP tem e o beta não mostra continua (login, histórico, nota com a conta). Protótipo anterior, só como histórico: `projeto/docs/prototipo/prototipo_emagvalid.html` e `projeto/docs/rascunhos/Prototipo_30-10_telas_e_teste.md`.

1. Criar conta ou entrar com e-mail e senha.
2. Informar a URL de uma página pública e iniciar a avaliação (ou, se houver tempo, uma lista de URLs analisadas uma por vez, RF20); acompanhar o andamento.
3. Ver o resultado: nota, nota por requisito com a conta, falhas com requisito, local exato e prioridade, e o que exige revisão humana.
4. Ler as sugestões da IA, marcadas como sugestão, com aviso para conferir antes de aplicar (RF10).
5. Gerar o PDF (plano pago). Na amostra gratuita, o PDF aparece bloqueado, com aviso; não há cobrança no MVP (RF21).
6. Abrir uma avaliação anterior no histórico.
7. Em erro e nos casos de borda (URL inválida, página fora do ar ou lenta demais, redirecionamento, arquivo que não é HTML, página que pede login, análise que falhou), ver mensagem clara com o próximo passo (RF17).

## MVP

Requisitos de prioridade alta (A) e média (M) do Plano de Projeto v1.1: RF01–RF10, RF12–RF14, RF16, RF17, RF21, RNF01–RNF08 e RNF10. RF20 (lista de URLs, baixa) entra se houver tempo. A média só se corta com o aval do mentor; nunca se corta a publicação, a LGPD (RNF05) nem a segurança (RNF04, RNF10).

## Fora do escopo

O que o protótipo beta mostra além do MVP: nota por perfil de deficiência, critérios WCAG, auditoria aprofundada, indicação de equipes parceiras e validação com uma equipe de pessoas com cada tipo de deficiência (decisão de 11/11/2026). Também: cobrança e pagamento (modelo previsto: valor por quantidade de páginas), edição das orientações (RF11), varredura de várias páginas ao mesmo tempo, aplicativo móvel, certificação de conformidade integral, comparação entre avaliações (RF15), exportação CSV (RF18), canal de contato humano (RF19), uso em celular (RNF09), páginas atrás de login e integrações com Jira, GitHub ou CI.

## Requisitos

- **Acessibilidade da própria interface (RNF01, RNF02):** eMAG 3.1/WCAG, teclado, leitor de tela (NVDA e Orca), foco visível, rótulos, contraste e alvos de 44 px ou mais. Detalhes: `docs/design.md`.
- **Segurança e dados (RNF04, RNF05, RNF10):** login com senha guardada em hash; consultas ao banco parametrizadas (Prisma), contra SQL injection; a análise só abre endereços públicos (contra SSRF), com limite de tempo, de tamanho e de análises seguidas; trechos da página aparecem como texto, nunca como HTML (contra XSS); só os dados necessários (LGPD); à IA vai só o trecho público da página com a falha.
- **IA (RF07, RF08, RF10):** Google Gemini, plano gratuito; explicação simples e código antes e depois, apresentados como sugestão; só cita requisitos de uma lista fechada do eMAG (`projeto/docs/rascunhos/Cobertura_eMAG_axe-core.md`).
- **Nota (RF05, RF06):** 100 × pesos aprovados ÷ pesos aplicáveis; peso alta 3, média 2, baixa 1, nas 29 recomendações do eMAG que o axe-core cobre no todo ou em parte.
- **Desempenho (RNF06):** andamento visível; meta de até 60 s por página com orientações.

## Restrições e decisões técnicas

- Stack existente, mantida: React + Vite, Express, Prisma, PostgreSQL, Playwright + axe-core (`docs/architecture.md`). O toolkit sugere Next.js e Drizzle para projetos novos; não se aplica aqui.
- Hospedagem: Render (telas e API) e Neon (PostgreSQL), planos gratuitos. Custo total: R$ 0.
- Prazos: construção a partir de 16/11/2026; MVP publicado até 04/12/2026 (RNF08); congelamento em 11/12/2026.

## Suposições e pendências

- A decidir com a equipe (o João traz a resposta): selo próprio, avaliação de sites sem domínio público e valores de preço (`projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção B).
- Mapeamento eMAG ↔ axe-core e pesos: a conferir com o mentor José Alves (`07`, seção E).
- TAP v1.0, Persona v1.0 e Jornada v1.0 ainda descrevem o auditor; o Plano v1.1 já traz o público novo (`07`, seção D, 11/11/2026).
- Demais pendências do programa e do mentor: `07`, seções A e E.

## Critérios de aceite

- Fluxo completo aprovado em teste: login → URL → avaliação → nota e falhas → sugestões da IA marcadas como sugestão → PDF → histórico (Plano v1.1).
- Telas usáveis só com teclado e com leitor de tela, sem violações sérias ou críticas do axe (checagem automática em `docs/quality.md`).
- Solução publicada e ligada ao banco até 04/12/2026.

## Próxima entrega

Sprint 1 (a partir de 16/11): telas principais e estrutura, conforme `docs/passo-a-passo-mvp.md`.

## Manutenção

Atualize este arquivo quando objetivo, escopo, restrições ou aceite mudarem, e registre a decisão em `projeto/contexto_agente/07-pendencias-e-decisoes.md` (seção D). Decisões técnicas detalhadas vão para `docs/architecture.md`; evidências do setup, para `docs/setup.md`.
