# Jornada do Usuário

**Helena** *(nome sugerido) — Analista de acessibilidade*

| | |
|---|---|
| **PERSONA** | Helena — ver Documento de Persona v1.0 |
| **DATA** | 28/10/2026 |
| **VERSÃO** | v1.0 (rascunho para colar no .docx) |

Legenda: **A1** (analista) · **A2** (QA, 34) · **A3** (dev front-end, 26), entrevistas com auditores. **(H)** = hipótese do grupo, que as entrevistas não cobriram; validar. **Ctx** = entrevistas com pessoas com deficiência: Ctx1, Ctx2, Ctx3 e Ctx4, pessoas diferentes dos auditores A2 e A3. **(F)** = pedido nas entrevistas, mas fora do TAP v1.0; decidir no Plano de Projeto (06/11).

---

## Ficha da jornada

| | |
|---|---|
| **PERSONA** | Helena, analista de acessibilidade (persona fictícia) que reúne as 3 entrevistas com auditores: perfil e rotina de A1, com dores, canais e ferramentas também de A2 e A3. Ver Documento de Persona v1.0. |
| **CENÁRIO** | Audita páginas de um cliente (órgão público ou privado) pelo eMAG e pelo WCAG, entrega o relatório e, depois, refaz a auditoria quando o cliente corrige. |
| **OBJETIVO DA PERSONA** | Gastar menos horas na revisão e no relatório, mantendo o controle do conteúdo e da conclusão de conformidade (A1). |
| **INÍCIO DA JORNADA** | O cliente pede uma auditoria, ou uma nova, depois de corrigir parte dos problemas (A1). |
| **FIM DA JORNADA** | Entrega o relatório no formato que o cliente já recebe e guarda a avaliação para comparar na próxima (A1, A3). |
| **PERÍODO E FONTES** | 10/2026 · 3 entrevistas com auditores (1 analista, 1 QA, 1 dev front-end) · 4 entrevistas com pessoas com deficiência (Ctx), em 22/10/2026 · TAP v1.0 · entrevistas com auditores em 19/10, 20/10 e 21/10/2026 |

## Premissas e contexto

| PREMISSAS | CONTEXTO |
|---|---|
| **Assumimos:** a nota e a IA complementam a avaliação humana; a conclusão de conformidade é do(a) auditor(a) (A1, A2, A3). | **Momento do projeto:** design e protótipo de telas (vence 30/10); Plano de Projeto v1.0 em 06/11; construção a partir de 16/11. |
| **Limites:** uma página pública por URL, sem varredura, sem app móvel, sem certificação (TAP). Telas com login, integrações, exportação além do PDF, contato humano e comparação lado a lado foram pedidos nas entrevistas, mas não estão no escopo atual; aparecem no mapa marcados com (F). O mapa vale para a Helena (perfil principal); QA e dev seguem outro fluxo (ver Persona). | **Fatores externos:** eMAG 3.1 e WCAG usados em conjunto; fornecedor de IA e hospedagem a definir (TAP). |
| **Quem participou:** Grupo 3 (UX/UI: João Francisco); 3 auditores entrevistados. | **Dados de apoio:** 3 entrevistas com auditores; 4 com pessoas com deficiência; TAP v1.0; Cetic.br/NIC.br (2020). |

## Mapa da jornada

| | 1 · Descoberta | 2 · Primeiro acesso | 3 · Uso principal | 4 · Suporte | 5 · Retorno |
|---|---|---|---|---|---|
| **O que faz na solução** | Procura uma forma de poupar tempo no relatório; compara com as ferramentas que conhece (ASES, WAVE, axe, Lighthouse) (A1) | Entra com login e informa a primeira URL (TAP); vê a boas-vindas (H) | Informa a URL; vê nota e falhas por critério; lê as orientações da IA; revisa; gera o PDF (TAP; A1, A2) | Busca ajuda quando a análise falha ou a orientação parece errada; corrige o texto antes de entregar (H; A1: "sem perder o controle do conteúdo") | Faz nova auditoria depois que o cliente corrige; compara com a anterior (A3) (F); exporta no formato do cliente, além do PDF (A1) (F) |
| **O que pensa** | "Mostra como chegou à nota? Cobre critérios de verdade?" (A1) | "É fácil começar? Funciona na minha página?" (H; A2) | "Como chegou a essa nota? Esse requisito existe? Posso confiar?" (A1, A2) | "Por que deu erro? Posso corrigir isso?" (H) | "Isso me poupa o retrabalho?" (A1) |
| **Como se sente** | ●●●○○ Desconfiança cautelosa (A1) (H) | ●●●○○ Expectativa com receio (H) | ●●●●○ Alívio, se a conta for mostrada (H) | ●●○○○ Insegurança, se o erro não for explicado (H) | ●●●●○ Confiança, se houver comparação (H) |
| **Telas e canais** | Canal de descoberta: indicação de colegas e comunidades de acessibilidade no LinkedIn (H) · tela inicial | Login · boas-vindas | Avaliação por URL · resultado (nota e falhas) · orientações da IA · PDF | Ajuda na própria tela · contato humano (A2) (F) | Histórico de avaliações · exportação em PDF; outros formatos (F) |
| **Dores e fricções** | Ferramentas que cobrem poucos critérios e dão nota que "passa falsa segurança" (A1, A3); não saber o que é automático | Ferramenta pesada (A1); só funciona sem login (A2); tutorial longo (A1, A2) | Nota única sem explicação (A1, A2, A3); IA que cita requisito inexistente (A2); correção sem explicação (A1); falso positivo (A3); falha sem local exato (A3) | Erro sem explicação (H); texto da IA que ela não consegue ajustar (H) | Refazer tudo para conferir (A1); perder o histórico (H) |
| **Oportunidades** | Dizer na tela inicial o que é automático e o que precisa de revisão humana (A1) | Ajuda curta no ponto da tela, com exemplo (A1, A2, A3); cadastro curto e avisar o que será pedido (Ctx) | Nota por critério; link ou identificação de cada requisito citado (A2); local exato, prioridade e exemplo de correção (A1, A2, A3); botões grandes e imagens com texto alternativo (Ctx) | Ajuda na tela com exemplos (A2); contato humano (A2) (F); editar o texto antes de gerar o PDF (H) | Comparar com a avaliação anterior (A3) (F); exportar no formato do cliente (A1) (F); salvar e retomar (Ctx) |

