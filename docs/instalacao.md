# Guia de instalação

Tudo o que é preciso instalar para rodar o AcessaWeb no seu computador, do zero até a tela "API conectada.". Escrito em 05/11/2026; links e versões conferidos nos sites oficiais nessa data.

- [Windows](#windows)
- [Linux (Debian 13 e Ubuntu 24.04)](#linux-debian-13-e-ubuntu-2404)

---

## Windows

Vale para Windows 10 (22H2) e Windows 11 (23H2 ou mais novo), inclusive a edição Home.

### Resumo

| Ferramenta            | Para quê                               | Download                                                                                            | Pelo `winget`                |
| --------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- |
| Git                   | Baixar os repositórios e fazer commits | [git-scm.com/install/windows](https://git-scm.com/install/windows)                                  | `Git.Git`                    |
| Node.js 26 (LTS)      | Rodar a API, o front-end e o `npm`     | [nodejs.org/pt-br/download](https://nodejs.org/pt-br/download)                                      | `OpenJS.NodeJS.LTS`          |
| WSL 2                 | Exigido pelo Docker Desktop            | comando `wsl --install` (passo 3)                                                                   | —                            |
| Docker Desktop        | Ligar o PostgreSQL local               | [docs.docker.com/…/windows-install](https://docs.docker.com/desktop/setup/install/windows-install/) | `Docker.DockerDesktop`       |
| VS Code               | Editar o código                        | [code.visualstudio.com/download](https://code.visualstudio.com/download)                            | `Microsoft.VisualStudioCode` |
| DBeaver Community     | Ver e testar os dados do banco         | [dbeaver.io/download](https://dbeaver.io/download/)                                                 | `DBeaver.DBeaver.Community`  |
| NVDA                  | Testar as telas com leitor de tela     | [nvaccess.org/download](https://www.nvaccess.org/download/)                                         | `NVAccess.NVDA`              |
| Chromium (Playwright) | Navegador que a análise usa            | comando `npx playwright install chromium` (passo 9)                                                 | —                            |

Você também precisa de uma **conta no GitHub** com acesso aos repositórios `JfmBR/emagvalid` e `JfmBR/emagvalid-docs` (peça ao João).

**Atalho pelo `winget`:** o Windows 10 e 11 já trazem o `winget`. Em vez de baixar cada instalador, abra o PowerShell e rode uma linha por ferramenta, por exemplo:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id DBeaver.DBeaver.Community -e
winget install --id NVAccess.NVDA -e
```

O `winget` às vezes traz uma versão um pouco mais antiga que a do site; para este projeto isso não atrapalha. Mesmo usando o atalho, faça o passo 3 (WSL) antes de abrir o Docker Desktop.

### 1. Git

1. Baixe o instalador em [git-scm.com/install/windows](https://git-scm.com/install/windows) (x64 para a maioria dos computadores; ARM64 só se o seu processador for ARM).
2. Instale com as opções padrão. O repositório já força as quebras de linha certas (`.gitattributes`), então não precisa mudar nada nessa tela.
3. Abra um **novo** PowerShell e diga ao Git quem é você (use o mesmo e-mail da conta do GitHub):

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 2. Node.js 26 (LTS)

1. Em [nodejs.org/pt-br/download](https://nodejs.org/pt-br/download), escolha a versão **26 (LTS)**, Windows, e baixe o instalador `.msi`.
2. Instale com as opções padrão. A caixa "Automatically install the necessary tools" (ferramentas de compilação) **não** é necessária para este projeto.
3. O instalador já traz o `npm`.

### 3. WSL 2

O Docker Desktop roda o banco dentro do WSL 2 (o Linux do próprio Windows). Ative uma vez por computador:

1. Abra o PowerShell **como administrador** (botão direito no menu Iniciar → "Terminal (Admin)").
2. Rode:

```powershell
wsl --install
```

3. Reinicie o computador quando pedir.
4. Confira com `wsl --version`. Se não aparecer a versão, rode `wsl --update`.

Se der erro de virtualização, a virtualização do processador está desligada na BIOS/UEFI. Isso varia por fabricante; procure "ativar virtualização" com o modelo do seu computador.

### 4. Docker Desktop

1. Baixe em [docs.docker.com/desktop/setup/install/windows-install](https://docs.docker.com/desktop/setup/install/windows-install/) ("Docker Desktop for Windows – x86_64").
2. Instale deixando marcada a opção **"Use WSL 2 instead of Hyper-V"**.
3. Abra o Docker Desktop e espere o status ficar verde ("Engine running"). Não é preciso entrar com conta Docker: dá para pular o login.
4. Requisitos: 8 GB de RAM e virtualização ativa (ver passo 3).

O Docker Desktop precisa estar **aberto** sempre que você for usar o banco (`npm run db:up`).

### 5. VS Code

1. Baixe em [code.visualstudio.com/download](https://code.visualstudio.com/download) (Windows, "User Installer").
2. Na instalação, marque **"Adicionar ao PATH"** e **"Abrir com o Code"** no menu do botão direito.
3. Extensões recomendadas: **Prettier** (formatação), **Prisma** (esquema do banco) e **oxc** (lint).

### 6. DBeaver Community

1. Baixe em [dbeaver.io/download](https://dbeaver.io/download/) a versão **Community** para Windows (instalador `.exe`). O instalador já traz o Java.
2. A conexão com o banco local está no [`README.md`](../README.md), "Como rodar": PostgreSQL, host `localhost`, porta `5432` e o banco, o usuário e a senha do `docker-compose.yml`.
3. Use o DBeaver só para ver e testar dados. Mudança nas tabelas é pelo `apps/api/prisma/schema.prisma` e uma migração.

### 7. NVDA (leitor de tela)

1. Baixe em [nvaccess.org/download](https://www.nvaccess.org/download/). É gratuito; a doação é opcional.
2. Instale. Liga com `Ctrl+Alt+N`; desliga com `Insert+Q`.
3. É o leitor que a persona do projeto usa: todo teste de tela passa por ele (Passos 4 e 12 do [passo a passo](passo-a-passo-mvp.md)).

### 8. Baixar os repositórios

Os dois repositórios ficam lado a lado numa pasta `projeto_integrador` (o código procura a documentação em `../emagvalid_docs/`). No PowerShell, na pasta onde quiser guardar o projeto (por exemplo, `Documentos\Projetos`):

```powershell
mkdir projeto_integrador
cd projeto_integrador
git clone https://github.com/JfmBR/emagvalid.git emagvalid
git clone https://github.com/JfmBR/emagvalid-docs.git emagvalid_docs
```

Atenção: a pasta da documentação é `emagvalid_docs`, **com sublinhado**. Na primeira vez, o Git abre uma janela para entrar no GitHub pelo navegador.

### 9. Instalar as dependências e rodar

Com o **Docker Desktop aberto**, no PowerShell:

```powershell
cd emagvalid
npm install
Copy-Item .env.example .env
npm run db:up
npm run db:migrate -w apps/api
npx playwright install chromium
npm run dev
```

O que cada linha faz:

| Comando                           | O que faz                                              |
| --------------------------------- | ------------------------------------------------------ |
| `npm install`                     | Baixa as bibliotecas do projeto (pasta `node_modules`) |
| `Copy-Item .env.example .env`     | Cria o seu `.env`; ele não entra no git                |
| `npm run db:up`                   | Liga o PostgreSQL no Docker                            |
| `npm run db:migrate -w apps/api`  | Cria as tabelas no banco                               |
| `npx playwright install chromium` | Baixa o navegador que a análise usa (só uma vez)       |
| `npm run dev`                     | Sobe a API e o front-end                               |

### 10. Conferir

1. Abra [http://localhost:5173](http://localhost:5173): deve aparecer **"API conectada."**
2. Para parar, `Ctrl+C` no PowerShell; para desligar o banco, `npm run db:down`.
3. Para conferir as versões instaladas:

```powershell
git --version
node -v
npm -v
docker --version
docker compose version
```

O `node -v` deve começar com `v26`.

### Problemas comuns no Windows

| Mensagem                                                             | O que fazer                                                                                                                                                                   |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm : ... a execução de scripts foi desabilitada neste sistema`     | O PowerShell bloqueia scripts por padrão. Rode uma vez `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` e responda `S`; ou use o terminal "Git Bash", que veio com o Git |
| `'git'`, `'node'` ou `'docker'` não é reconhecido                    | Feche e abra o terminal (ou o VS Code) depois de instalar; o PATH só atualiza em terminal novo                                                                                |
| `docker: error during connect` ou `npm run db:up` falha              | O Docker Desktop está fechado ou ainda iniciando; abra e espere "Engine running"                                                                                              |
| `npm run db:migrate` diz que não alcança o banco em `localhost:5432` | O banco não está ligado (`npm run db:up`) ou outro PostgreSQL já usa a porta 5432                                                                                             |
| Moveu ou renomeou a pasta do projeto e algo parou de funcionar       | Rode `npm install` de novo                                                                                                                                                    |
| A tela mostra "API indisponível."                                    | Veja no terminal se a API subiu sem erro e se o `.env` existe na raiz de `emagvalid`                                                                                          |

---

## Linux (Debian 13 e Ubuntu 24.04)

Escrito para o **Debian 13** (o Linux do João). Onde o **Ubuntu 24.04** é diferente, o guia avisa. Os comandos usam `apt` e `sudo`; outras distribuições precisam de ajustes.

### Resumo

| Ferramenta            | Para quê                               | Como instalar                                                                               |
| --------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------- |
| Git                   | Baixar os repositórios e fazer commits | `sudo apt install git` (passo 1)                                                            |
| nvm + Node.js 26      | Rodar a API, o front-end e o `npm`     | [github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm) (passo 2)                            |
| Docker e Compose      | Ligar o PostgreSQL local               | `sudo apt install docker.io docker-compose` (passo 3)                                       |
| VS Code               | Editar o código                        | [code.visualstudio.com/download](https://code.visualstudio.com/download) (`.deb`)           |
| DBeaver Community     | Ver e testar os dados do banco         | [dbeaver.io/download](https://dbeaver.io/download/) (`.deb`)                                |
| Orca                  | Testar as telas com leitor de tela     | já vem no GNOME; senão, `sudo apt install orca` ([orca.gnome.org](https://orca.gnome.org/)) |
| Chromium (Playwright) | Navegador que a análise usa            | `npx playwright install --with-deps chromium` (passo 8)                                     |

Você também precisa de uma **conta no GitHub** com acesso aos repositórios `JfmBR/emagvalid` e `JfmBR/emagvalid-docs` (peça ao João).

Antes de tudo, atualize a lista de pacotes:

```bash
sudo apt update
```

### 1. Git

```bash
sudo apt install git curl
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Use o mesmo e-mail da conta do GitHub. O `curl` é usado no passo 2.

### 2. Node.js 26 com o nvm

O `apt` do Debian e do Ubuntu traz um Node.js antigo. Use o **nvm**, que instala a versão que o projeto pede (o arquivo `.nvmrc` diz `26`):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.41.0/install.sh | bash
```

Feche e abra o terminal e rode:

```bash
nvm install 26
nvm alias default 26
node -v
```

O `node -v` deve começar com `v26`. O `npm` vem junto. Dentro da pasta do projeto, `nvm use` lê o `.nvmrc` e troca para a versão certa. Se sair uma versão mais nova do nvm, o comando atualizado está em [github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm), seção "Installing and Updating".

### 3. Docker e Compose

No **Debian 13**:

```bash
sudo apt install docker.io docker-compose
```

No **Ubuntu 24.04**, o pacote do Compose tem outro nome:

```bash
sudo apt install docker.io docker-compose-v2
```

Os dois trazem o comando `docker compose` (com espaço), que o projeto usa em `npm run db:up`. Depois, para usar o Docker sem `sudo`:

```bash
sudo usermod -aG docker $USER
```

**Saia da sessão e entre de novo** (ou reinicie) e teste:

```bash
docker run hello-world
docker compose version
```

Aqui não é preciso o Docker Desktop: o Docker roda como serviço e liga sozinho com o computador. Quem preferir a versão mais nova pode usar o repositório oficial do Docker ([docs.docker.com/engine/install/debian](https://docs.docker.com/engine/install/debian/)); não misture as duas formas.

### 4. VS Code

1. Baixe o `.deb` em [code.visualstudio.com/download](https://code.visualstudio.com/download).
2. Instale pelo terminal, na pasta onde o arquivo foi salvo:

```bash
sudo apt install ./code_*.deb
```

3. Extensões recomendadas: **Prettier** (formatação), **Prisma** (esquema do banco) e **oxc** (lint).

### 5. DBeaver Community

1. Baixe o `.deb` da versão **Community** para Linux em [dbeaver.io/download](https://dbeaver.io/download/). O pacote já traz o Java.
2. Instale pelo terminal, na pasta onde o arquivo foi salvo:

```bash
sudo apt install ./dbeaver-ce*.deb
```

3. A conexão com o banco local está no [`README.md`](../README.md), "Como rodar": PostgreSQL, host `localhost`, porta `5432` e o banco, o usuário e a senha do `docker-compose.yml`.
4. Use o DBeaver só para ver e testar dados. Mudança nas tabelas é pelo `apps/api/prisma/schema.prisma` e uma migração.

### 6. Orca (leitor de tela)

1. No GNOME (padrão do Debian e do Ubuntu), o Orca já vem instalado: liga e desliga com `Super+Alt+S`.
2. Se não estiver instalado:

```bash
sudo apt install orca
```

3. Teste no **Firefox**, que é o navegador que funciona melhor com o Orca.
4. A persona do projeto usa o **NVDA**, que só existe no Windows. Antes de 04/12, faça ao menos uma rodada de testes com o NVDA num Windows (Passo 12 do [passo a passo](passo-a-passo-mvp.md)).

### 7. Baixar os repositórios

Os dois repositórios ficam lado a lado numa pasta `projeto_integrador` (o código procura a documentação em `../emagvalid_docs/`):

```bash
mkdir -p ~/projeto_integrador
cd ~/projeto_integrador
git clone https://github.com/JfmBR/emagvalid.git emagvalid
git clone https://github.com/JfmBR/emagvalid-docs.git emagvalid_docs
```

Atenção: a pasta da documentação é `emagvalid_docs`, **com sublinhado**. Se o Git pedir senha, use um _token_ do GitHub, não a senha da conta (GitHub → Settings → Developer settings → Personal access tokens), ou configure uma chave SSH e clone com `git@github.com:...`.

### 8. Instalar as dependências e rodar

```bash
cd ~/projeto_integrador/emagvalid
npm install
cp .env.example .env
npm run db:up
npm run db:migrate -w apps/api
npx playwright install --with-deps chromium
npm run dev
```

| Comando                                       | O que faz                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm install`                                 | Baixa as bibliotecas do projeto (pasta `node_modules`)                                         |
| `cp .env.example .env`                        | Cria o seu `.env`; ele não entra no git                                                        |
| `npm run db:up`                               | Liga o PostgreSQL no Docker                                                                    |
| `npm run db:migrate -w apps/api`              | Cria as tabelas no banco                                                                       |
| `npx playwright install --with-deps chromium` | Baixa o navegador e as bibliotecas do sistema que ele usa (pede a senha do `sudo`; só uma vez) |
| `npm run dev`                                 | Sobe a API e o front-end                                                                       |

No Linux, o `--with-deps` é necessário: sem ele, o Chromium do Playwright pode não abrir por falta de bibliotecas do sistema.

### 9. Conferir

1. Abra [http://localhost:5173](http://localhost:5173): deve aparecer **"API conectada."**
2. Para parar, `Ctrl+C` no terminal; para desligar o banco, `npm run db:down`.
3. Versões instaladas:

```bash
git --version
node -v
npm -v
docker --version
docker compose version
```

### Problemas comuns no Linux

| Mensagem                                                                | O que fazer                                                                                                          |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `nvm: command not found`                                                | Feche e abra o terminal depois de instalar o nvm                                                                     |
| `permission denied while trying to connect to the Docker daemon socket` | Faltou o `usermod -aG docker $USER` ou sair e entrar de novo na sessão                                               |
| `docker: 'compose' is not a docker command`                             | Falta o pacote do Compose: `docker-compose` no Debian 13, `docker-compose-v2` no Ubuntu 24.04                        |
| `npm run db:migrate` diz que não alcança o banco em `localhost:5432`    | O banco não está ligado (`npm run db:up`) ou outro PostgreSQL já usa a porta 5432 (`sudo systemctl stop postgresql`) |
| O Playwright diz `Host system is missing dependencies`                  | Rode `npx playwright install-deps chromium`                                                                          |
| Moveu ou renomeou a pasta do projeto e algo parou de funcionar          | Rode `npm install` de novo                                                                                           |
| A tela mostra "API indisponível."                                       | Veja no terminal se a API subiu sem erro e se o `.env` existe na raiz de `emagvalid`                                 |
