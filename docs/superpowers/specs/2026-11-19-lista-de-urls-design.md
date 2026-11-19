# Lista de URLs (RF20) e Histórico de avaliações — design

Data: 19/11/2026 · Branch: `feat/lista-de-urls` · Pedido 3 do João (18/11, `docs/handoff.md`)

## Intenção

O João quer avaliar várias páginas de uma vez, na mesma aba, sem repetir o pedido página por página. O RF20 do Plano de Projeto v1.1 (`projeto/contexto_agente/fontes/projeto/Plano_de_Projeto.md`, linha 60) diz: "informar uma lista de URLs e analisá-las uma por vez, em fila, nunca ao mesmo tempo" (prioridade baixa, "se houver tempo"; o tempo existe).

## Decisões do João (19/11)

1. Um botão "+" na Tela 3 acrescenta outro campo de URL, até **10 links por envio**.
2. A regra "uma análise pendente por conta" **sai** do pedido de nova avaliação. Volta quando houver pagamento.
3. Cada link vira uma **avaliação separada**, com a Tela 4 e a Tela 5 que já existem. Não há nota do conjunto.
4. O limite de **10 análises por hora por conta** (RNF10) continua, e cada link conta como uma análise.
5. A fila de todas as contas passa de 10 para **30**, com **até 10 por conta**.
6. Se a lista não couber inteira (na hora ou na fila), **nada é criado** e a mensagem diz quantas cabem.
7. Depois de enviar 2 ou mais links, a pessoa vai para uma **lista das avaliações da conta**, que adianta a Tela 8 (Histórico, Passo 10). Com 1 link, segue para a Tela 4, como hoje.

## Abordagens consideradas

- **A · Lista da conta (escolhida).** Depois do envio, a tela de histórico mostra todas as avaliações da conta, da mais nova para a mais antiga, com o andamento ao vivo. Não muda o banco e adianta o Passo 10.
- **B · Envio com identificador próprio.** Coluna nova (`envioId`) e uma tela só do envio. Custa migração e rota, e o Histórico ficaria para depois.
- **C · Ids no endereço.** Não muda o banco, mas o acompanhamento se perde ao sair da página, e a tela perguntaria uma avaliação por vez.

## Não objetivos

- Nota ou relatório do conjunto de páginas.
- Varredura de várias páginas ao mesmo tempo (o Plano mantém fora).
- PDF e "Avaliar de novo" na Tela 8 (Passos 9 e 10).
- Paginação do histórico.

## Como fica

### API (`apps/api/src/rotas/avaliacoes.ts`)

- **`POST /api/avaliacoes`** recebe `{ urls: string[] }`, de 1 a 10.
  - Cada URL passa por `prepararUrl` e `classificarEndereco` (esta em paralelo, depois das recusas baratas). Erro de uma URL volta no campo dela: `campos: { "urls.2": "…" }`. URL repetida na lista também é erro no campo ("Este endereço já está na lista.").
  - Cada URL conta no limite de pedidos por conta e por IP (`tentativas.ts`): com 10 URLs num pedido só, o limite atual deixaria sondar 10 vezes mais endereços internos.
  - Recusa a lista inteira se `análises na última hora + N > 10` (429, "Você pode avaliar mais X páginas nesta hora.") ou se `fila + N > 30` (503, "Há muitas análises na fila agora. Tente de novo em alguns minutos.").
  - O teto de 10 por conta na fila vem de graça do limite de 10 por hora: uma conta não consegue ter mais de 10 pendentes. Não ganha conferência própria.
  - Sai a recusa "Você já tem uma análise em andamento". Fica a trava `criando` por conta (dois envios ao mesmo tempo da mesma conta poderiam passar juntos do limite por hora); a mensagem passa a ser "Seu envio anterior ainda está sendo processado."
  - `temAnaliseViva` continua, só para a exclusão da conta (`rotas/auth.ts`).
  - Cria as avaliações na ordem da lista e as põe na fila na mesma ordem. Responde 202 com `{ avaliacoes: [{ id }] }`.
