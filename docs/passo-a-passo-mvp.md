# Passo a passo para construir o MVP

Guia para o João construir o emagvalid do zero até a publicação, seguindo o Plano de Projeto v1.0 (rascunho de 01/11/2026). Escrito em 03/11/2026.

Fontes (em `../emagvalid-docs/`):

- Plano: `docs/rascunhos/Plano_de_Projeto_v1.0_rascunho.md`
- Requisitos: `docs/rascunhos/Requisitos_Plano_de_Projeto_v1.0.md`
- Telas: `docs/rascunhos/Prototipo_30-10_telas_e_teste.md` e `docs/prototipo/prototipo_emagvalid.html`

## Como usar este guia

- Siga os passos **na ordem**. Cada passo termina com algo que funciona e que você consegue mostrar.
- Cada passo vira **um cartão no Trello** e **uma ou mais PRs** pequenas (uma tela ou uma regra por PR).
- Em cada passo há um **pedido sugerido** para o Claude Code. Abra a sessão na pasta `emagvalid`, com `emagvalid-docs` adicionada.
- Marque `[x]` no que terminar e faça commit deste arquivo junto: assim ele mostra onde você está.
- **Pronto** (definição do Plano, proposta): funciona no ambiente publicado, alguém revisou, o Luis Otavio testou e, se for tela, passou no teste com teclado e leitor de tela.

## Como o MVP funciona (visão geral)

```
Tela 3: auditor(a) digita a URL
   │  POST /api/avaliacoes
   ▼
API cria a avaliação (status ANALISANDO) e responde na hora
   │  em segundo plano:
   ├─ Playwright abre a página no Chromium
   ├─ axe-core verifica e devolve as violações
   ├─ tabela "regra do axe → requisito do eMAG" traduz cada violação
   ├─ calcula a nota por seção do eMAG
   └─ grava falhas e nota no banco (status CONCLUIDA ou ERRO)
   ▲
Tela 4 pergunta a cada 2 s: GET /api/avaliacoes/:id
   ▼
Tela 5 mostra nota, conta e falhas → Tela 6 orientação (texto padrão + IA)
   → Tela 7 prévia e PDF → Tela 8 histórico
```

| Parte                  | Onde fica no código                                 | Requisitos                     |
| ---------------------- | --------------------------------------------------- | ------------------------------ |
| Conta e login          | `apps/api/src/rotas/auth.ts`, Telas 1 e 2           | RF01, RNF03, RNF04             |
| Análise da página      | `apps/api/src/analise/`                             | RF02, RF03, RF04, RNF06        |
| Tabela eMAG            | `apps/api/src/emag/requisitos.ts`                   | RF04, RF08                     |
| Nota                   | `apps/api/src/analise/nota.ts`                      | RF05, RF06                     |
| Orientações            | `apps/api/src/orientacoes/`                         | RF07, RF08, RF10, RF11         |
| PDF                    | `apps/api/src/relatorio/`                           | RF12, RF13                     |
| Histórico e comparação | `apps/api/src/rotas/avaliacoes.ts`, Tela 8          | RF14, RF15                     |
| Telas                  | `apps/web/src/telas/` e `apps/web/src/componentes/` | RF09, RF16, RF17, RNF01, RNF02 |

## Calendário

| Semana                 | Passos        | Marco do programa                                                       |
| ---------------------- | ------------- | ----------------------------------------------------------------------- |
| 03–06/11               | 0, 1          | Plano de Projeto v1.0 (06/11)                                           |
| 09–13/11               | 2, 3, 4       | Plano v1.1 com arquitetura e tecnologias (13/11)                        |
| 16–20/11 (sprint 1)    | 5, 6          | Checkpoint na quinta 19/11 (20/11 é feriado)                            |
| 23–27/11 (sprint 2)    | 7, 8          | Primeira publicação com análise real                                    |
| 30/11–04/12 (sprint 3) | 9, 10, 11, 12 | **MVP em produção (04/12)**, Plano v1.2 e checklist de aceite           |
| 07–11/12               | 13            | Correções finais e entrega final (11/12); prévia do pitch (09 ou 10/12) |

Os passos 0 a 4 começam **antes** da construção oficial (16/11) de propósito: são as partes de maior risco (ver "Sugestões" no fim).

---

## Passo 0 · Preparar o ambiente (03–04/11)

