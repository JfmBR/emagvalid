# Relatório em PDF (Passo 9) — design

**Data:** 19/11/2026 · **Branch:** `feat/relatorio-pdf` · **Requisitos:** RF12, RF13, RF21 (Plano de Projeto v1.1) · **Decisões anteriores:** `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D, 19/11

## Para que serve

A dona do site (persona do Plano v1.1, cliente leiga) baixa o PDF para **entregar à equipe que vai corrigir** o site ou para **guardar como registro** da avaliação (João, 19/11). Por isso o PDF precisa se explicar sozinho, sem a tela:

- para a equipe: cada falha com o local exato, o trecho de código, o porquê e o exemplo de correção;
- para quem guarda: a página, a data, a nota, como a nota foi calculada e o que ainda falta conferir à mão.

## Objetivos

- Gerar o PDF de uma avaliação concluída com o conteúdo abaixo (RF12, RF13).
- Botão "Baixar PDF" na Tela 5 e em cada linha da Tela 8 (Histórico).
- Contas sem plano pago veem o botão bloqueado, com o aviso do RF21.

## Fora do escopo

- **Tela 7 (prévia):** não existe (decisão do João, 19/11, opção A). O aviso da revisão pendente fica ao lado do botão na Tela 5.
- Orientações da IA (Passo 8): por enquanto, a correção vem do texto padrão (`apps/api/src/emag/textos.ts`). Quando o Passo 8 entrar, ele troca essa fonte.
- Guardar o PDF no banco ou em disco, cobrança, exportação CSV (RF18).
- Automatizar itens da revisão humana: fica como pendência (decisão do João, 19/11, opção C da conversa sobre a revisão).

## Anti-objetivos (falha mesmo se "funcionar")

- O PDF parecer laudo ou certificação. Ele não leva nome de auditor nem a frase "conclusão de conformidade".
- Código da página avaliada rodar no Chromium do PDF, ou o Chromium buscar algo na rede.
- Uma conta baixar o PDF da avaliação de outra conta.
- Um PDF inacessível: a ferramenta é de acessibilidade, e o próprio eMAG 3.8 pede documento em formato acessível.

## Conteúdo do PDF (aprovado pelo João no rascunho, 19/11)

Na ordem:

1. **Cabeçalho:** "AcessaWeb · Relatório de acessibilidade · eMAG 3.1"; a página avaliada (`urlFinal` ou, sem ela, `url`); a data e a hora da avaliação (horário de Brasília); "Preparado para: <nome da conta>".
2. **Aviso:** "Esta nota é automática e não é certificação. Parte do eMAG só uma pessoa confere (seção "Revisão humana")." (RF09, RNF07).
3. **Resumo:** nota de 0 a 100; quantas falhas, em quantas recomendações, por prioridade; quantos itens da revisão humana foram conferidos, do total.
4. **Falhas, da mais urgente para a menos:** uma caixa por recomendação reprovada, na mesma ordem dos cartões da Tela 5. Cada caixa traz o número e o nome, a prioridade, "Por que é falha", "Como corrigir" (exemplo) e **todas** as ocorrências gravadas (até 50 por regra, `MAX_OCORRENCIAS_POR_REGRA`), cada uma com o seletor e o trecho. Quando a falha pede confirmação à mão, aparece "Confirme à mão", como na Tela 5.
5. **Revisão humana:** os mesmos itens da aba da Tela 5 (`itensDeRevisao`), com ☑ "conferido" ou ☐ "a conferir" e o texto do que conferir.
6. **Como chegamos na nota:** a mesma tabela "Como chegamos" da Tela 5 (recomendação, prioridade, peso, aprovada ou não) e a fórmula: 100 × pesos aprovados ÷ pesos aplicáveis, arredondada para baixo.
7. **Rodapé de cada página:** "Gerado pelo AcessaWeb em <data> · Nota automática, não é certificação · Página X de Y".

Diferenças em relação ao protótipo antigo (`projeto/docs/prototipo/prototipo_emagvalid.html`, Tela 7) e ao `docs/passo-a-passo-mvp.md` (Passo 9): sai o rodapé com o nome do(a) auditor(a); a tabela única "requisito · prioridade · local · correção" vira uma caixa por recomendação, porque ela não comporta até 50 ocorrências com trecho de código; entram o "por que é falha" e "Como chegamos na nota".

Avaliação concluída sem nota (gravada antes do Passo 7): o resumo diz "sem nota (avaliação anterior ao cálculo da nota)" e omite "Como chegamos na nota".

## Telas

**Tela 5 (Resultado), no topo, junto da nota:**

```
Nota 72/100 · padariadabia.com.br/contato
[ Baixar PDF ]
Revisão humana: 3 de 11 itens conferidos. Os outros saem no PDF como "a conferir". Ir para a revisão humana
```

- A contagem muda quando a pessoa marca ou desmarca um item na aba "Revisão humana", sem recarregar.
- "Ir para a revisão humana" abre a aba e leva o foco até ela.
- Com todos os itens conferidos, a frase vira "Revisão humana: todos os 11 itens conferidos".

**Tela 8 (Histórico):** "Baixar PDF" em cada linha concluída. O download sai direto, sem o aviso da revisão.

**Sem plano pago (RF21), nas duas telas:** o botão continua focável e é lido pelo leitor de tela, com `aria-disabled="true"` e o aviso como descrição (`aria-describedby`): "O relatório em PDF faz parte do plano pago. No MVP não há cobrança: o grupo libera o plano nas contas de demonstração." Ele não usa `disabled`, que o tiraria do Tab.

**Erro ao baixar** (limite, gerador ocupado, falha): a mensagem aparece num `Aviso` junto do botão, com o próximo passo (RF17). A tela nunca mostra o JSON cru.

## Abordagens consideradas (escolha do João, 19/11: 1)

1. **Gerar na hora do clique, um PDF por vez.** O pedido abre um Chromium, gera e fecha. Escolhida: é simples, e o download sai em poucos segundos. Risco: por alguns segundos podem rodar dois Chromiums (o da análise e o do PDF); a memória do Render ainda não foi medida. Se apertar, vira a 2 sem mudar a rota nem a tela.
2. **O PDF entra na fila das análises (`apps/api/src/analise/fila.ts`).** Nunca roda mais de um Chromium, mas o PDF pode esperar atrás de 30 análises, e o botão precisaria de estado "gerando" e de consulta repetida.
3. **Gerar ao concluir a análise e guardar.** Descartada: as marcações da revisão humana mudam depois, e o arquivo guardado ficaria velho.

## Como funciona (decidido)

- **Conta:** campo `planoPago Boolean @default(false)` em `Usuario`. A migração é gerada com `npm run db:migrate -w apps/api -- --create-only`, e o SQL é mostrado ao João antes de aplicar. O grupo liga o campo à mão (Prisma Studio ou psql) nas contas de demonstração e da banca. A sessão (`GET /api/auth/eu`, `apps/api/src/rotas/auth.ts:158`) passa a devolver `planoPago`, para a tela saber se bloqueia o botão.
- **Rota:** `GET /api/avaliacoes/:id/pdf`, com `exigirLogin`. Ela devolve 404 se a avaliação não existe ou é de outra conta (mesma resposta, sem revelar qual), 403 sem `planoPago` e 409 se a avaliação não está concluída.
- **Limites:** `limitePdfPorConta` com `criarLimite` (`apps/api/src/auth/tentativas.ts`), 10 por hora por conta (429). Só um PDF por vez em toda a API: se outro estiver sendo gerado, a resposta é 503 com `Retry-After`, e a tela mostra "Outro relatório está sendo gerado. Tente de novo em instantes."
- **HTML do relatório:** montado na API por uma função TypeScript (ex.: `apps/api/src/relatorio/html.ts`) que recebe o mesmo objeto de `resultadoDaAvaliacao` mais o cabeçalho. Todo texto passa por uma função de escape: o trecho e o seletor vêm da página avaliada e são dado não confiável. O CSS fica inline no HTML, sem fonte nem imagem externa. Sem React no servidor e sem biblioteca nova.
- **Chromium do PDF:** `chromium.launch` com os mesmos argumentos de "sem rede" da análise (`apps/api/src/analise/analisar.ts:138`); contexto com `javaScriptEnabled: false`; `context.route('**/*', r => r.abort())`; `page.setContent(html)`; `page.pdf({ format: 'A4', printBackground: true, displayHeaderFooter: true, tagged: true, outline: true })`. O rodapé vem de `footerTemplate`, com `pageNumber` e `totalPages`. O navegador fecha num `finally`. A geração tem um teto de tempo (proposta: 20 s), e, se passar dele, a resposta é erro 500 com mensagem genérica.
- **Resposta:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="acessaweb-<host>-<AAAA-MM-DD>.pdf"` e `Cache-Control: no-store`.
- **Download na tela:** `fetch` com cookie, depois `blob`, depois um link temporário com `download`. Assim os erros 403, 429 e 503 voltam para a tela como `Aviso`, em vez de abrir uma página de JSON.

