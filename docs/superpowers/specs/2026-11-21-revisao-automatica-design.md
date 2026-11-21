# Automatizar parte da revisão humana — design

**Data:** 21/11/2026 · **Branch:** `feat/revisao-automatica` · **Requisito:** RF09 (Plano de Projeto v1.1) · **Decisões anteriores:** `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D, 19/11 (Passo 7 e PDF); lista de itens em `docs/handoff.md`, "Automatizar parte da revisão humana"

## Para que serve

A aba "Revisão humana" da Tela 5 mostra sempre os 16 itens que a máquina não verifica, mais as dúvidas do axe. Em muitas páginas, vários deles nem se aplicam (página sem formulário, sem vídeo, sem tabela), e **a lista cansa** quem avalia (João, 21/11). A análise passa a ler o HTML da página para:

- separar os itens que **provavelmente não se aplicam**, cada um com o motivo;
- apontar **indícios** de problema em três itens, com os elementos achados.

O objetivo é diminuir o trabalho de quem confere sem esconder nada: o item que "não se aplica" continua visível, porque a ferramenta pode errar.

## Objetivos

- Na análise, detectar quando 1.6, 3.8, 5.2, 5.3 e 6.4 a 6.8 provavelmente não se aplicam.
- Na análise, detectar indícios em 1.9, 6.7 e 6.8, com a contagem e até 5 exemplos (caminho e trecho do HTML).
- Na Tela 5 e no PDF: itens com indício no topo da lista; itens que não se aplicam num grupo separado, no fim, fora do total "K de T itens conferidos".

## Fora do escopo

- Mudar a nota. Nada desta automação entra em `requisitosAplicaveis`, nas falhas ou em `calcularNota`.
- Marcar item como conferido sozinho. Só a pessoa marca (decisão do João, 21/11: opção "grupo separado", não "já vem marcado").
- Automatizar os outros itens sem regra (1.1, 1.7, 3.4, 3.11, 3.12, 4.4).
- Reanalisar avaliações antigas. Elas ficam como hoje (sem grupo e sem indícios).
- Orientações da IA (Passo 8).

## Anti-objetivos (falha mesmo se "funcionar")

- Um item some da tela ou do PDF porque a ferramenta achou que não se aplica.
- O texto apresenta a detecção como certeza. Os motivos dizem "não achamos" ou "achamos", nunca "não há" ou "não cumpre".
- A automação muda a nota ou derruba a análise. Se a leitura do HTML falhar, a análise termina como hoje, sem grupo nem indícios.
- O código da página avaliada controla o que gravamos além do formato previsto (ver "Segurança").

## Abordagens consideradas

|                   | Como                                                                               | A favor                                                                              | Contra                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **A (escolhida)** | `evaluate` no mesmo Chromium, depois do axe; resultado gravado em colunas próprias | Vê o que o JavaScript do site montou; isolado do axe e da nota; sem dependência nova | Script que roda dentro da página, com testes próprios                                             |
| B                 | Regras próprias dentro do axe-core (`axe.configure`)                               | O axe já dá caminho e trecho                                                         | As regras novas se misturam a `violations`/`passes`/`incomplete`; um filtro esquecido muda a nota |
| C (descartada)    | Ler o HTML no Node, sem navegador                                                  | —                                                                                    | Perde o conteúdo montado por JavaScript; pede um parser (dependência nova)                        |

O João escolheu a **A** (21/11): isola a automação da nota.

## Decisões do João (21/11)

1. **Por quê:** a lista cansa. Os itens que não se aplicam ficam **visíveis, com o motivo**.
2. **Grupo separado:** ficam no fim da lista, sob "Provavelmente não se aplicam nesta página (N)", e saem do total T. A pessoa ainda pode marcá-los.
3. **Indício:** mostra a contagem e **até 5 exemplos** (caminho e trecho do HTML, como nas ocorrências das falhas). O item com indício vai para o topo da lista.
4. **Abordagem A.**

## Detecção

Roda depois do `AxeBuilder.analyze()` em `apps/api/src/analise/analisar.ts`, com `evaluate` em cada frame da página (`pagina.frames()`). Assim, um formulário ou vídeo dentro de `iframe` também conta. O Playwright entra em frames de outra origem. Limite: os primeiros 20 frames. Se houver mais, ou se o `evaluate` lançar erro num frame carregado, nenhum "não se aplica" é afirmado, porque pode haver algo no que não foi lido. Os indícios achados continuam valendo.

Frame que nem carregou documento (página de erro `chrome-error://`, por exemplo um anúncio de host bloqueado ou que falhou na rede) ou que foi destacado durante a leitura é **ignorado**: não conta como lido nem como falha. Sem isso, um `iframe` quebrado, comum em sites reais, sumiria com o grupo em quase toda página. O "provavelmente" já cobre o risco. _(Escolha do Claude, 21/11, depois da leitura do revisor.)_

### Provavelmente não se aplica (quando nada disto é achado em nenhum frame)

