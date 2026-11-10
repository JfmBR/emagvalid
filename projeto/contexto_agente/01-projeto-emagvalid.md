# 01 · Projeto AcessaWeb

Fonte: TAP v1.0 de 08/10/2026 (`fontes/projeto/TAP.md`). Tudo que o TAP deixou "a definir" está marcado como **A DEFINIR** e repetido em `07-pendencias-e-decisoes.md`. Este arquivo reproduz o TAP, que não será alterado (decisão de 05/11/2026). Hospedagem, fornecedor de IA, custos, cálculo da nota, término e acesso a computador foram decididos em 05/11/2026: ver `07`, seções B e D.

## Identificação
| Campo | Valor |
|---|---|
| Projeto | **AcessaWeb**, desde 05/11/2026 (ver `07`, seção D). Até então, emagvalid: é o nome no TAP, na Persona v1.0 ("emagvalid · Grupo 3") e na Jornada v1.0, que não serão alterados; "EmagValid" só aparece na Persona v0.1 e no arquivo de entrevistas |
| Solução | Auditoria automatizada de acessibilidade do eMAG |
| Grupo | Grupo 3 |
| Líder do grupo | Luiz Felipe, desde 05/11/2026 (no TAP: Matheus Francisconi; ver `02`) |
| Início | 31/08/2026 |
| Término previsto | 11/12/2026 (a confirmar com o orientador) |
| Trilha | **A — Produto funcional** (MVP web publicado, com banco de dados e código-fonte) |
| Síntese do TAP | MVP web para apoiar auditorias de acessibilidade baseadas no **eMAG 3.1**, complementando a avaliação humana |

## Contexto e justificativa
| Campo | Conteúdo |
|---|---|
| Problema ou oportunidade | Documentar manualmente os requisitos do eMAG dificulta a auditoria. Há oportunidade de automatizar verificações e organizar resultados. |
| Quem é afetado | Empresas de auditoria e consultoria de software e equipes de auditoria web. |
| Por que agora | Reduzir a documentação manual e apoiar a identificação de falhas e melhorias. |
| Relação com o curso | Desenvolvimento web, banco de dados e UX/UI. |

## Objetivos
- **Objetivo geral:** publicar o AcessaWeb para apoiar auditorias de páginas web baseadas no eMAG 3.1, com identificação de falhas e relatórios, complementando a avaliação humana.
- **Objetivos específicos:**
  1. Avaliar páginas e exibir falhas e nota de 0 a 100.
  2. Gerar PDF com orientações de correção apoiadas por IA.
  3. Oferecer login e histórico de avaliações.

## Solução proposta
| Campo | Conteúdo |
|---|---|
| Tipo de solução | Sistema web — Trilha A (MVP funcional) |
| Público-alvo | Empresas de auditoria e consultoria de software e equipes de auditoria |
| Tecnologias previstas | React e TypeScript; Node.js e Express; PostgreSQL; Playwright e axe-core; API de IA (**fornecedor A DEFINIR**) |

**Funcionalidades principais:** login e histórico de avaliações · análise da página pública informada por URL · nota de 0 a 100 e identificação de falhas · PDF com orientações de correção apoiadas por IA.

**Diferenciais:** reunir avaliação baseada no eMAG, falhas, nota, IA, PDF e histórico · reduzir o trabalho manual de documentação e apoiar o acompanhamento das melhorias.

## Escopo
| Dentro do escopo | Fora do escopo |
|---|---|
| MVP web publicado, com código-fonte e banco de dados | Varredura de várias páginas |
| Login, avaliação por URL, nota, falhas, orientações com IA, PDF e histórico | Aplicativo móvel |
| Documentação do projeto e apresentação final | Certificação de conformidade integral |
| | A nota e as orientações da IA **complementam** a avaliação humana |

