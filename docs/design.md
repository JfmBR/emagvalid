# Design e acessibilidade

O AcessaWeb é uma ferramenta de acessibilidade: a própria interface precisa ser exemplar.

## Direção

- Referência de fluxo e de textos: o protótipo beta, `projeto/docs/prototipo/beta/` (abra o `index.html`; `dashboard.png` mostra as telas principais). É um guia do caminho, não especificação: o visual segue `design-system/` (paleta, fontes e componentes do beta não entram), e o que o beta mostra fora do MVP não se implementa (`PRODUCT.md`, "Fora do escopo"). Telas do MVP que o beta não tem (login, histórico, revisão das orientações da IA) seguem o protótipo anterior, `projeto/docs/prototipo/prototipo_emagvalid.html` e `projeto/docs/rascunhos/Prototipo_30-10_telas_e_teste.md`. O arquivo do Figma está no Índice de links do Drive do grupo.
- Linguagem simples, em pt-BR, com ajuda curta na própria tela (RF16) e mensagens de erro com o próximo passo (RF17).
- A nota e as orientações da IA aparecem sempre como apoio à avaliação humana, nunca como certificação (RF09, RNF07).

## Sistema de design

- Fonte única do visual: `design-system/` (tokens, componentes, marca e ícones). Comece pelo `design-system/README.md`.
- Valores em `design-system/tokens.json`; depois de mudar, rode `node scripts/gerar-tokens-css.mjs` para atualizar o `tokens.css`.
- Ao construir uma tela, use `design-system/tokens.css` e as classes de `design-system/components/bundle.css`. Não crie cor, fonte ou espaçamento fora dos tokens.
- O app importa `tokens.css` e `bundle.css` em `apps/web/src/main.tsx`; o `index.css` guarda só o que o `design-system/` não cobre. Componentes React em `apps/web/src/componentes/` (`Botao`, `Campo`, `Selo`, `Aviso`, `Layout`).
- O `Layout` traz a barra de acessibilidade, o cabeçalho com a marca, o `main` e o rodapé. Ao trocar de tela, o foco vai para o `h1`; cada tela define o seu `<title>`.
- Com a conta aberta, o cabeçalho mostra "Olá, Nome", "Minha conta" e "Sair". A tela `/conta` (`paginas/Conta.tsx`) mostra o nome e o e-mail e tem "Excluir minha conta" (LGPD): a pessoa digita a senha e confirma com o botão de perigo. Depois, a mesma tela vira "Conta excluída", com o foco no título novo.
- Tela 3 · Nova avaliação com lista (RF20): "+ Adicionar outra página" acrescenta um campo (até 10) e leva o foco a ele. "Remover", nos campos 2 a 10, tira o campo e leva o foco ao anterior. O contador "N de 10 páginas" vira "Você chegou ao limite de 10 páginas." no décimo. Com 1 link, a pessoa segue para a Tela 4; com 2 ou mais, para o histórico.
- Tela 8 · Histórico de avaliações (`paginas/Historico.tsx`, rota `/avaliacoes`, link "Histórico" no cabeçalho), com o layout do protótipo de 28/10:
  - tabela com Data, Página, Nota, Situação e Ações ("Ver resultado", "Ver o motivo" ou "Acompanhar", e "Avaliar de novo", que preenche a Tela 3 para a pessoa confirmar);
  - "Mostrar mais" traz as próximas 20 e leva o foco ao primeiro link da primeira linha nova;
  - leitor de tela: os links levam o endereço da página no nome ("Ver resultado de …"), o traço da nota vazia é lido "sem nota", e um `<output>` escondido diz só o resumo quando ele muda ("2 análises em andamento.", "Todas as análises terminaram.");
  - "Baixar PDF" em cada linha concluída (botão de texto; o leitor ouve "Baixar PDF de …"), liberado para toda conta.