| Itens                   | O que procuramos                                                                                                                                                                                       | Motivo mostrado                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1.6                     | `table`                                                                                                                                                                                                | "Não achamos tabela (`<table>`) na página."                                                |
| 3.8                     | `a[href]` cujo caminho termina em `.pdf .doc .docx .xls .xlsx .ppt .pptx .odt .ods .odp .rtf` (sem diferença de maiúsculas)                                                                            | "Não achamos link para documento (PDF, DOC, ODT, planilha ou apresentação)."               |
| 5.2                     | `audio`; `a[href]` para `.mp3 .wav .ogg .oga .m4a .aac .opus .flac`; `iframe` de `soundcloud.com`, `open.spotify.com`, `anchor.fm`                                                                     | "Não achamos áudio na página (`<audio>`, link para arquivo de áudio ou player conhecido)." |
| 5.3                     | `video`; `iframe` de `youtube.com`, `youtube-nocookie.com`, `player.vimeo.com`, `dailymotion.com`; `a[href]` para `.mp4 .webm .mov .m4v .ogv`                                                          | "Não achamos vídeo na página (`<video>`, YouTube, Vimeo ou link para arquivo de vídeo)."   |
| 6.4, 6.5, 6.6, 6.7, 6.8 | `form`; `input` que não seja `type="hidden"`; `select`; `textarea`; `[contenteditable]`; `[role]` igual a `textbox`, `searchbox`, `combobox`, `listbox`, `radio`, `checkbox`, `spinbutton` ou `slider` | "Não achamos formulário nem campo de preenchimento na página."                             |

O motivo é fixo por item. Por isso grava-se só o número do item, e o texto fica no código (`textos.ts` ou vizinho), como o "conferir".

### Indícios

| Item | O que conta                                                                                                                                                                                                                                                      | Texto mostrado                                                                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1.9  | `a[href][target]` com `target` diferente de `_self`, `_parent` e `_top`, cujo nome (texto, `aria-label`, `title` e `alt` de imagem dentro) não tem aviso: "nova janela", "nova aba", "new window", "new tab" ou "abre em", sem diferença de maiúsculas e acentos | "N link(s) abre(m) em nova aba ou janela sem aviso no texto."                            |
| 6.7  | grupos de `input[type="radio"]` (mesmo `name` no mesmo `form`; radio sem `name` conta sozinho) em que algum radio não está dentro de `fieldset` nem de `[role="radiogroup"]`. Exemplo: o primeiro radio do grupo                                                 | "N grupo(s) de botões de opção (radio) fora de `<fieldset>`."                            |
| 6.8  | `iframe` ou `script` com `src` de `google.com/recaptcha`, `www.gstatic.com/recaptcha`, `recaptcha.net`, `hcaptcha.com` ou `challenges.cloudflare.com`; elementos `.g-recaptcha`, `.h-captcha`, `.cf-turnstile`                                                   | "Achamos CAPTCHA conhecido na página (reCAPTCHA, hCaptcha ou Turnstile)." (sem contagem) |

Se um item tem indício, ele se aplica: o indício vence o "não se aplica". Exemplo: reCAPTCHA invisível numa página sem formulário deixa 6.8 com indício, e 6.4 a 6.7 no grupo.

**Exemplos:** até 5 por item, na ordem do documento. Cada um tem o caminho, gerado pelo `axe.utils.getSelector` (a mesma função dos caminhos das falhas; o axe já está em cada frame depois do `analyze`), e o trecho (`outerHTML`). Num frame filho, o caminho leva o do `iframe` na frente, separado por espaço, como o `n.target.join(' ')` das falhas. Se `axe.utils.getSelector` não existir, o caminho fica vazio e o trecho continua.

## Dados

Migração nova em `Avaliacao` (o SQL passa pelo João antes de aplicar):

- `requisitosNaoAplicaveis String[] @default([])`: números do eMAG (ex.: `"6.5"`).
- `indicios Json @default("[]")`: lista de `{ numero, total, exemplos: [{ seletor, trecho }] }`.

As linhas antigas recebem os padrões vazios e ficam como hoje. Gravado na mesma transação que conclui a avaliação (`executar.ts`).

## Segurança

O `evaluate` roda no contexto da página avaliada, e o JavaScript do site pode trocar funções do DOM ou o próprio `axe`. O retorno é dado não confiável:

- **No Node, antes de gravar:**
  - só números da lista fixa: os da tabela de "não se aplica" e 1.9, 6.7 e 6.8 nos indícios;
  - `total` inteiro de 0 a 10.000;
  - no máximo 5 exemplos;
  - `seletor` e `trecho` como texto, sem `\u0000` e cortados em `MAX_TRECHO`, como em `falhasDaAnalise`.

  O que fugir do formato é descartado.

