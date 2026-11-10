# Qualidade

## Comandos

| Comando                                                                  | O que confere                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `npm run lint`                                                           | oxlint: erros de correção, regras de React e de acessibilidade no JSX (`jsx-a11y`) |
| `npm run format:check`                                                   | Prettier (ignora `projeto/` e `.claude/skills/`)                                   |
| `npm run typecheck`                                                      | TypeScript nas duas partes (gera o cliente Prisma antes)                           |
| `npm test`                                                               | Vitest: `apps/api` e `apps/web`                                                    |
| `npm run build`                                                          | Build de produção das duas partes                                                  |
| `python3 -I projeto/contexto_agente/fontes/test_gerar_fontes.py`         | Autoteste do gerador de fontes                                                     |
| `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar` | Nada de entrevistado nem link privado no que é público (precisa da pasta privada)  |

O CI (`.github/workflows/ci.yml`, job `verificar`) roda lint, formatação, tipos, testes e build em todo push na `main` e em toda PR. O `--verificar` não roda no CI, porque a tabela de nomes é privada: ele entra no checklist da PR.

## Regras de base

- oxlint com a categoria `correctness` como erro, `react/rules-of-hooks` e `jsx-a11y`.
- Prettier: aspas simples, sem ponto e vírgula (`.prettierrc.json`).
- Arquivos de até 350 linhas como referência do toolkit; acima disso, divida por responsabilidade.

## Estratégia de testes

- **Unitário (Vitest):** regras do domínio (nota, mapeamento eMAG, validação de URL) e rotas da API com `criarApp()`.
- **Interface (Vitest + Testing Library):** comportamento de componentes, com consultas por papel e rótulo, como o leitor de tela vê.
- **Leitor de tela (manual):** Orca + Firefox e NVDA; roteiro em `docs/design.md`.
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

## Dependências e entrega

- Dependência nova só com motivo e, até o Plano v1.1 (13/11), com aval do João.
- Antes de pedir merge: checklist de `.github/pull_request_template.md` e CI verde.