- Tela 5 · Resultado (`paginas/Resultado.tsx`, no lugar do resumo da Tela 4 quando a análise conclui, na mesma rota `/avaliacoes/:id`), com o layout do protótipo de 28/10:
  - nota `N/100` (o leitor de tela ouve "Nota N de 100"), o selo "Nota automática" e o aviso fixo "Não é certificação. A conclusão de conformidade é sua.";
  - "Como chegamos a N" (`<details>`): uma linha por recomendação que se aplica à página, com prioridade, peso e Aprovada/Reprovada, e a conta no rodapé (`100 × pesos aprovados ÷ pesos aplicáveis`). Avaliação feita antes do cálculo da nota (sem os dados) mostra um aviso para refazer, e os cartões continuam;
  - abas "Falhas automáticas" e "Revisão humana" no padrão WAI-ARIA (setas, Home e End);
  - um cartão por requisito, da prioridade alta para a baixa, com "Por que é falha" e "Como corrigir (exemplo)" do texto padrão de `apps/api/src/emag/textos.ts` (rascunho do Claude de 19/11/2026, a revisar pelo grupo), as ocorrências em "Onde está" (seletor e trecho, sempre como texto) e o link para o eMAG, que abre em outra aba com "(abre em nova aba)" no texto (pedido do João de 19/11/2026; o eMAG 1.9 aceita a aba nova desde que o link avise). Regra para todo link a outro site: `target="_blank"`, `rel="noopener noreferrer"` e o aviso no texto visível. O design-system não tem selo de prioridade baixa: usa o contorno neutro (`pendente`) e o texto diz a prioridade. "Confirme à mão" marca o requisito de cobertura parcial;
  - revisão humana: as 16 recomendações que a máquina não verifica mais as que o axe-core deixou em dúvida na página, cada uma com uma caixa de marcar e o que conferir. A marca é gravada na hora; se a API não gravar, a caixa volta e aparece o erro;
  - "Baixar PDF" junto da nota (RF12, design de 19/11/2026: sem Tela 7 de prévia). Logo abaixo, "Revisão humana: K de T itens conferidos. Os outros saem no PDF como "a conferir"." e o botão de texto "Ir para a revisão humana", que abre a aba e põe o foco nela. A contagem muda na hora em que um item é marcado; com tudo conferido, a frase vira "todos os T itens conferidos" e o atalho some. Na ordem do Tab, o botão e o atalho vêm antes de "Como chegamos";
  - o botão vale para toda conta (o plano pago saiu do MVP em 19/11/2026). Erro ao baixar (limite, gerador ocupado) aparece num alerta junto do botão;
  - "Orientações revisadas" ficam para o Passo 8.
- Relatório em PDF (`apps/api/src/relatorio/html.ts`): cabeçalho com a página, a data e "Preparado para"; o aviso de que a nota não é certificação; resumo; uma caixa por recomendação com falha, na ordem da Tela 5, com todas as ocorrências; revisão humana com ☑ conferido e ☐ a conferir; "Como chegamos na nota"; rodapé com a data e "Página X de Y". Sem nome de auditor: o PDF não pode parecer laudo. Cores do tema claro e fonte do sistema, sem nada externo. O PDF sai com marcação para leitor de tela (`tagged`) e marcadores.
- Leitura pelo leitor de tela nas Telas 4 e 5 (ajustada depois do teste do João com o Orca em 19/11/2026, quando a fala se atropelava):
  - na análise, só a frase do passo atual é anunciada ("Passo 2 de 3: verificando as recomendações do eMAG 3.1."), num `<output>` escondido; a lista de passos não é mais região viva. Ao concluir, esse painel sai, e o único anúncio é o foco no título;
  - o título diz a nota: "Resultado da avaliação: nota 77 de 100". O número grande fica `aria-hidden`, para não ser lido duas vezes;
  - o "·" (componente `Ponto`) vira vírgula para o leitor, e a conta vira "100 vezes 30, dividido por 39, igual a 77";
  - a tabela de "Como chegamos" fica numa região focável ("Conta da nota"): o Tab para nela;
  - nos cartões, o título vem antes dos selos no código (na tela, os selos continuam em cima), e o selo "Automático" não é lido;
  - na revisão humana, a caixa tem nome curto (número e recomendação) e o que conferir como descrição;
  - a tabela tem a fórmula da nota como descrição (`aria-describedby`): quem pula direto para a tabela também a ouve;
  - as abas não têm nome diferente do texto visível ("Revisão humana (17)"): quem usa comando de voz fala o que vê (WCAG 2.5.3), e na pontuação padrão o Orca e o NVDA não leem os parênteses.
  - Roteiro do teste manual: do fim da análise até dentro de "Como chegamos", o leitor deve dizer o título com a nota, sem atropelo; com as setas, o aviso "Não é certificação" e o resumo; com Tab, "Como chegamos", a tabela e as abas.
