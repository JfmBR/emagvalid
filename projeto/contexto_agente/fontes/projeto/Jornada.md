<!-- GERADO por _gerar_fontes.py em 10/11/2026 a partir de docs/contexto_projeto/Jornada_do_Usuario_emagvalid_v1.0_28-10-2026.docx. NÃO EDITAR. -->
# Fonte literal: Jornada_do_Usuario_emagvalid_v1.0_28-10-2026.docx
Origem: `docs/contexto_projeto/Jornada_do_Usuario_emagvalid_v1.0_28-10-2026.docx` · Conversão automática, sem resumo. Linhas `- a | b` são linhas de tabela; células vazias aparecem como vazio.

Jornada
Do Usuário
Helena
[tabela]
- PERSONA / Helena — ver Persona v1.0 | 
- DATA / 28/10/2026 · v1.0 | 
[fim da tabela]
[tabela]
-  | Ficha da jornada
[fim da tabela]
[tabela]
- PERSONA | Helena, analista de acessibilidade (persona fictícia) que reúne as 3 entrevistas com auditores: perfil e rotina de A1, com dores, canais e ferramentas também de A2 e A3. Ver Documento de Persona v1.0.
- CENÁRIO | Audita páginas de um cliente (órgão público ou privado) pelo eMAG e pelo WCAG, entrega o relatório e, depois, refaz a auditoria quando o cliente corrige.
- OBJETIVO DA PERSONA | Gastar menos horas na revisão e no relatório, mantendo o controle do conteúdo e da conclusão de conformidade (A1).
- INÍCIO DA JORNADA | O cliente pede uma auditoria, ou uma nova, depois de corrigir parte dos problemas (A1).
- FIM DA JORNADA | Entrega o relatório no formato que o cliente já recebe e guarda a avaliação para comparar na próxima (A1, A3).
- PERÍODO E FONTES | 10/2026 · 3 entrevistas com auditores (1 analista, 1 QA, 1 dev front-end), em 19/10, 20/10 e 21/10/2026 · 4 entrevistas com pessoas com deficiência (Ctx), em 22/10/2026 · TAP v1.0
[fim da tabela]
Legenda: A1 (analista) · A2 (QA, 34) · A3 (dev front-end, 26), entrevistas com auditores. (H) = hipótese do grupo, que as entrevistas não cobriram; validar. Ctx = entrevistas com pessoas com deficiência: Ctx1, Ctx2, Ctx3 e Ctx4, pessoas diferentes dos auditores A2 e A3. (F) = pedido nas entrevistas, mas fora do TAP v1.0; decidir no Plano de Projeto (06/11).
[tabela]
-  | Premissas e contexto
[fim da tabela]
[tabela]
- PREMISSAS |  | CONTEXTO
- Assumimos: a nota e a IA complementam a avaliação humana; a conclusão de conformidade é do(a) auditor(a) (A1, A2, A3). / Limites: uma página pública por URL, sem varredura, sem app móvel, sem certificação (TAP). Telas com login, integrações, exportação além do PDF, contato humano e comparação lado a lado foram pedidos nas entrevistas, mas não estão no escopo atual; aparecem no mapa marcados com (F). O mapa vale para a Helena (perfil principal); QA e dev seguem outro fluxo (ver Persona). / Quem participou: Grupo 3 (UX/UI: João Francisco); 3 auditores entrevistados. |  | Momento do projeto: design e protótipo de telas (vence 30/10); Plano de Projeto v1.0 em 06/11; construção a partir de 16/11. / Fatores externos: eMAG 3.1 e WCAG usados em conjunto; fornecedor de IA e hospedagem a definir (TAP). / Dados de apoio: 3 entrevistas com auditores; 4 com pessoas com deficiência; TAP v1.0; Cetic.br/NIC.br (2020).
[fim da tabela]
[tabela]
-  | Mapa da jornada
[fim da tabela]
[tabela]
- ETAPA | ETAPA 1 / Descoberta | ETAPA 2 / Primeiro acesso | ETAPA 3 / Uso principal | ETAPA 4 / Suporte | ETAPA 5 / Retorno
- O QUE FAZ NA SOLUÇÃO | Procura uma forma de poupar tempo no relatório (A1) / Compara com as ferramentas que conhece: ASES, WAVE, axe, Lighthouse (A1) | Entra com login e informa a primeira URL (TAP) / Vê a boas-vindas (H) | Informa a URL; vê nota e falhas por critério (TAP) / Lê as orientações da IA e revisa (A1, A2) / Gera o PDF (TAP) | Busca ajuda quando a análise falha ou a orientação parece errada (H) / Corrige o texto antes de entregar (A1: “sem perder o controle do conteúdo”) | Faz nova auditoria depois que o cliente corrige (A1) / Compara com a anterior (A3) (F) / Exporta no formato do cliente; além do PDF (A1) (F)
- O QUE PENSA | “Mostra como chegou à nota?” (A1) / “Cobre critérios de verdade?” (A1) | “É fácil começar?” (H) / “Funciona na minha página?” (A2) | “Como chegou a essa nota?” (A1) / “Esse requisito existe? Posso confiar?” (A2) | “Por que deu erro?” (H) / “Posso corrigir isso?” (H) | “Isso me poupa o retrabalho?” (A1)
- COMO SE SENTE | ● ● ● ○ ○ / Desconfiança cautelosa (A1) (H) | ● ● ● ○ ○ / Expectativa com receio (H) | ● ● ● ● ○ / Alívio, se a conta for mostrada (H) | ● ● ○ ○ ○ / Insegurança, se o erro não for explicado (H) | ● ● ● ● ○ / Confiança, se houver comparação (H)
- TELAS E CANAIS | Indicação de colegas e comunidades de acessibilidade no LinkedIn (H) / Tela inicial | Login / Boas-vindas | Avaliação por URL · resultado (nota e falhas) / Orientações da IA · PDF | Ajuda na própria tela / Contato humano (A2) (F) | Histórico de avaliações / Exportação em PDF; outros formatos (F)
- DORES E FRICÇÕES | Ferramentas que cobrem poucos critérios e dão nota que “passa falsa segurança” (A1, A3) / Não saber o que é automático (A1) | Ferramenta pesada (A1); só funciona sem login (A2) / Tutorial longo (A1, A2) | Nota única sem explicação (A1, A2, A3) / IA que cita requisito inexistente (A2) / Correção sem explicação (A1); falso positivo e falha sem local exato (A3) | Erro sem explicação (H) / Texto da IA que ela não consegue ajustar (H) | Refazer tudo para conferir (A1) / Perder o histórico (H)
- OPORTUNIDADES | Dizer na tela inicial o que é automático e o que precisa de revisão humana (A1) | Ajuda curta no ponto da tela, com exemplo (A1, A2, A3) / Cadastro curto e avisar o que será pedido (Ctx) | Nota por critério; link ou identificação de cada requisito citado (A2) / Local exato, prioridade e exemplo de correção (A1, A2, A3) / Botões grandes e imagens com texto alternativo (Ctx) | Ajuda na tela com exemplos (A2); contato humano (A2) (F) / Editar o texto antes de gerar o PDF (H) | Comparar com a avaliação anterior (A3) (F); exportar no formato do cliente (A1) (F) / Salvar e retomar (Ctx)
[fim da tabela]
[tabela]
-  | Desenho do Contexto 1
[fim da tabela]
Contexto 1 — avaliar e entregar. Fluxo principal da Helena na solução, do login ao histórico.
[tabela]
- Esquema do fluxo (28/10/2026). MV = momento da verdade, ver seção 04.
[fim da tabela]
[tabela]
-  | Desenho do Contexto 2
[fim da tabela]
Contexto 2 — nova auditoria depois da correção. Caminho de erro (URL inválida, análise falhou): mensagem clara + tentar de novo ou pedir ajuda.
[tabela]
- Esquema do fluxo (28/10/2026). A comparação lado a lado (passo 4) está fora do TAP v1.0.
[fim da tabela]
[tabela]
-  | Momentos da verdade
[fim da tabela]
[tabela]
- 1 / A nota aparece com a conta / Se a nota vem sozinha, sem o critério a critério, Helena não confia e volta à ferramenta que já usa. Os 3 auditores pediram a conta (A1, A2, A3). |  | 2 / As orientações da IA são verificáveis / Se a IA cita um requisito do eMAG que não existe ou sugere correção sem explicação, ela perde a confiança; a decisão continua sendo da Helena (A1, A2, A3). |  | 3 / O relatório sai pronto para o cliente / É onde a ferramenta paga o tempo: PDF com resumo, prioridade, local exato e correção, e comparação na próxima auditoria. Se tiver de refazer o texto, a ferramenta “vai para a gaveta” (A1, A2).
[fim da tabela]
Transversal: a interface do emagvalid precisa ser acessível. Imagem sem nome, clique pequeno e formulário longo fazem quem usa leitor de tela ou tem limitação motora sair sem avisar (Ctx).
[tabela]
-  | Fontes e validação
[fim da tabela]
[tabela]
- EVIDÊNCIAS USADAS |  | COMO VALIDAR
- Entrevistas com auditores: A1 (analista, 29), A2 (QA, 34), A3 (dev front-end, 26); roteiro de 18 perguntas e fechamento. / Entrevistas com pessoas com deficiência: Ctx1 (23), Ctx2 (19), Ctx3 (21) e Ctx4 (25), pessoas diferentes dos auditores A2 e A3; para acessibilidade da interface. / Documentos: TAP v1.0 (08/10/2026); Cetic.br/NIC.br (2020), pp. 143–144. |  | Quem confirma: os 3 entrevistados, mais 1 ou 2 analistas de acessibilidade (a recrutar). Mentor do Grupo 3: Rodrigo Pereira. / Resultado e evidências: a registrar depois do retorno do mentor do Grupo 3 sobre o protótipo (enviado em 30/10).
[fim da tabela]

## Cabeçalhos e rodapés
- word/footer1.xml: Conecta Jovem  ·  Jornada do usuárioPágina 2
- word/footer2.xml: Conecta Jovem  ·  Jornada do usuárioPágina 3
- word/footer3.xml: Conecta Jovem  ·  Jornada do usuárioPágina 3
- word/footer4.xml: Conecta Jovem  ·  Jornada do usuárioPágina 5
