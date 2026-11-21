# Qualidade

## Comandos

| Comando                                                                  | O que confere                                                                                               |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `npm run verificar`                                                      | Tudo abaixo, em ordem, até `build`: é o que o job `verificar` do CI roda                                    |
| `npm run lint`                                                           | oxlint: correção, React, acessibilidade no JSX (`jsx-a11y`) e as regras de qualidade abaixo                 |
| `npm run lint:autoteste`                                                 | Confere que as regras de qualidade acusam arquivos feitos para falhar (`scripts/verificar-regras-lint.mjs`) |
| `npm run format:check`                                                   | Prettier (ignora `projeto/` e `.claude/skills/`)                                                            |
| `npm run typecheck`                                                      | TypeScript nas duas partes (gera o cliente Prisma antes)                                                    |
| `npm run lint:tipos`                                                     | Lint com tipos (`oxlint --type-aware`): promessas soltas e mal usadas                                       |
| `npm test`                                                               | Vitest: `apps/api` e `apps/web`                                                                             |
| `npm run build`                                                          | Build de produção das duas partes                                                                           |
| `npm run test:e2e`                                                       | Playwright + axe na tela, com teclado (job `e2e` do CI, informativo)                                        |
| `python3 -I projeto/contexto_agente/fontes/test_gerar_fontes.py`         | Autoteste do gerador de fontes                                                                              |
| `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar` | Nada de entrevistado nem link privado no que é público (precisa da pasta privada)                           |

O `--verificar` não roda no CI, porque a tabela de nomes é privada: ele entra no checklist da PR.

## Regras de base

- oxlint com a categoria `correctness` como erro, `react/rules-of-hooks` e `jsx-a11y`.
- Regras de qualidade (10/11/2026; contagem antes de ligar: `max-lines` 0, `no-restricted-imports` 0, `no-console` 2), todas como erro:
  - `max-lines`: até 350 linhas por arquivo (testes, `e2e/` e `scripts/` de fora). Acima disso, divida por responsabilidade.
  - `no-console` em `apps/api/src`: só `console.error` e `console.warn`. A mensagem de início da API em `server.ts` tem exceção comentada.
  - `no-restricted-imports` em `apps/web/src`: o front-end não importa Prisma, o cliente gerado nem código de `apps/api`.
  - `typescript/no-floating-promises` e `typescript/no-misused-promises` (`npm run lint:tipos`, com `oxlint-tsgolint`): 0 violações; cerca de 1,2 s.
- Prettier: aspas simples, sem ponto e vírgula (`.prettierrc.json`).

## Estratégia de testes

- **Unitário (Vitest):** regras do domínio (nota, mapeamento eMAG, validação de URL) e rotas da API com `criarApp()`.
- **Interface (Vitest + Testing Library):** comportamento de componentes, com consultas por papel e rótulo, como o leitor de tela vê.
- **Ponta a ponta (Playwright + axe, `apps/web/e2e/`):** cada tela sem violações sérias ou críticas de WCAG 2.1 A/AA, uso por teclado e estados da tela. A resposta da API é simulada com `page.route` para o teste não depender dela.
- **Leitor de tela (manual):** Orca + Firefox e NVDA; roteiro em `docs/design.md`.
- **SQL escrito à mão (manual):** o CI não tem banco, então o teste da rota usa um banco falso. O `UPDATE` da revisão humana (`apps/api/src/rotas/avaliacoes.ts`) foi conferido no Postgres local em 19/11/2026 (marcar, repetir, desmarcar); confira de novo se ele mudar.
- **PDF do relatório (manual):** o teste da rota simula o gerador; o `pdf.test.ts` abre um Chromium de verdade (gera, não busca nada na rede, um por vez, libera depois de falhar). Em 19/11/2026, um PDF de exemplo com 51 falhas (uma com trecho de 1.000 caracteres sem espaço e outra com `</style><script>`) saiu em 8 páginas A4, com "Página X de 8" em todas, o trecho quebrando dentro da margem, o `<script>` como texto e `pdfinfo` dizendo `Tagged: yes`. Confira de novo se `html.ts` ou `pdf.ts` mudarem. Falta ouvir o PDF no Orca ou no NVDA.
- **Leitura automática da revisão humana** (`apps/api/src/analise/revisaoAutomatica.ts`, 21/11/2026): separa os itens que provavelmente não se aplicam (1.6, 3.8, 5.2, 5.3, 6.4 a 6.8) e aponta indícios em 1.9, 6.7 e 6.8. Ela ajuda quem confere; não decide nada, e nada dela entra na nota. Testada com páginas locais, com frames, com página que troca funções do DOM e com retorno fora do formato.
  - Cobre: o HTML que o JavaScript do site já montou ao fim da análise, em cada frame (`iframe` incluído); `<video>`, `<audio>`, links para arquivos e players conhecidos (YouTube, Vimeo, SoundCloud, Spotify e outros); formulários e campos; CAPTCHA conhecido. Link escondido com `target="_blank"` conta para 1.9.
  - Não cobre: player montado por JavaScript (sem `<video>`, `<audio>` nem `iframe` de player conhecido); conteúdo que só carrega ao rolar a página ou depois de um clique; abertura de janela por script (só `target` em link é visto).
  - Limites: lê só os primeiros 20 frames carregados. Com mais, ou com erro de leitura num frame carregado, nenhum "não se aplica" é afirmado; os indícios achados continuam. Frame que não carregou (página de erro, anúncio bloqueado) é ignorado e não conta nos 20. Entra em shadow root aberto; não vê shadow root fechado nem player que só carrega ao clicar. A leitura toda tem prazo de 10 s; estourou, sai vazia e a avaliação conclui com o axe.
  - Por isso o item do grupo continua visível, o texto diz "não achamos" e a pessoa decide.