- Barra de acessibilidade (`componentes/BarraAcessibilidade.tsx`, eMAG 3.1 seção 4.3), no topo de toda tela:
  - atalhos "Ir para o conteúdo [1]", "Ir para o menu [2]" e "Ir para o rodapé [4]" (`accesskey` 1, 2 e 4, para `#conteudo`, `#menu` e `#rodape`). O primeiro é o primeiro link da página e faz o papel do antigo "Pular para o conteúdo". Sem busca no site, não há atalho 3. No Chrome e no Firefox do Linux, Alt + número troca de aba antes de chegar ao `accesskey`; por isso a barra também escuta Alt + número (com ou sem Shift) pela página, fora dos campos de texto. Troca consciente, como em sites do governo que seguem o eMAG: nas telas do AcessaWeb, Alt + 1, 2 e 4 deixam de trocar de aba (a troca segue em Ctrl + Page Up/Down). Falta conferir à mão no Chrome e no Firefox do Linux, porque o e2e não passa pelos atalhos do navegador. O destino ganha contorno de foco mesmo com clique do mouse (`data-atalho`);
  - botões "Alto contraste" (eMAG 4.2) e "Modo escuro", com `aria-pressed`. A escolha fica no `localStorage` (`apps/web/src/tema.ts`) e vira o `data-theme` do `<html>` por um script clássico no `<head>` (`apps/web/public/tema-inicial.js`, que repete a regra do `tema.ts`; o `tema.test.ts` confere que os dois dão o mesmo resultado), antes do CSS e do app, para a página não piscar no tema errado. O contraste vence o modo escuro, e clicar em "Modo escuro" desliga o contraste; sem escolha, a página segue o tema do sistema. Quando o clique deixa a escolha igual ao sistema, ela é apagada e a página volta a seguir o sistema. O tema escolhido também muda o `color-scheme` (barra de rolagem e campos nativos), e outra aba aberta acompanha a mudança (evento `storage`);
  - link "Acessibilidade", para a página `/acessibilidade` (eMAG 4.5): atalhos por navegador, temas, zoom e como testamos.
- Sem botões A+/A-: o eMAG 3.1 (seção 1.3) os tirou porque os navegadores já têm zoom. No lugar, toda tela continua legível e funcionando com 200% de zoom (recomendação 4.3), conferido no e2e com a janela em 640 px.

## Interação

Critérios do eMAG 3.1/WCAG 2.1 AA (RNF01, RNF02):

- Tudo funciona só com teclado, em ordem lógica, com foco sempre visível.
- Botões e links respondem ao mouse e ao clique (`bundle.css`); a resposta nunca é o único sinal de que algo é clicável.
- Todo campo tem rótulo visível; todo erro é anunciado e diz como corrigir.
- Contraste mínimo de 4,5:1 no texto (3:1 em texto grande e componentes).
- Alvos de clique de 44 × 44 px ou mais, com espaço entre eles.
- Imagens com texto alternativo; ícones decorativos escondidos do leitor de tela.
- Andamento da análise anunciado sem roubar o foco (RNF06).
- Sem depender só de cor para passar informação (prioridade das falhas, nota).

## Layout e revisão

- Antes de entregar uma tela: rode o e2e com axe (`docs/quality.md`), use a skill `web-design-guidelines` e navegue só com teclado.
- Teste com leitor de tela: Orca + Firefox no Linux; NVDA no Windows, que é o da persona. Faça ao menos uma rodada com o NVDA antes de 04/12.
- O agente pode abrir a tela com `agent-browser` e ler a árvore de acessibilidade; isso não substitui o teste com leitor de tela de verdade.

## Manutenção

Atualize quando mudar o protótipo, um componente compartilhado ou um critério. Mudança de tela que contrarie o protótipo deve ser avisada ao João.