- **`GET /api/avaliacoes`** (novo, Passo 10 adiantado): as avaliações da conta, da mais nova para a mais antiga, com `id`, `url`, `status`, `criadaEm`, `nota`, `etapa`, `posicaoNaFila` e `mensagemErro`. A pendente que morreu sem dono vira ERRO aqui também, com a mesma regra do `GET /:id` (extraída para uma função comum).
  - `shortcut:` sem paginação, só as 100 mais novas; paginar quando o histórico crescer.

### Tela 3 (`apps/web/src/paginas/NovaAvaliacao.tsx`)

```
Quais páginas você quer avaliar?

Endereço da página (URL)            [________________________]
Endereço da página 2 (URL)          [________________________] [Remover]
[+ Adicionar outra página]          2 de 10 páginas

(i) Até 10 páginas públicas por envio, analisadas uma por vez.
    Páginas que pedem login ainda não são avaliadas.

[Avaliar páginas]
```

- "+ Adicionar outra página" (botão secundário) acrescenta um campo e leva o foco para ele. Com 10, o botão some e aparece "Você chegou ao limite de 10 páginas."
- "Remover" (só nos campos 2 a 10) tira o campo e leva o foco ao campo anterior.
- O rótulo de cada campo é numerado a partir do segundo. O erro de cada campo aparece nele, e o foco vai ao primeiro com erro, como hoje.
- Com 1 campo, o título e o botão continuam "Qual página você quer avaliar?" e "Avaliar página".

### Tela 8 · Histórico de avaliações (`apps/web/src/paginas/Historico.tsx`, rota `/avaliacoes`)

O nome segue o protótipo (`projeto/docs/prototipo/prototipo_emagvalid.html`, Tela 8, "Histórico de avaliações"), no lugar do "Minhas avaliações" do esboço.

```
Histórico de avaliações                          [Nova avaliação]

Data         Página              Nota   Situação
19/11 15:02  gov.br/noticias      —     Na fila: 1 antes da sua
19/11 15:02  gov.br/servicos      —     Analisando (passo 2 de 3)
19/11 15:02  gov.br/contato       76    Concluída · Ver resultado
18/11 10:40  python.org           —     Não avaliada · Ver o motivo
```

- Pergunta à API a cada 2 s enquanto houver alguma pendente, e para quando não houver (como a Tela 4).
- "Ver resultado" e "Ver o motivo" levam a `/avaliacoes/:id` (Tela 5 ou Tela 4 com o erro).
- Leitor de tela: a tabela muda sem anunciar cada célula. Um `<output>` escondido diz o resumo só quando ele muda ("1 de 3 concluídas."), seguindo o ajuste de leitura de 19/11 (`docs/design.md`).
- Sem avaliações: "Você ainda não avaliou nenhuma página." e o botão "Nova avaliação".
- O cabeçalho ganha o link "Histórico" para quem entrou, ao lado de "Minha conta".

## Restrições

- eMAG 3.1/WCAG: teclado, foco visível, rótulos, alvos de 44 px, temas da barra e zoom de 200% (`AGENTS.md`).
- Endereços sempre pela proteção de SSRF que já existe (`prepararUrl`, `classificarEndereco`, `analisar`).
- Sem dependência nova. Sem migração.

## O que fica com quem implementa

- O texto exato das mensagens, seguindo o tom das atuais.
- Os nomes internos dos campos do formulário.

## Verificação

- Vitest da API: lista de 1 a 10; 11 recusa; erro por campo; repetida; limite por hora com N (recusa inteira e mensagem com quantas cabem); fila com N; cada URL conta no limite de pedidos; criação na ordem; sem a regra da pendente; `GET /api/avaliacoes` só da conta, ordem, morta vira ERRO.
- Vitest do front: "+" e "Remover" com o foco; limite de 10; erro no campo certo; 1 link vai para a Tela 4 e 2+ vão para o Histórico; o Histórico para de perguntar quando nada está pendente.
- E2E: Tela 3 com 3 links só pelo teclado e o Histórico com axe nos temas e no zoom de 200%.
- Manual: 3 links reais no ambiente local, acompanhando no Histórico.
- `/code-review` antes de dar como pronto.

## Documentos

`PRODUCT.md` (RF20 entra), `docs/architecture.md` (rotas e limites), `docs/design.md` (Tela 3 e Tela 8), `docs/passo-a-passo-mvp.md` (Passo 10 adiantado), `projeto/contexto_agente/07-pendencias-e-decisoes.md` (decisões de 19/11).
