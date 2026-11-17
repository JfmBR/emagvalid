# Handoff — fim da sessão de 17/11/2026

Antes de retomar, confira os arquivos, o `git status`, as checagens e os processos. Este registro é contexto, não prova.

## Objetivo

- **Projeto:** MVP do AcessaWeb (`PRODUCT.md`; guia em `docs/passo-a-passo-mvp.md`).
- **Feito até aqui:** Passos 3 (publicação), 4 (base das telas) e 5 (conta e login), com duas revisões de segurança aplicadas.
- **Próximo:** Passo 6, nova avaliação e análise (Telas 3 e 4), previsto para 18–20/11 com checkpoint em 19/11.

## Estado verificado (17/11/2026)

| Item                | Valor                                                                                                                                                                                           |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`              | `4afbadc` (merge da #19). PRs #14 a #19 entraram; nenhuma PR aberta                                                                                                                             |
| `npm run verificar` | exit 0: API 55 testes, web 17, build ok                                                                                                                                                         |
| `npm run test:e2e`  | 6 de 6                                                                                                                                                                                          |
| Produção            | https://acessaweb.onrender.com com a #19: `/api/saude` responde `{"status":"ok"}`; a rota temporária `/api/diagnostico/ip` responde 404; migração `sessoes` aplicada no Neon pelo deploy da #17 |
| Banco local         | migrações `inicial` e `sessoes` aplicadas; sobrou 1 usuário de teste (`teste.<número>@exemplo.com`) e 1 sessão, criados pelo agente ao testar o login                                           |
| Processos           | nenhum servidor, Vite ou build aberto pelo agente                                                                                                                                               |
| Branches locais     | as branches já mescladas (`feat/publicacao` … `feat/limite-por-ip`) continuam no computador; dá para apagar quando quiser                                                                       |

## O que está pronto

- **Publicação:** imagem Docker única no Render com Chromium; banco no Neon. Medido no Render: análise em 15,6 s; acordar depois de hibernar em 52,8 s (risco R7).
- **Telas:** React Router 8.5; componentes `Botao`, `Campo`, `CampoSenha`, `Selo`, `Aviso`, `Layout`; Tela 1, cadastro, login, privacidade e página não encontrada, com e2e e axe.
- **Conta:** senha com `scrypt`; sessão em cookie `httpOnly` com o hash na tabela `sessoes`; `exigirLogin` pronto para o Passo 6.
- **Segurança:** CSRF por `Sec-Fetch-Site`/`Origin`; corpo de até 10 kB; CSP, `nosniff` e `frame-ancestors`; `trust proxy` = 3 (medido no Render); limites de login e cadastro por e-mail + IP, por IP, por e-mail e IPv6 por /64. Detalhes em `docs/architecture.md`; relatórios das revisões em `../acessaweb-privado/relatorios/`.

## Pendências

**Do João**

- Conferir a tabela `usuarios` no DBeaver (Passo 5, último item).
- Teste com leitor de tela (Orca ou NVDA) nas telas novas.
- Canal para pedir a exclusão da conta (LGPD): a página de privacidade não diz como, porque o contato não consta nos arquivos (`07`, seção D, 16/11).
- Levar ao mentor o tempo de acordar do Render (52,8 s + análise passa dos 60 s do RNF06; `07`, seção B).
- Antes de demonstrar para uma sala inteira (banca, pitch): os limites de 20 logins errados e 10 contas por IP podem barrar quem divide a mesma rede (`apps/api/src/auth/tentativas.ts`).

**Decisões abertas do Passo 6** (propostas do agente, ainda sem resposta)

1. Uma análise por vez no servidor inteiro, com as outras na fila (`NA_FILA`), porque o Chromium usa cerca de 242 MB dos 512 MB.
2. Limite de 10 análises por hora por conta (RNF10).

**Segurança que entra no Passo 6** (`07`, seção B, e RNF10)

- Bloquear endereços internos, inclusive depois de traduzir o domínio em IP e em cada redirecionamento (SSRF).
- Abrir o Chromium sem `DATABASE_URL` e sem a chave da IA no ambiente (`apps/api/src/analise/analisar.ts`).
- Tempo máximo e tamanho máximo da página; trechos sempre como texto, nunca como HTML.

**Depois do MVP** (`07`, seção D, 16/11): o cadastro diz quando o e-mail já tem conta; `scrypt` com N=2^14; limpeza das sessões vencidas; confirmação de e-mail; imagem sem dependências de desenvolvimento; papel do banco só para a API.

## Bloqueios

Nenhum. O Passo 6 só espera as duas decisões acima.

## Próxima ação

1. O João responde as duas decisões do Passo 6.
2. O agente monta o plano do Passo 6 (`superpowers:writing-plans`), mostra ao João e cria a branch `feat/nova-avaliacao` a partir da `main`.