- O pior caso de uma página maliciosa é mentir sobre si mesma na revisão (ex.: dizer que não tem formulário). Isso não muda a nota, e o item continua visível no grupo.
- Seletor e trecho sempre aparecem como texto: escapados no PDF e sem `innerHTML` na Tela 5 (RNF10).
- O `evaluate` usa o tempo que sobra do `limiteMs` da análise. Erro ou demora na detecção dá resultado vazio; a análise não falha por isso. No log vai só o nome do erro, como em `diagnostico`.
- Se o relógio da análise (`limiteMs`) estourar durante a detecção, o navegador fecha e o `evaluate` lança erro. A avaliação conclui com o resultado do axe, que já estava completo, sem grupo e sem indícios. Ela **não** vira DEMOROU. _(Escolha do Claude, 21/11.)_

## Resultado (API)

`resultadoDaAvaliacao` (`apps/api/src/analise/resultado.ts`) passa a ler as duas colunas (`CAMPOS_DO_RESULTADO`) e monta a `revisao` com dois campos novos por item:

- `naoSeAplica: string | null`: o motivo, só nos itens do grupo;
- `indicio: { texto, exemplos: [{ seletor, trecho }] } | null`.

Ordem da lista: primeiro os itens com indício, depois os outros da lista principal, e por fim o grupo. Dentro de cada parte, a ordem do eMAG.

A rota `POST /:id/revisao` continua aceitando qualquer item de `itensDeRevisao`, inclusive os do grupo.

## Tela 5 (`apps/web/src/paginas/Resultado.tsx` e `RevisaoHumana.tsx`)

```
Revisão humana — 3 de 9 itens conferidos

[ ] 1.9 · Não abrir novas instâncias sem a solicitação do usuário
    Indício: 4 links abrem em nova aba ou janela sem aviso no texto.
    Alguns deles:
      footer > a:nth-child(2)
      <a href="https://x.com/..." target="_blank">X</a>
    Confira se algum link, botão ou script abre nova janela...
[x] 1.1 · Respeitar os Padrões Web
...

Provavelmente não se aplicam nesta página (7)
A ferramenta não achou na página o que estes itens pedem. Ela pode ter deixado algo passar,
como um vídeo que só carrega ao rolar a página. Marque se conferir.
[ ] 5.2 · Fornecer alternativa para áudio
    Não achamos áudio na página (<audio>, link para arquivo de áudio ou player conhecido).
...
```

- O total T, a contagem "K de T" junto do "Baixar PDF" e o rótulo da aba "Revisão humana (N)" contam só a lista principal. K conta só as marcas da lista principal.
- O grupo tem um título próprio e a sua lista. O nível do título é escolha de quem constrói, seguindo a hierarquia da aba.
- No indício, o texto e os exemplos entram na descrição da caixa (`aria-describedby`), como o "conferir". Os exemplos usam `<code>`, como as ocorrências dos cartões.
- Sem grupo (avaliação antiga ou nada detectado), a aba fica igual a hoje.
- Valem as regras de leitura de `docs/design.md`, "Leitura pelo leitor de tela nas Telas 4 e 5": nome curto na caixa, o resto como descrição.

## PDF (`apps/api/src/relatorio/html.ts`)

- O resumo diz "Revisão humana: K de T itens conferidos", só com a lista principal.
- Na seção "Revisão humana":
  - a lista principal vem na mesma ordem da tela, com o indício e os exemplos;
  - depois vem o subtítulo "Provavelmente não se aplicam nesta página", com o motivo de cada item e ☑ ou ☐.

## Testes

- **`analisar.test.ts`** (páginas locais, como hoje):
  - sem formulário nem mídia, mostra os 9 itens como não aplicáveis;
  - com cada elemento, o item correspondente sai do grupo, inclusive dentro de `iframe`;
  - indícios de 1.9 (com e sem aviso), 6.7 (com e sem `fieldset`) e 6.8, com no máximo 5 exemplos;
  - uma página que troca `axe.utils.getSelector` ou `document.querySelectorAll` não derruba a análise;
  - `aplicaveis`, `violacoes` e `duvidas` ficam iguais aos de hoje.
- **Validação do retorno:** número fora da lista, `total` negativo, 6 exemplos e trecho gigante são descartados ou cortados.
- **`resultado.test.ts`:** ordem (indício, principal, grupo), motivos, indício vence "não se aplica", avaliação antiga sem mudança.
- **`executar.test.ts`:** grava as duas colunas e não muda a nota.
- **`html.test.ts`:** K de T sem o grupo; subtítulo e motivos; exemplos escapados.
- **Web:** contagem e rótulo da aba sem o grupo; grupo com título; indício na descrição da caixa.
- **e2e:** uma página com indício e grupo passa no axe e no teclado.

## Documentos a atualizar

- `docs/design.md`: Tela 5 e roteiro do leitor de tela.
- `docs/architecture.md`: migração nova na lista de "Dados e migrações", que já está desatualizada.
- `docs/quality.md`: o que a automação cobre e o que não cobre.
- `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D: decisões de 21/11.
- `docs/handoff.md`.

## Fica para quem constrói

- Nomes internos das funções, onde ficam os textos dos motivos e indícios, e o nível dos títulos na aba.
- Detalhes da comparação sem acento no aviso de 1.9 e do agrupamento de radios.
- Reaproveitar ou não o servidor local do `analisar.test.ts` para as páginas novas.