## Checagens (como provar que funciona)

- Teste de unidade do HTML: um trecho com `<script>` e `"` sai escapado; a ordem das seções e das caixas é a da Tela 5; a avaliação sem nota omite "Como chegamos".
- Testes da rota: 401 sem login; 404 para a avaliação de outra conta; 403 sem plano; 409 não concluída; 429 no 11º pedido da hora; 503 com outro PDF em geração; 200 com `application/pdf` que começa com `%PDF`.
- Front (Vitest): o botão bloqueado com `aria-disabled` e a descrição; a contagem da revisão muda ao marcar um item; o erro vira `Aviso`.
- E2E: baixar o PDF de uma conta com plano (evento `download`) e ver o botão bloqueado numa conta sem plano.
- Acessibilidade: o PDF baixado tem marcação (tagged) e marcadores. Conferir uma vez à mão (Orca ou NVDA) e registrar em `docs/quality.md`.
- `npm run verificar` e `npm run test:e2e` com saída 0.

## Documentos a atualizar junto

- `docs/design.md`: botão e aviso na Tela 5, botão na Tela 8, estado bloqueado; a Tela 7 deixa de existir.
- `docs/architecture.md`: rota do PDF, Chromium do PDF, limite e "um por vez".
- `docs/passo-a-passo-mvp.md`, Passos 9 e 10: o conteúdo novo, sem Tela 7, e o "Baixar PDF" do histórico marcado como feito.
- `docs/quality.md`: a checagem do PDF com marcação.
- `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D: as decisões de 19/11 deste design. Os registros anteriores do RF20 e do Passo 7 também entraram ali.
- `docs/handoff.md`: pendência "automatizar parte da revisão humana" (aplicabilidade de 5.2, 5.3, 6.4–6.8, 1.6 e 3.8; indícios de 1.9, 6.7 e 6.8), a fazer depois do merge da PR #31, para não conflitar.

## Fica com quem implementar

- O nome dos arquivos e das funções, seguindo o padrão do código.
- O CSS do PDF, a partir de `design-system/README.md` (cores, fontes e tamanhos legíveis no papel).
- Como o "um por vez" é guardado (uma variável em memória basta, como a fila). Uma instância só, como hoje.
