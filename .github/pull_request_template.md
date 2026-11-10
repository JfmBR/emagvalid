## O que mudou

<!-- Liste em poucas linhas o que esta PR traz. -->

## Requisito, tela ou marco

<!-- Ex.: RF05 e RF06 (Tela 5 · Resultado), ou Plano de Projeto v1.1 (13/11). Requisitos em projeto/docs/rascunhos/Requisitos_Plano_de_Projeto_v1.0.md -->

## Checklist

**Código**

- [ ] Roda localmente sem erro
- [ ] Testes passam (quando houver)
- [ ] Nenhum segredo no código ou nos commits (chaves e senhas só no `.env`)
- [ ] Nenhuma dependência nova fora das tecnologias previstas, ou ela foi combinada com o grupo

**Acessibilidade da interface** (se a PR mexe em tela)

- [ ] Funciona só com teclado, com foco visível
- [ ] Rótulos visíveis, contraste suficiente, botões de 44 px ou mais
- [ ] Conferido com leitor de tela

**Conteúdo**

- [ ] Dentro do escopo do TAP; pedidos fora dele avisados ao João
- [ ] A nota e as orientações da IA não aparecem como certificação

**Documentação** (se a PR mexe em `projeto/`)

- [ ] Só editei .docx a pedido do João, trocando texto sem mexer na formatação
- [ ] Rodei `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py` (se algum .docx mudou)
- [ ] Rodei `python3 -I projeto/contexto_agente/fontes/_gerar_fontes.py --verificar` e ele saiu com 0
- [ ] Nome do arquivo e campo DATA do .docx têm a mesma data
- [ ] Nenhum `[placeholder]` esquecido
- [ ] `projeto/contexto_agente/03` com a situação atual do marco e `07` com as pendências e as decisões (seção D, com data)
- [ ] Toda fala ou dado de entrevista tem fonte (A1–A3, Ctx1–Ctx4); nada inventado

**Revisão**

- [ ] Commits com mensagem em pt-BR, no formato `tipo: descrição curta`
- [ ] `README.md` atualizado (se entrou pasta, comando ou variável de ambiente nova)
