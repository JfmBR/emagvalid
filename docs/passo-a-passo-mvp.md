# Passo a passo para construir o MVP

Guia para o João construir o AcessaWeb do zero até a publicação, seguindo o Plano de Projeto v1 oficial (05/11/2026). Escrito em 03/11/2026 e atualizado em 05/11/2026 com as decisões de 05/11 (`projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D).

Fontes (em `projeto/`):

- Plano: `docs/contexto_projeto/Plano de Projeto v1.docx` (texto literal em `contexto_agente/fontes/projeto/Plano_de_Projeto.md`)
- Requisitos: Plano de Projeto v1.1, texto em `contexto_agente/fontes/projeto/Plano_de_Projeto.md` (desde 11/11/2026; o rascunho v1.0 fica como histórico)
- Lista fechada do eMAG e nota: `docs/rascunhos/Cobertura_eMAG_axe-core.md`
- Telas: fluxo do protótipo beta, `docs/prototipo/beta/` (guia, desde 11/11/2026; visual do `design-system/`, e o que estiver fora do MVP não entra); telas que o beta não tem: `docs/rascunhos/Prototipo_30-10_telas_e_teste.md` e `docs/prototipo/prototipo_emagvalid.html`

## Como usar este guia

- Siga os passos **na ordem**. Cada passo termina com algo que funciona e que você consegue mostrar.
- Cada passo vira **um cartão no Trello** e **uma ou mais PRs** pequenas (uma tela ou uma regra por PR), numa branch curta (`feat/`, `fix/` ou `docs/`). A PR só entra com o CI verde; desde 10/11/2026 o merge é feito pelo João como administrador (a equipe não tem revisor), por squash.
- Em cada passo há um **pedido sugerido** para o Claude Code. Abra a sessão na pasta `projeto_integrador` (código e documentação no mesmo repositório).
- Marque `[x]` no que terminar e faça commit deste arquivo junto: assim ele mostra onde você está.
- **Pronto** (definição do Plano v1): funciona no ambiente publicado, outro integrante revisou, o Luis Otavio testou e, se for tela, passou no teste com teclado e leitor de tela.
- **Horas:** 10 h por semana suas; 3 h dos demais (Plano v1, Equipe). Passe ao grupo o que não é código.

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
   ├─ calcula a nota (pesos das verificações aprovadas ÷ aplicáveis)
   └─ grava falhas e nota no banco (status CONCLUIDA ou ERRO)
   ▲
Tela 4 pergunta a cada 2 s: GET /api/avaliacoes/:id
   ▼
Tela 5 mostra nota, conta e falhas → Tela 6 orientação (texto padrão + IA)
   → Tela 7 prévia e PDF → Tela 8 histórico
```

| Parte             | Onde fica no código                                 | Requisitos                     |
| ----------------- | --------------------------------------------------- | ------------------------------ |
| Conta e login     | `apps/api/src/rotas/auth.ts`, Telas 1 e 2           | RF01, RNF03, RNF04             |
| Análise da página | `apps/api/src/analise/`                             | RF02, RF03, RF04, RNF06        |
| Tabela eMAG       | `apps/api/src/emag/requisitos.ts`                   | RF04, RF08                     |
| Nota              | `apps/api/src/analise/nota.ts`                      | RF05, RF06                     |
| Orientações       | `apps/api/src/orientacoes/`                         | RF07, RF08, RF10, RF11         |
| PDF               | `apps/api/src/relatorio/`                           | RF12, RF13                     |
| Histórico         | `apps/api/src/rotas/avaliacoes.ts`, Tela 8          | RF14                           |
| Telas             | `apps/web/src/telas/` e `apps/web/src/componentes/` | RF09, RF16, RF17, RNF01, RNF02 |

## Calendário

| Semana                 | Passos        | Marco do programa                                                       |
| ---------------------- | ------------- | ----------------------------------------------------------------------- |
| 03–06/11               | 0, 1          | Plano de Projeto v1.0 (06/11)                                           |
| 09–13/11               | 2, 3, 4       | Plano v1.1 com arquitetura e tecnologias (13/11)                        |
| 16–20/11 (sprint 1)    | 5, 6          | Checkpoint na quinta 19/11 (20/11 é feriado)                            |
| 23–27/11 (sprint 2)    | 7, 8          | Primeira publicação com análise real                                    |
| 30/11–04/12 (sprint 3) | 9, 10, 11, 12 | **MVP em produção (04/12)**, Plano v1.2 e checklist de aceite           |
| 07–11/12               | 13            | Correções finais e entrega final (11/12); prévia do pitch (09 ou 10/12) |

Os passos 0 a 4 começam **antes** da construção oficial (16/11) de propósito: são as partes de maior risco (R4 do Plano v1: começar antes de 16/11 pela análise e pela publicação).

---

## Passo 0 · Preparar o ambiente (03–04/11)

Instalação detalhada, com os links de download: [`instalacao.md`](instalacao.md).

- [x] Instalar o [VS Code](https://code.visualstudio.com) e o Docker:
  - **Windows e Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)
  - **Linux (Debian 13):** `sudo apt install docker.io docker-compose` e depois `sudo usermod -aG docker $USER`; saia e entre de novo na sessão e teste com `docker run hello-world`
- [x] Instalar um leitor de tela para testar as telas:
  - **Windows:** [NVDA](https://www.nvaccess.org)
  - **Linux:** [Orca](https://orca.gnome.org), que já vem no GNOME (liga e desliga com `Super+Alt+S`). Se não estiver instalado: `sudo apt install orca`. Teste no Firefox, que é o navegador que funciona melhor com o Orca
- [x] Rodar o projeto: `npm install`, `cp .env.example .env`, `npm run db:up`, `npm run db:migrate -w apps/api`, `npm run dev`
- [x] Abrir http://localhost:5173 e ver "API conectada."
- [x] Baixar o navegador do Playwright: `npx playwright install chromium` (no Linux, `npx playwright install --with-deps chromium`)
- [ ] Fazer o "Quick Start" e o "Tutorial: Tic-Tac-Toe" de [react.dev](https://react.dev/learn)
- [ ] Convidar o Luiz Felipe e o Luis Otavio para o repositório no GitHub, se forem contribuir pelo GitHub. Desde 10/11/2026 a equipe é João, Luiz Felipe e Luis Otavio, e o João faz o merge das PRs como administrador (`projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D).
- [ ] Combinar com o grupo a dependência `concurrently`, que entrou na PR #1 sem ser combinada (mesma seção)

**Terminou quando:** o projeto roda no seu computador com o banco ligado.

> Pedido sugerido: _"Me explique, arquivo por arquivo, o que existe em apps/web e apps/api e como um pedido sai da tela e chega na API."_

## Passo 1 · Provar a análise (05–08/11) — o passo mais importante

É o coração do produto e o maior risco (R1 do Plano). Antes de qualquer tela, prove que dá para analisar uma página.

- [x] Criar `apps/api/src/analise/analisar.ts`: abre a URL com Playwright, roda o axe-core e devolve as violações
- [x] Criar um script `npm run analisar -- <url>` (`npm run analisar -w apps/api -- <url>`) que imprime o resultado no terminal
- [ ] Testar em 3 a 5 páginas públicas reais (inclusive uma do governo). Em 12/11: funcionou em example.com e na página de demonstração do W3C (28 s); `gov.br`, `planalto.gov.br` (a página navega depois de abrir, o axe perde o contexto), `python.org` e o site do eMAG estouraram os 30 s ou falharam, com a rede lenta neste computador (`curl` no `gov.br` leva 11 s). Falta: tratar a espera (`waitUntil`) e o redirecionamento, e repetir numa rede boa
- [x] Montar a **tabela de requisitos** em `apps/api/src/emag/requisitos.ts` a partir de `projeto/docs/rascunhos/Cobertura_eMAG_axe-core.md`: as 29 recomendações do eMAG 3.1 que o axe-core cobre no todo ou em parte, cada uma com número, nome oficial, seção, link para a seção oficial, regras do axe-core e prioridade (peso 3, 2 ou 1). Essa tabela é a "lista fechada" do RF08; as recomendações sem cobertura vão para a revisão humana (RF09)
- [ ] Conferir o mapeamento e os pesos com o mentor José Alves e os nomes de 6.5 a 6.8 no PDF oficial do eMAG (`07`, seções B e E)

**Terminou quando:** o script mostra, para uma URL real, as falhas já com o número e o nome do requisito do eMAG.

> Pedido sugerido: _"Crie apps/api/src/analise/analisar.ts usando Playwright e @axe-core/playwright para analisar uma URL, e um script npm para rodar pelo terminal. Explique cada parte."_
> Depois: _"Monte a tabela que liga as regras do axe-core aos requisitos do eMAG 3.1 que elas cobrem. Use o texto oficial do eMAG e me mostre onde houver dúvida."_

## Passo 2 · Fechar as decisões para o Plano v1.1 (09–11/11)

O Plano v1.1 (13/11) pede arquitetura e tecnologias. No Plano v1 (Marcos de Entrega), o responsável pela v1.1 era o Matheus, que saiu da equipe (10/11/2026); o novo responsável não consta nos arquivos. Passe ao responsável o que o código decidir e leve ao mentor (Rodrigo Pereira) e ao arquiteto (Fábio Rezente).

Já decidido em 05/11 (Plano v1, Arquitetura e tecnologias e legenda dos requisitos):

- [x] **Cálculo da nota:** 100 × pesos das verificações aprovadas ÷ pesos das verificações aplicáveis, com peso alta 3, média 2 e baixa 1, nas 29 recomendações da lista fechada
- [x] **IA:** Google Gemini, plano gratuito (afeta RF07, RF08 e RNF05)
- [x] **Hospedagem:** Render (plano gratuito) para telas e API e PostgreSQL no Neon (plano gratuito)

Ainda a fechar:

- [ ] **Esquema do banco:** revisar `apps/api/prisma/schema.prisma` com o que o Passo 1 mostrou
- [ ] Bibliotecas novas que vão ser precisas (ver sugestões), combinadas com o grupo
- [ ] Ferramentas de apoio, que não vão para o produto: `concurrently` (sobe API e front-end juntos com `npm run dev`) e DBeaver Community (ver e testar os dados do banco, local e na nuvem)

**Terminou quando:** o responsável pelo Plano v1.1 tem o que precisa para a seção "Arquitetura e tecnologias" do Plano v1.1.

## Passo 3 · Publicar o esqueleto (11–13/11)

Publicar cedo evita a surpresa de descobrir na última semana que algo não roda no servidor (R7).

- [ ] Criar um `Dockerfile` que monta a API, inclui o Chromium e serve o front-end pronto
- [ ] Criar o banco no Neon e configurar `DATABASE_URL` no Render
- [ ] Conectar o DBeaver ao banco da nuvem e conferir que as tabelas foram criadas. Os dados de conexão ficam no painel do provedor; a senha não entra no repositório
- [ ] Publicar e abrir o endereço público: deve aparecer "API conectada."
- [ ] Rodar o script do Passo 1 **no servidor** para ver se o Chromium funciona lá
- [ ] Medir os limites do plano gratuito (R7 do Plano v1): o Chromium cabe na memória do Render? Quanto tempo o serviço leva para acordar depois de hibernar? Some isso aos 60 s do RNF06

**Terminou quando:** o esqueleto está num endereço público e a análise roda no servidor dentro dos limites do plano gratuito.

> Pedido sugerido: _"Prepare o projeto para publicar no Render (plano gratuito) com o banco no Neon: Dockerfile com Chromium, API servindo o build do front-end e migrações do Prisma na publicação. Me guie nos painéis."_

## Passo 4 · Base das telas (12–13/11)

- [ ] Instalar as rotas de página (sugestão: React Router) para as 8 telas
- [ ] Criar os componentes do protótipo em `apps/web/src/componentes/`: `Botao` (primário e secundário, 44 px), `Campo` (rótulo visível, ajuda e erro), `Selo` (prioridade e origem, com texto e cor), `Aviso`, `Layout` (cabeçalho, "Pular para o conteúdo", `main`)
- [ ] Copiar cores e tipografia do protótipo para `index.css`
- [ ] Testar cada componente com teclado e leitor de tela (NVDA no Windows, Orca no Linux)

**Terminou quando:** os componentes estão prontos e iguais aos do protótipo.

> Pedido sugerido: _"Crie os componentes Botao, Campo, Selo, Aviso e Layout seguindo o protótipo em projeto/docs/prototipo/prototipo_emagvalid.html, acessíveis pelo eMAG 3.1, com um teste para cada."_

## Passo 5 · Conta e login — Telas 1 e 2 (16–18/11)

Requisitos: RF01, RF09 (aviso da Tela 1), RNF03, RNF04, RNF05.

- [ ] API: `POST /api/auth/cadastro`, `POST /api/auth/entrar`, `POST /api/auth/sair`, `GET /api/auth/eu`
- [ ] Senha com hash (o `crypto.scrypt` do próprio Node basta); sessão em cookie `httpOnly`
- [ ] Rotas de avaliação só para quem entrou
- [ ] Tela 1 · Inicial: os dois blocos ("O que o AcessaWeb faz" e "O que continua com você") e o aviso fixo
- [ ] Tela 2 · Cadastro e login: 3 campos, "mostrar senha", regra de 8 caracteres, mensagens de erro do protótipo
- [ ] Página curta de privacidade: que dados guardamos e o que vai para a IA (RNF05: só o trecho da página pública com a falha, sem dado do usuário)
- [ ] Conectar o DBeaver ao banco local (ver `README.md`, "Como rodar") e conferir em `usuarios` que a conta foi gravada com a senha em hash, nunca em texto

**Terminou quando:** dá para criar conta, sair e entrar de novo, só com teclado.

## Passo 6 · Nova avaliação e análise — Telas 3 e 4 (18–20/11)

Requisitos: RF02, RF03, RF04, RF17, RNF06. **Checkpoint 19/11.**

- [ ] API: `POST /api/avaliacoes` valida a URL, cria a avaliação e dispara a análise do Passo 1 em segundo plano
- [ ] API: `GET /api/avaliacoes/:id` devolve o status e, quando pronta, as falhas
- [ ] Gravar as falhas com requisito, seletor, trecho e prioridade
- [ ] Tela 3: campo da URL com exemplo e ajuda curta ("Uma página pública por vez…")
- [ ] Tela 4: progresso em 3 passos, perguntando à API a cada 2 s; 4b (URL inválida) e 4c (demorou demais)
- [ ] Tempo máximo da análise: 60 s por página, já com as orientações (RNF06)
- [ ] Conferir no DBeaver as linhas de `avaliacoes` e `falhas` de uma análise real

**Terminou quando:** você digita uma URL real e as falhas ficam salvas no banco.

## Passo 7 · Nota e resultado — Tela 5 (23–25/11)

Requisitos: RF04, RF05, RF06, RF09.

- [ ] `apps/api/src/analise/nota.ts` com a fórmula decidida (Passo 2), com testes
- [ ] Tela 5: nota, aviso "não é certificação", "Como chegamos a [nota]" (tabela por seção que abre e fecha), abas "Falhas automáticas" e "Revisão humana", cartões por requisito ordenados por prioridade
- [ ] Lista de revisão humana fixa por requisito (o que a máquina não consegue julgar), com caixas de marcar
- [ ] **Publicar** (primeira publicação do Plano, semana de 23/11)

**Terminou quando:** no endereço público, uma URL real mostra a nota com a conta e as falhas.

## Passo 8 · Orientações de correção — Tela 6 (25–27/11)

Requisitos: RF07, RF08, RF10, RF11.

- [ ] **Primeiro o texto padrão:** em `requisitos.ts`, para cada requisito, um "por que é falha" e um exemplo de correção escritos pelo grupo. Isso já funciona sem IA (contingência do R5)
- [ ] **Depois a IA (Google Gemini):** `apps/api/src/orientacoes/ia.ts` manda ao Gemini a falha, o trecho e o requisito da lista fechada, e pede a resposta em formato fixo (JSON). Se a IA citar requisito fora da lista, descartar e usar o texto padrão
- [ ] Mandar à IA só o trecho da página pública com a falha, sem dado do usuário, e dizer isso na Tela 6 (RNF05)
- [ ] Guardar as orientações já geradas para não chamar o Gemini de novo pela mesma falha: o plano gratuito limita as chamadas (R7)
- [ ] Chave da IA só no `.env` e no Render; nunca no código
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

Requisitos: RF14. O RF15 (comparar duas avaliações da mesma URL) tem prioridade baixa e está fora do MVP desde 05/11.

- [ ] API: `GET /api/avaliacoes` lista as avaliações do usuário, da mais nova para a mais antiga
- [ ] Tela 8: tabela com data, página, nota e as ações Abrir, Baixar PDF e Avaliar de novo

## Passo 11 · Ajuda e mensagens de erro (02/12)

Requisitos: RF16, RF17.

- [ ] Ajuda curta nas telas 3, 5 e 6, com exemplo
- [ ] Revisar todas as mensagens de erro: dizem o que houve e o próximo passo
- [ ] Página de erro para endereço inexistente

## Passo 12 · Testes, acessibilidade e publicação do MVP (02–04/12)

Requisitos: RNF01, RNF02, RNF07, RNF08, RNF09. **MVP em produção em 04/12.**

- [ ] Passar o próprio AcessaWeb em todas as telas dele (a ferramenta não pode ser inacessível)
- [ ] Testar o fluxo nos navegadores atuais de computador: Chrome, Firefox e Edge (RNF09)
- [ ] Teste completo com teclado e leitor de tela, tela por tela (NVDA no Windows, Orca no Linux). Se o desenvolvimento for só no Linux, faça ao menos uma rodada com o NVDA num Windows antes de 04/12: os leitores leem a mesma página de jeitos diferentes, e o NVDA é o que a persona usa
- [ ] Luis Otavio: testes do fluxo e checklist de aceite; teste de usabilidade com uma pessoa de fora do grupo
- [ ] Publicar a versão final e conferir o fluxo inteiro no endereço público
- [ ] README atualizado (como rodar, como publicar, limites conhecidos)

**Terminou quando:** o fluxo 1 → 8 funciona no endereço público e o checklist de aceite está cumprido.

## Passo 13 · Correções e entrega final (07–11/12)

- [ ] Corrigir o que os testes e a prévia do pitch apontarem
- [ ] Gravar o vídeo de 1 minuto da demonstração, o plano B do pitch se o link ou o equipamento falhar (cartão "Plano B da demo em vídeo" no Trello)
- [ ] Registrar as lições aprendidas (anote na retrospectiva de cada sexta; entram na versão final do Plano, 11/12)

---

## Se atrasar: o que cortar primeiro

Dos riscos R2 e R4 do Plano v1: a prioridade baixa (RF15, RF18, RF19) já está fora do MVP. Se faltar tempo, cortar primeiro **RF11** (editar orientação) e **RF16** (ajuda na tela), e qualquer requisito de prioridade média só com o aval do mentor. Nunca cortar a publicação nem a LGPD (RNF05). Se a IA travar ou estourar o limite do plano gratuito, o texto padrão do Passo 8 segura o RF07.

## Sugestões de melhoria

Decididas em 05/11 (Plano v1): começar antes de 16/11 pela análise e pela publicação (R4); nota com pesos 3, 2 e 1 nas 29 recomendações da lista fechada; hospedagem no Render com o banco no Neon; suas horas em 10 h por semana e as dos demais em 3 h. Continuam como sugestão:

1. **Texto padrão antes da IA.** O MVP funciona mesmo que a IA atrase ou fique cara, e a IA só melhora um texto que já existe (R5).
2. **Docker no Render.** O Playwright precisa do Chromium no servidor, por isso a publicação usa um `Dockerfile` (Passo 3) e não uma hospedagem só de "funções" (serverless).
3. **PDF com o Playwright**, que já está instalado, em vez de outra biblioteca.
4. **Bibliotecas novas a aprovar** (a regra do `CLAUDE.md` pede para perguntar): React Router (rotas das telas), o SDK do Google Gemini e, opcionalmente, Zod (validar o que chega na API).
5. **Análise sem fila.** Rodar a análise em segundo plano no próprio processo da API e a tela perguntar o status a cada 2 s. Fila de tarefas é complexidade que o MVP não precisa.
6. **Dividir o que não é código.** Luis Otavio nos testes e Luiz Felipe nos textos padrão por requisito (equipe atual desde 10/11/2026: João, Luiz Felipe e Luis Otavio).