## Premissas e restrições
| Premissas | Restrições |
|---|---|
| Estima-se que pelo menos 80% da equipe tenha computador e internet; **confirmar o acesso de todos** | Dedicação mínima de 2 h semanais por integrante, ampliável |
| Bibliotecas de análise e ambiente de desenvolvimento disponíveis | Término previsto em 11/12/2026, a confirmar |
| Hospedagem **A DEFINIR** | Aprendizado das bibliotecas e integração de IA |
| | Hospedagem, fornecedor de IA, custos e cálculo da nota **A DEFINIR** |

## Entregas e critérios de sucesso
| Entrega | Descrição | Prazo |
|---|---|---|
| Protótipo de telas | Telas do fluxo de login, avaliação, resultados e histórico | 30/10/2026 (previsto) |
| Versão funcional (MVP) | Sistema publicado com avaliação, IA, PDF e histórico | 04/12/2026 (previsto) |
| Apresentação final | Pitch com demonstração do MVP | Janeiro/2027; dia a definir |

| Benefícios esperados | Indicadores de sucesso |
|---|---|
| Reduzir a documentação manual e centralizar resultados das auditorias | Fluxo completo: login, URL, avaliação, nota/falhas, orientações com IA, PDF e histórico |
| Apoiar a identificação de barreiras e a melhoria da acessibilidade digital | **Meta:** fluxo aprovado em teste, incluindo revisão humana das orientações da IA |

## Recursos necessários
| Recurso | Descrição | Custo estimado |
|---|---|---|
| Computadores e internet | Desenvolvimento, testes e comunicação da equipe | A definir |
| Ferramentas de desenvolvimento | Programação, UX/UI, análise e banco de dados | A definir |
| Hospedagem e infraestrutura | Hospedagem, banco de dados e serviço de IA; fornecedores a definir | A definir |

## Riscos iniciais
| Risco | Chance | Impacto | Resposta planejada |
|---|---|---|---|
| Dificuldade para aprender as bibliotecas e adequar as verificações ao eMAG | Média | Alto | Estudar a documentação, testar páginas simples, conferir critérios do eMAG e buscar apoio do orientador |
| Atrasos ou falta de comunicação nas tarefas | Média | Alto | Definir prazos; conversar com o integrante e reportar ao orientador |
| A definir | A definir | A definir | A definir |
| A definir | A definir | A definir | A definir |

## Aprovação e histórico do TAP
- Texto: "Ao assinar, as partes concordam com o início do projeto nos termos descritos neste documento."
- Campos de assinatura (data em branco): Matheus Francisconi (líder da equipe) · orientador(a) externo — A DEFINIR · facilitador Conecta Jovem — A DEFINIR.

| Versão | Data | Autor | O que mudou |
|---|---|---|---|
| v1.0 | 08/10/2026 | Grupo 3 | Elaboração inicial do TAP |

## Glossário mínimo
- **eMAG 3.1:** Modelo de Acessibilidade em Governo Eletrônico, versão 3.1 (base das verificações do AcessaWeb). A expansão da sigla é conhecimento geral; os documentos do projeto só usam "eMAG 3.1".
- **WCAG 2.1:** Diretrizes de Acessibilidade para Conteúdo Web, versão 2.1 (expansão da sigla: conhecimento geral). O TAP só cita o eMAG 3.1; a Persona e a Jornada v1.0 citam o WCAG ao lado do eMAG (Helena usa o eMAG nos projetos públicos e o WCAG 2.1 nos privados).
- **MVP:** produto mínimo viável (expansão da sigla: conhecimento geral); nos documentos, é a primeira versão apresentada à banca.
- **TAP:** Termo de Abertura de Projeto.
- **Trilha A / B:** A = produto funcional (banco, código, publicação); B = protótipo navegável com regras de negócio.
- **axe-core / Playwright:** listadas em "Tecnologias previstas" do TAP. (O papel de cada uma na análise automatizada de páginas é inferência, não consta no TAP.)