## Desenho do Contexto 1 — avaliar e entregar

```
Login → Informar URL → Aguardar análise → Resultado (nota por critério + falhas)
      → Orientações da IA (revisão e edição pela Helena) → Gerar PDF → Histórico
```

Inserido no .docx como esquema de fluxo: `docs/imagem/Jornada_contexto1_esquema.png` (7 passos; MV 1 no Resultado, MV 2 nas Orientações da IA, MV 3 no PDF; caminho de erro a partir de "Aguardar análise", voltando a "Informar URL"). Legenda: "Esquema do fluxo (28/10/2026). MV = momento da verdade, ver seção 04."

## Desenho do Contexto 2 — nova auditoria depois da correção

```
Histórico → Escolher a avaliação anterior → Informar a mesma URL
          → Resultado novo ao lado do anterior (o que foi corrigido, o que continua) → Gerar PDF
```

Caminho de erro (URL inválida, análise falhou): mensagem clara + tentar de novo ou pedir ajuda. Inserido no .docx como esquema de fluxo: `docs/imagem/Jornada_contexto2_esquema.png` (5 passos; MV 1 no resultado comparado, MV 3 no PDF; nota de que a comparação lado a lado está fora do TAP v1.0). Legenda: "Esquema do fluxo (28/10/2026). A comparação lado a lado (passo 4) está fora do TAP v1.0."

## Momentos da verdade

| 1 · A nota aparece com a conta | 2 · As orientações da IA são verificáveis | 3 · O relatório sai pronto para o cliente |
|---|---|---|
| Se a nota vem sozinha, sem o critério a critério, Helena não confia e volta à ferramenta que já usa. Os 3 auditores pediram a conta (A1, A2, A3). | Se a IA cita um requisito do eMAG que não existe ou sugere correção sem explicação, ela perde a confiança e a decisão continua sendo da Helena (A1, A2, A3). | É onde a ferramenta paga o tempo: PDF com resumo, prioridade, local exato e correção, e comparação na próxima auditoria. Se tiver de refazer o texto, a ferramenta "vai para a gaveta" (A1, A2). |

*Transversal:* a interface do AcessaWeb precisa ser acessível. Imagem sem nome, clique pequeno e formulário longo fazem quem usa leitor de tela ou tem limitação motora sair sem avisar (Ctx).

## Fontes e validação

| EVIDÊNCIAS USADAS | COMO VALIDAR |
|---|---|
| **Entrevistas com auditores:** A1 (analista, 29), A2 (QA, 34), A3 (dev front-end, 26); roteiro de 18 perguntas e fechamento. | **Quem confirma:** os 3 entrevistados, mais 1 ou 2 analistas de acessibilidade (a recrutar). Mentor do Grupo 3: Rodrigo Pereira. |
| **Entrevistas com pessoas com deficiência:** Ctx1 (23), Ctx2 (19), Ctx3 (21) e Ctx4 (25), pessoas diferentes dos auditores A2 e A3; para acessibilidade da interface. | **Resultado e evidências:** a registrar depois do retorno do mentor do Grupo 3 sobre o protótipo (enviado em 30/10). |
| **Documentos:** TAP v1.0 (08/10/2026); Cetic.br/NIC.br (2020), pp. 143–144. | |

---

## Notas para o João (apagar antes de colar no .docx)

1. **Marcado com (H):** o que as entrevistas não cobriram, principalmente primeiro acesso, suporte e as emoções. Os círculos de "Como se sente" são propostas minhas; ajuste.
2. **Validação do protótipo:** o roteiro tinha a pergunta 20 (pode voltar a falar com você?) e o registro não a mostra. Peça o aval dos 3 por mensagem antes de mostrar o protótipo. *(Superada em 29/10/2026: o protótipo será só enviado ao mentor, sem teste com auditores.)*
3. **Telas com login, integrações e exportação além de PDF** pesam na etapa 2 e na etapa 5, mas estão fora do TAP. A Jornada registra o que foi dito; a decisão é do grupo e do mentor.
4. **Desenhos do Contexto 1 e 2:** só o esqueleto em texto. O desenho e as telas vêm de você.
5. **Canal de descoberta:** o roteiro não perguntou como cada um conhece ferramentas novas; preenchido como hipótese (H): indicação de colegas e comunidades de acessibilidade no LinkedIn.
6. **Trilha A:** no pitch, a demo é a solução em produção, não o protótipo (07 C.16).