- Correção de bug começa por um teste que reproduz o erro.

## Navegador para o agente

Só em `localhost`, com `npm run dev` rodando; nunca em produção nem com sessões pessoais.

- **agent-browser** (CLI global): abrir uma tela, ler a árvore de acessibilidade (`agent-browser snapshot`), navegar por teclado (`agent-browser press Tab`) e preencher formulários. Use para conferir uma tela antes de entregar.
- **Chrome DevTools MCP** (`.mcp.json`): console, requisições de rede e desempenho (por exemplo, o tempo da análise, RNF06). Use para investigar erro de tela ou lentidão.
- Nenhum dos dois substitui o teste com leitor de tela (`docs/design.md`).

## Revisão depois de implementar ou corrigir

- Rode os comandos acima e leia a saída; "deve passar" não é evidência.
- Mudança não trivial: revisão independente (subagente só de leitura ou `/code-review`), com escopo pelo risco: comportamento e testes; segurança e dados; acessibilidade; configuração e CI.
- Achado só vira correção depois de verificado no código atual.

## Revisão de segurança

- Prompt reutilizável: `docs/prompts/revisao-de-seguranca.md` (base do repositório ou diff preciso), só leitura, relatório em `../acessaweb-privado/relatorios/`.
- Pontos de atenção do produto: URLs arbitrárias abertas pelo Playwright (SSRF), login e senhas (RNF04), dados enviados à IA (RNF05), chaves no `.env`.

## Melhoria do harness (Harness2, adaptação nativa)

Procedimento do prompt 15 do Vibe Coding Toolkit (`docs/prompts/15-harness-improvement.md`, revisão `7ef68dd`), usado quando o agente erra de forma recorrente (ignora uma regra, pula uma checagem, inventa um resultado):

1. Descreva a falha observada e o critério de aceite antes de mexer em qualquer instrução.
2. Reproduza numa cópia descartável, com o mesmo cliente e modelo, e anote o que o agente fez.
3. Proponha **uma** mudança pequena (no `AGENTS.md`, numa skill, num teste ou num script) e rode o mesmo caso de novo nas mesmas condições.
4. Adote só se a checagem independente melhorar; senão, mantenha o original e registre a falha.
5. Registre a lição (evidência, escopo, data e quando invalidar) em `docs/setup.md`.

Limite: uma comparação por falha. Na preparação de 10/11/2026 não houve falha (`docs/setup.md`, "Avaliação do harness"), então nada mudou. Casos de teste: `docs/07-harness-evaluation.md` e prompt 14 do toolkit.

## Dependências e entrega

- Dependência nova só com motivo e, até o Plano v1.1 (13/11), com aval do João.
- Antes de pedir merge: checklist de `.github/pull_request_template.md` e CI verde.
