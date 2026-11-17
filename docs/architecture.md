# Código e arquitetura

Estado em 10/11/2026: estrutura pronta, ainda sem telas nem regras do MVP. A arquitetura oficial está no Plano de Projeto v1.1 (11/11/2026); este arquivo descreve o que existe no código.

## Stack real

| Parte              | Tecnologia (versão no `package-lock.json`)                                           |
| ------------------ | ------------------------------------------------------------------------------------ |
| Monorepo           | npm workspaces (`apps/web`, `apps/api`), Node.js 26 (`.nvmrc`)                       |
| Front-end          | React 19.3, Vite 8.3, TypeScript 7.0, React Router 8.5 (modo declarativo)            |
| API                | Express 5.3, TypeScript, `tsx` em desenvolvimento                                    |
| Banco              | PostgreSQL 17 (Docker local; Neon em produção), Prisma 7.10 com `@prisma/adapter-pg` |
| Análise de páginas | Playwright 1.64 e `@axe-core/playwright` 4.14 (instalados na API, ainda sem código)  |
| Testes             | Vitest 5.1, Testing Library (front-end, jsdom)                                       |
| Qualidade          | oxlint 1.91 (com `jsx-a11y`), Prettier 3.9, GitHub Actions                           |

## Mapa do código

| Caminho                         | Papel                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apps/web/src/App.tsx`          | Rotas das telas (React Router); cada passo do MVP acrescenta a rota da sua tela                  |
| `apps/web/src/componentes/`     | `Botao`, `Campo`, `CampoSenha`, `Selo`, `Aviso` e `Layout`, sobre as classes de `design-system/` |
| `apps/web/src/paginas/`         | Uma tela por arquivo: Inicial, Cadastro, Entrar, Privacidade e não encontrada                    |
| `apps/web/src/sessao.tsx`       | Quem entrou (`useSessao`), lido de `GET /api/auth/eu`                                            |
| `apps/web/src/api.ts`           | `enviar()` para os POST à API e a mensagem de erro sem conexão                                   |
| `apps/web/vite.config.ts`       | Servidor em `5173` com proxy de `/api` para `localhost:3000`; configuração do Vitest             |
| `apps/api/src/app.ts`           | `criarApp()`: monta as rotas, o 404 de `/api`, o front-end pronto e o erro                       |
| `apps/api/src/server.ts`        | Sobe a API na porta `PORT` (padrão 3000)                                                         |
| `Dockerfile`, `.dockerignore`   | Imagem de produção: API, front-end pronto e Chromium (seção Publicação)                          |
| `apps/api/src/rotas/`           | Uma rota por assunto: `saude.ts` e `auth.ts` (cadastro, entrar, sair, eu)                        |
| `apps/api/src/auth/`            | Hash da senha (`scrypt`), sessão em cookie e `exigirLogin`, limite de tentativas                 |
| `apps/api/src/db.ts`            | Única conexão Prisma da API                                                                      |
| `apps/api/prisma/schema.prisma` | Esquema: `Usuario`, `Sessao`, `Avaliacao`, `Falha`, `StatusAvaliacao`                            |
| `apps/api/generated/`           | Cliente Prisma gerado (fora do git)                                                              |
| `design-system/`                | Sistema de design: tokens, CSS dos componentes, marca e ícones (`docs/design.md`)                |
| `projeto/`                      | Documentação do projeto (requisitos, telas, protótipo, contexto dos agentes)                     |

## Fronteiras e fluxo

- O front-end só fala com a API por HTTP (`/api/...`); nunca importa Prisma nem código de `apps/api`. Uma regra de lint vai impor isso (`docs/quality.md`).
- A API concentra banco, análise (Playwright + axe-core) e IA (Gemini). Segredos só no `.env` (`DATABASE_URL`, `IA_API_KEY`).
- Fluxo previsto da avaliação: URL → validação → Playwright abre a página → axe-core → falhas mapeadas para o eMAG 3.1 → nota → sugestões da IA (só o trecho público com a falha), marcadas como sugestão → PDF (plano pago; bloqueado na amostra, RF21). Requisitos e público: Plano de Projeto v1.1.
- **Conta e sessão (RNF04):** senha guardada com `scrypt` e sal aleatório, comparada em tempo constante. Ao entrar, a API cria um código aleatório: o cookie `sessao` (`httpOnly`, `SameSite=Lax`, `Secure` em produção, 7 dias) leva o código, e a tabela `sessoes` guarda só o hash dele. "Sair" apaga a linha. Rotas que exigem conta usam `exigirLogin` (`apps/api/src/auth/sessao.ts`). Login errado tem a mesma mensagem para e-mail sem conta e senha errada. Limites (`apps/api/src/auth/tentativas.ts`): 5 logins errados por e-mail + IP em 15 minutos (quem erra a senha de outra pessoa não trava o dono, que entra de outro IP); 20 logins errados por IP em 15 minutos, somando todos os e-mails; 10 contas novas por IP por hora. A contagem fica na memória da API (teto de 10 mil chaves por limite; zera quando o Render reinicia) e conta antes de consultar o banco, para pedidos simultâneos não furarem o limite.
- **IP de quem acessa:** no Render há 3 proxies na frente da API (Cloudflare, balanceador do Render e um proxy local), medidos em 17/11/2026 com uma rota temporária, já retirada. Por isso `app.set('trust proxy', 3)` em `apps/api/src/app.ts`: `req.ip` é o IP real, e um `X-Forwarded-For` inventado fica à esquerda e é ignorado. Se o Render mudar a rede, medir de novo: número maior deixa falsificar o IP; menor junta todos os visitantes num IP só.
- **Proteções gerais da API** (`apps/api/src/app.ts`, revisão de segurança de 16/11/2026): corpo JSON de até 10 kB; pedidos que mudam dado (`POST` etc.) vindos de outro site são recusados com 403, pelo `Sec-Fetch-Site` ou, na falta dele, pelo `Origin` (CSRF); erro de pedido (JSON malformado, corpo grande) responde 400/413 e o log guarda só o tipo, nunca o corpo, que pode ter senha. Toda resposta leva `Content-Security-Policy` (só o próprio site e as fontes do Google; `frame-ancestors 'none'` contra clickjacking), `X-Content-Type-Options: nosniff` e `Referrer-Policy`. Fonte nova de fora do site precisa entrar na CSP.
- **Segurança (RNF04 e RNF10 do Plano v1.1):** a API vai abrir URLs informadas pelo usuário. Bloqueie endereços internos (localhost, redes privadas, metadados de nuvem) para evitar SSRF; limite tempo, tamanho da página e análises seguidas; mostre trechos da página como texto, nunca como HTML (XSS); consultas só pelo Prisma, sem SQL montado com texto do usuário (SQL injection).

## Dados e migrações

- Esquema em `apps/api/prisma/schema.prisma`; migrações em `apps/api/prisma/migrations/` (`20261105122347_inicial`, `20261117000628_sessoes`).
- Mudança no esquema entra como migração (`npm run db:migrate -w apps/api`), revisada antes de aplicar. Nunca migrar durante o build ou por requisição.
- O DBeaver serve para ver e testar dados locais, não para mudar tabelas.

## Publicação

- Uma imagem só (`Dockerfile`, base `node:26-trixie-slim`) roda no Render, plano gratuito: a API serve `/api` e também o front-end pronto (`PASTA_WEB=/app/apps/web/dist`); qualquer rota fora de `/api` devolve o `index.html`. O Chromium do Playwright vai na imagem porque a análise roda no servidor.
- Banco no Neon (plano gratuito). Na partida, o contêiner roda `prisma migrate deploy` (aplica as migrações já revisadas, nunca cria novas) e depois sobe a API.
- Variáveis no painel do Render, nunca no repositório: `DATABASE_URL` (obrigatória).
- Medição local em 15/11/2026, com os limites do plano gratuito (`docker run --memory=512m --cpus=0.1`): example.com em 11,4 s; página de demonstração do W3C em 21,2 s, com pico de 242 MB. No Render (16/11/2026): a mesma página do W3C em 15,6 s; acordar depois de hibernar levou 52,8 s, e com o serviço acordado a página abre em 0,6 s. Acordar + análise passa dos 60 s do RNF06 (risco R7; ver `docs/passo-a-passo-mvp.md`, Passo 3). O diagnóstico usado para medir (`ANALISAR_AO_INICIAR`) foi retirado do código.
- Passo a passo dos painéis: `docs/instalacao.md`, seção "Publicar no Render e no Neon".

## Decisões

| Data       | Decisão                                                                                | Onde está                                                      |
| ---------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 03/11/2026 | Prisma 7 (entre Prisma, SQL puro e Drizzle)                                            | `projeto/contexto_agente/07-pendencias-e-decisoes.md`, seção D |
| 05/11/2026 | Render + Neon, Gemini, nota com pesos, 60 s por análise                                | `07`, seção D                                                  |
| 10/11/2026 | Código e documentação num só repositório; dados de entrevistados fora dele             | `07`, seção D                                                  |
| 16/11/2026 | React Router para as rotas das telas                                                   | `07`, seção D                                                  |
| 16/11/2026 | Sessão em tabela no banco; limite de tentativas de login; conferência por `/api/saude` | `07`, seção D                                                  |

## Manutenção

Atualize este arquivo quando mudar a stack, a estrutura de pastas, uma fronteira ou o esquema do banco. Decisão nova também vai para a seção D do `07`.
