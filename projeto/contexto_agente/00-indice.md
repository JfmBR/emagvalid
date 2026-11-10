# 00 · Índice do contexto do agente

Contexto do **AcessaWeb** (Grupo 3, Projeto Integrador Conecta Jovem, Trilha A). Gerado em **28/10/2026** e atualizado em **29/10/2026** a partir dos `.docx` em `docs/contexto_projeto/` e `docs/Modelos/`. Última revisão: **04/11/2026** (caminhos da pasta reorganizada e decisões de 03/11).

Versões das fontes: TAP v1.0 (08/10/2026) · Persona v1.0 e Jornada do Usuário v1.0 (arquivos e data interna: 28/10/2026; ajustados com o feedback do mentor de 28/10) · Persona anterior (16/10/2026, parcial, mantida como v0.1) · Entrevistas com pessoas com deficiência (28/10/2026) · Artefatos e Cronograma v1.0 (06/10/2026). Fontes regeneradas em 29/10/2026.

## Como ler
1. Comece por este índice e abra só os arquivos que a tarefa exige.
2. Os arquivos `01`–`07` reorganizam os fatos por assunto, **sem comprimir dados** (tabelas, datas, nomes e regras foram mantidos).
3. Para o texto exato de qualquer documento, vá em `fontes/` (conversão literal, somente leitura).
4. Em caso de divergência: o `.docx` original manda; avise o João e registre em `07`.
5. A seção "Status" de `03` e a seção D de `07` são as partes que envelhecem: reconfira a data de hoje.

## Arquivos
| Arquivo | Conteúdo | Quando abrir |
|---|---|---|
| `01-projeto-emagvalid.md` | Identificação, problema, objetivos, solução, escopo, premissas, entregas, riscos, recursos, aprovação e histórico do TAP, glossário | Qualquer tarefa sobre o que o projeto é e faz |
| `02-equipe-e-mentores.md` | Equipe do Grupo 3, acordo de equipe, partes interessadas, 6 mentores e matriz de etapas | Atribuir tarefas, saber a quem recorrer |
| `03-cronograma-e-marcos.md` | **Status atual**, datas, marcos do TAP, cronograma semana a semana, regra de atraso, "Pronto para janeiro" | Priorizar, avisar prazos |
| `04-artefatos-e-entregas.md` | 6 artefatos (Trilhas A e B), entregas finais, incrementais por marco, estrutura dos modelos (TAP, Plano, Jornada) | Redigir ou revisar qualquer documento |
| `05-persona-e-pesquisa.md` | Estado da Persona, estrutura do modelo, evidências literais, lacunas | Persona, Jornada, pesquisa com usuários |
| `06-regras-do-programa.md` | Mentoria, pivô, gravação, ata (13 campos), encontros gerais, Prévia do Pitch e ficha de feedback | Atas, pitch, regras do programa |
| `07-pendencias-e-decisoes.md` | Pontos em aberto, "a definir" do TAP, divergências, registro de decisões e (seção E) o que depende do mentor ou do programa | Antes de assumir qualquer dado ausente |
| `fontes/projeto/` | `TAP.md`, `Persona.md` (v1.0), `Persona_v0.1.md`, `Jornada.md` (v1.0), `Plano_de_Projeto.md` (v1, oficial desde 05/11/2026), `Entrevistas_PcD.md`, `Artefatos_e_Cronograma.md` (literal) | Texto exato, conferência |
| `docs/rascunhos/` | Rascunhos em Markdown: Persona v1.0, Jornada v1.0, Plano de Projeto v1.0, Requisitos do Plano v1.0, Cobertura do eMAG 3.1 pelo axe-core (lista fechada da IA e cálculo da nota, 05/11), Público-alvo e roteiro de entrevistas, Protótipo de 30/10 (telas e roteiro do teste). Também: rascunho da Matriz RACI do grupo (.xlsx; modelo didático em `docs/Modelos/`) | Continuar a redação; o .docx é a versão oficial |
| `docs/prototipo/` | Protótipo clicável das 8 telas em HTML (publicado como link privado), espelhado num arquivo do Figma | Protótipo, teste de usabilidade, UX/UI |
| `CLAUDE.md` (raiz) | Regras de trabalho do grupo: commit antes de cada alteração; PRs; editar .docx só a pedido. As preferências do João ficam em `CLAUDE.local.md`, fora do git | Sempre, antes de alterar arquivos |
| `fontes/modelos/` | `TAP.md`, `Plano_de_Projeto.md`, `Persona.md`, `Jornada.md` (literal) | Redigir um documento no modelo oficial |
| `../emagvalid/` (outro repositório, https://github.com/JfmBR/emagvalid) | Código do MVP, criado em 03/11/2026. As duas pastas ficam lado a lado em `projeto_integrador/`; o código lê requisitos, telas e protótipo daqui por `../emagvalid_docs/`, sem copiar | Desenvolvimento |

## Tabela de cobertura (documento de origem → destino)
| Origem | Seção | Destino |
|---|---|---|
| TAP | Identificação, contexto, objetivos, solução, escopo, premissas/restrições, entregas e critérios, benefícios, recursos, riscos, aprovação, histórico | `01` |
| TAP | Equipe, partes interessadas, acordo de equipe | `02` |
| TAP | Marcos de entrega macro | `03` |
| Artefatos | §1 Visão geral e datas principais | `03` (e princípios em `04`) |
| Artefatos | §2 Artefatos (tabela, entregas por trilha, "Além dos 6", incrementais, DER) | `04` |
| Artefatos | §3 Cronograma, recesso, "Pronto para janeiro" | `03` |
| Artefatos | §3 Encontros gerais, Prévia do Pitch, ficha de feedback | `06` |
| Artefatos | §4 Mentores e matriz de etapas | `02` |
| Artefatos | §5 Mentoria, pivô, gravação, ata | `06` |
| Artefatos | §6 Pontos em aberto | `07` |
| Persona | v1.0 (Helena) + v0.1 (falas e evidências documentais) | `05` |
| Jornada | v1.0 (Helena) | `05` (estado) + `fontes/projeto/Jornada.md` |
| Entrevistas PcD | 4 entrevistas com pessoas com deficiência | `05` + `fontes/projeto/Entrevistas_PcD.md` |
| Modelos | TAP, Plano de Projeto, Jornada | `04` (estrutura e o que cada campo pede) + `fontes/modelos/` |
| Modelos | Persona | `05` + `fontes/modelos/Persona.md` |

## Como atualizar
- **Mudou um `.docx`:** rode `python3 -I contexto_agente/fontes/_gerar_fontes.py` (regenera `fontes/`) e peça ao agente `emagvalid` para revisar `01`–`07` contra as fontes e propor as alterações.
- **Decisão nova:** registrar em `07` (seção D) e, se mudar fatos, no arquivo temático correspondente, com a data.
- Nunca editar `fontes/` à mão.