- [x] Instalar o [VS Code](https://code.visualstudio.com) e o Docker:
  - **Windows e Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - **Linux (Debian 13):** `sudo apt install docker.io docker-compose` e depois `sudo usermod -aG docker $USER`; saia e entre de novo na sessão e teste com `docker run hello-world`
- [x] Instalar um leitor de tela para testar as telas:
  - **Windows:** [NVDA](https://www.nvaccess.org)
  - **Linux:** [Orca](https://orca.gnome.org), que já vem no GNOME (liga e desliga com `Super+Alt+S`). Se não estiver instalado: `sudo apt install orca`. Teste no Firefox, que é o navegador que funciona melhor com o Orca
- [x] Rodar o projeto: `npm install`, `cp .env.example .env`, `npm run db:up`, `npm run db:migrate -w apps/api`, `npm run dev`
- [x] Abrir http://localhost:5173 e ver "API conectada."
- [x] Baixar o navegador do Playwright: `npx playwright install chromium`
- [ ] Fazer o "Quick Start" e o "Tutorial: Tic-Tac-Toe" de [react.dev](https://react.dev/learn)

**Terminou quando:** o projeto roda no seu computador com o banco ligado.

> Pedido sugerido: _"Me explique, arquivo por arquivo, o que existe em apps/web e apps/api e como um pedido sai da tela e chega na API."_

## Passo 1 · Provar a análise (05–08/11) — o passo mais importante

É o coração do produto e o maior risco (R1 do Plano). Antes de qualquer tela, prove que dá para analisar uma página.

- [ ] Criar `apps/api/src/analise/analisar.ts`: abre a URL com Playwright, roda o axe-core e devolve as violações
- [ ] Criar um script `npm run analisar -- <url>` que imprime o resultado no terminal
- [ ] Testar em 3 a 5 páginas públicas reais (inclusive uma do governo)
- [ ] Montar a **tabela de requisitos** em `apps/api/src/emag/requisitos.ts`: para cada requisito do eMAG 3.1 que o MVP cobre, o número, o nome oficial, a seção, o link para o texto oficial e as regras do axe-core que o verificam. Essa tabela é a "lista fechada" do RF08
- [ ] Anotar quantos requisitos do eMAG o MVP cobre (decisão 7 dos requisitos)

**Terminou quando:** o script mostra, para uma URL real, as falhas já com o número e o nome do requisito do eMAG.

> Pedido sugerido: _"Crie apps/api/src/analise/analisar.ts usando Playwright e @axe-core/playwright para analisar uma URL, e um script npm para rodar pelo terminal. Explique cada parte."_
> Depois: _"Monte a tabela que liga as regras do axe-core aos requisitos do eMAG 3.1 que elas cobrem. Use o texto oficial do eMAG e me mostre onde houver dúvida."_

## Passo 2 · Fechar as decisões para o Plano v1.1 (09–11/11)

O Plano v1.1 (13/11) pede arquitetura e tecnologias. Leve estas decisões ao mentor (Rodrigo Pereira) e ao arquiteto (Fábio Rezente):

- [ ] **Cálculo da nota:** sugestão no fim deste guia
- [ ] **Fornecedor de IA** e quanto custa (afeta RF07, RF08 e RNF05)
- [ ] **Hospedagem:** precisa rodar o Chromium do Playwright (ver sugestões)
- [ ] **Esquema do banco:** revisar `apps/api/prisma/schema.prisma` com o que o Passo 1 mostrou
- [ ] Bibliotecas novas que vão ser precisas (ver sugestões)

**Terminou quando:** as decisões estão escritas na seção "Arquitetura e tecnologias" do Plano v1.1.

## Passo 3 · Publicar o esqueleto (11–13/11)

Publicar cedo evita a surpresa de descobrir na última semana que algo não roda no servidor (R7).

- [ ] Criar um `Dockerfile` que monta a API, inclui o Chromium e serve o front-end pronto
- [ ] Criar o banco na nuvem e configurar `DATABASE_URL` na hospedagem
- [ ] Publicar e abrir o endereço público: deve aparecer "API conectada."
- [ ] Rodar o script do Passo 1 **no servidor** para ver se o Chromium funciona lá

**Terminou quando:** o esqueleto está num endereço público e a análise roda no servidor.

> Pedido sugerido: _"Prepare o projeto para publicar em [hospedagem escolhida]: Dockerfile com Chromium, API servindo o build do front-end e migrações do Prisma na publicação. Me guie no painel da hospedagem."_

## Passo 4 · Base das telas (12–13/11)

- [ ] Instalar as rotas de página (sugestão: React Router) para as 8 telas
- [ ] Criar os componentes do protótipo em `apps/web/src/componentes/`: `Botao` (primário e secundário, 44 px), `Campo` (rótulo visível, ajuda e erro), `Selo` (prioridade e origem, com texto e cor), `Aviso`, `Layout` (cabeçalho, "Pular para o conteúdo", `main`)
- [ ] Copiar cores e tipografia do protótipo para `index.css`
- [ ] Testar cada componente com teclado e leitor de tela (NVDA no Windows, Orca no Linux)

**Terminou quando:** os componentes estão prontos e iguais aos do protótipo.

> Pedido sugerido: _"Crie os componentes Botao, Campo, Selo, Aviso e Layout seguindo o protótipo em ../emagvalid-docs/docs/prototipo/prototipo_emagvalid.html, acessíveis pelo eMAG 3.1, com um teste para cada."_

## Passo 5 · Conta e login — Telas 1 e 2 (16–18/11)

Requisitos: RF01, RF09 (aviso da Tela 1), RNF03, RNF04, RNF05.

- [ ] API: `POST /api/auth/cadastro`, `POST /api/auth/entrar`, `POST /api/auth/sair`, `GET /api/auth/eu`
- [ ] Senha com hash (o `crypto.scrypt` do próprio Node basta); sessão em cookie `httpOnly`
- [ ] Rotas de avaliação só para quem entrou
- [ ] Tela 1 · Inicial: os dois blocos ("O que o emagvalid faz" e "O que continua com você") e o aviso fixo
- [ ] Tela 2 · Cadastro e login: 3 campos, "mostrar senha", regra de 8 caracteres, mensagens de erro do protótipo
- [ ] Página curta de privacidade: que dados guardamos e o que vai para a IA (RNF05)

**Terminou quando:** dá para criar conta, sair e entrar de novo, só com teclado.

## Passo 6 · Nova avaliação e análise — Telas 3 e 4 (18–20/11)

Requisitos: RF02, RF03, RF04, RF17, RNF06. **Checkpoint 19/11.**

- [ ] API: `POST /api/avaliacoes` valida a URL, cria a avaliação e dispara a análise do Passo 1 em segundo plano
- [ ] API: `GET /api/avaliacoes/:id` devolve o status e, quando pronta, as falhas
- [ ] Gravar as falhas com requisito, seletor, trecho e prioridade
- [ ] Tela 3: campo da URL com exemplo e ajuda curta ("Uma página pública por vez…")
- [ ] Tela 4: progresso em 3 passos, perguntando à API a cada 2 s; 4b (URL inválida) e 4c (demorou demais)
- [ ] Tempo máximo da análise (sugestão: 60 s) para não travar

**Terminou quando:** você digita uma URL real e as falhas ficam salvas no banco.

## Passo 7 · Nota e resultado — Tela 5 (23–25/11)

Requisitos: RF04, RF05, RF06, RF09.

- [ ] `apps/api/src/analise/nota.ts` com a fórmula decidida no Passo 2, com testes
- [ ] Tela 5: nota, aviso "não é certificação", "Como chegamos a [nota]" (tabela por seção que abre e fecha), abas "Falhas automáticas" e "Revisão humana", cartões por requisito ordenados por prioridade
- [ ] Lista de revisão humana fixa por requisito (o que a máquina não consegue julgar), com caixas de marcar
- [ ] **Publicar** (primeira publicação do Plano, semana de 23/11)

**Terminou quando:** no endereço público, uma URL real mostra a nota com a conta e as falhas.

## Passo 8 · Orientações de correção — Tela 6 (25–27/11)

Requisitos: RF07, RF08, RF10, RF11.

- [ ] **Primeiro o texto padrão:** em `requisitos.ts`, para cada requisito, um "por que é falha" e um exemplo de correção escritos pelo grupo. Isso já funciona sem IA (contingência do R5)
- [ ] **Depois a IA:** `apps/api/src/orientacoes/ia.ts` manda à IA a falha, o trecho e o requisito da lista fechada, e pede a resposta em formato fixo (JSON). Se a IA citar requisito fora da lista, descartar e usar o texto padrão
- [ ] Chave da IA só no `.env` e na hospedagem; nunca no código
- [ ] Tela 6: requisito com link oficial, ocorrência com local e trecho, bloco "Sugestão da IA — revise antes de usar", botões Aprovar, Editar e Descartar, navegação entre falhas
- [ ] Gravar `orientacaoFinal` e `orientacaoAprovada`

**Terminou quando:** dá para aprovar ou editar todas as orientações de uma avaliação.

## Passo 9 · Relatório em PDF — Tela 7 (30/11–01/12)

Requisitos: RF12, RF13.

- [ ] Montar o relatório como uma página HTML e gerar o PDF com o próprio Playwright (`page.pdf()`), sem biblioteca nova
- [ ] Conteúdo: capa (cliente e URL), resumo no início, tabela de falhas (requisito, prioridade, local, correção), seção "Revisão humana", rodapé com o nome do(a) auditor(a)
- [ ] Tela 7: prévia, aviso se faltar revisão ("Revisar agora" · "Gerar mesmo assim"), "Baixar PDF"

**Terminou quando:** o PDF baixado tem tudo o que o RF13 pede.

## Passo 10 · Histórico — Tela 8 (01–02/12)

Requisitos: RF14 (e RF15, se der tempo).

- [ ] API: `GET /api/avaliacoes` lista as avaliações do usuário, da mais nova para a mais antiga
- [ ] Tela 8: tabela com data, página, nota e as ações Abrir, Baixar PDF e Avaliar de novo
- [ ] RF15 (prioridade média): comparar duas avaliações da mesma URL — só se os passos anteriores estiverem prontos (ver divergência no fim)

## Passo 11 · Ajuda e mensagens de erro (02/12)

Requisitos: RF16, RF17.

- [ ] Ajuda curta nas telas 3, 5 e 6, com exemplo
- [ ] Revisar todas as mensagens de erro: dizem o que houve e o próximo passo
- [ ] Página de erro para endereço inexistente

## Passo 12 · Testes, acessibilidade e publicação do MVP (02–04/12)

Requisitos: RNF01, RNF02, RNF07, RNF08. **MVP em produção em 04/12.**

- [ ] Passar o próprio emagvalid em todas as telas dele (a ferramenta não pode ser inacessível)
- [ ] Teste completo com teclado e leitor de tela, tela por tela (NVDA no Windows, Orca no Linux). Se o desenvolvimento for só no Linux, faça ao menos uma rodada com o NVDA num Windows antes de 04/12: os leitores leem a mesma página de jeitos diferentes, e o NVDA é o que a persona usa
- [ ] Luis Otavio: testes do fluxo e checklist de aceite; teste de usabilidade com uma pessoa de fora do grupo
- [ ] Publicar a versão final e conferir o fluxo inteiro no endereço público
- [ ] README atualizado (como rodar, como publicar, limites conhecidos)

**Terminou quando:** o fluxo 1 → 8 funciona no endereço público e o checklist de aceite está cumprido.

## Passo 13 · Correções e entrega final (07–11/12)

- [ ] Corrigir o que os testes e a prévia do pitch apontarem
- [ ] Registrar as lições aprendidas
- [ ] Tornar o repositório público, se o programa pedir o código-fonte aberto

---

## Se atrasar: o que cortar primeiro

Do risco R2 do Plano: cortar primeiro **RF15** (comparação), **RF11** (editar orientação) e **RF16** (ajuda na tela). Nunca cortar a publicação nem a LGPD (RNF05). Se a IA travar, o texto padrão do Passo 8 segura o RF07.

## Sugestões de melhoria (para conversarmos)

1. **Começar já, não em 16/11.** A análise (Passo 1) e a publicação (Passo 3) são as partes que mais podem dar errado. Descobrir isso em novembro dá tempo de reagir.
2. **Fórmula da nota:** usar a do protótipo — verificações aprovadas ÷ verificações feitas, por seção do eMAG, com o total geral. O axe-core já informa o que passou e o que falhou, então a conta sai direto e é fácil de explicar (RF06).
3. **Texto padrão antes da IA.** O MVP funciona mesmo que a IA atrase ou fique cara, e a IA só melhora um texto que já existe (R5).
4. **Hospedagem que rode Docker.** O Playwright precisa do Chromium no servidor; hospedagens só de "funções" (serverless) costumam não servir. Opções a conferir no Passo 2: Render, Railway ou Fly.io, com banco gerenciado (do próprio provedor ou Neon). Confirmar os planos gratuitos antes de escolher.
5. **PDF com o Playwright**, que já está instalado, em vez de outra biblioteca.
6. **Bibliotecas novas a aprovar** (a regra do `CLAUDE.md` pede para perguntar): React Router (rotas das telas) e, opcionalmente, Zod (validar o que chega na API). O SDK do fornecedor de IA entra quando ele for escolhido.
7. **Análise sem fila.** Rodar a análise em segundo plano no próprio processo da API e a tela perguntar o status a cada 2 s. Fila de tarefas é complexidade que o MVP não precisa.
8. **Horas reais.** Construir tudo sozinho não cabe nas 2 h por semana do TAP. Vale definir suas horas e pedir ao grupo o que não é código: Luis Otavio nos testes, Luiz Felipe nos textos padrão por requisito, Leandro na documentação, Matheus na revisão das PRs.

## Divergência para resolver

- **RF15 (comparação entre avaliações):** o Plano coloca no MVP (`docs/rascunhos/Plano_de_Projeto_v1.0_rascunho.md`, "Objetivos e escopo", linha 35), mas o protótipo diz que está fora do TAP e não desenha o botão (`docs/rascunhos/Prototipo_30-10_telas_e_teste.md`, "Tela 8 · Histórico", linha 128). Este guia trata o RF15 como opcional até a decisão.
