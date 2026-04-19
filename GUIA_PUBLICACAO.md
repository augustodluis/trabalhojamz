# Guia passo a passo — Pôr o Trabalho Já MZ no ar

> Este guia é para quem **nunca** fez deploy de um site, nunca usou Google Apps Script e nunca mexeu em Git. Siga tudo na ordem, sem saltar.
>
> Tempo estimado: **30 a 45 minutos** na primeira vez.
>
> Vai precisar de: uma **conta Google** (Gmail) e uma **conta GitHub** (grátis em https://github.com/signup).

---

## Índice

1. [Preparação (5 min)](#parte-0--preparação)
2. [Criar a Google Sheet (3 min)](#parte-1--criar-a-google-sheet)
3. [Criar o backend no Apps Script (10 min)](#parte-2--criar-o-backend-google-apps-script)
4. [Ligar o site ao backend (2 min)](#parte-3--ligar-o-site-ao-backend)
5. [Publicar no GitHub Pages (15 min)](#parte-4--publicar-no-github-pages)
6. [Testar tudo (5 min)](#parte-5--testar-tudo)
7. [Problemas comuns](#problemas-comuns-faq)

---

## Parte 0 — Preparação

### 0.1. Verificar que tem as contas certas

- **Conta Google** (Gmail): precisa para criar Sheets e Apps Script. Se já tem Gmail, já tem.
- **Conta GitHub**: crie grátis em [github.com/signup](https://github.com/signup). Guarde o **username** (ex.: `augustodluis`) — vai aparecer na URL do site.

### 0.2. Instalar o Git (para publicar o código)

Vai enviar os ficheiros da plataforma para o GitHub. Tem **duas opções**:

**Opção A — GitHub Desktop (recomendado para iniciantes, clica-se tudo):**
1. Descarregue em [desktop.github.com](https://desktop.github.com/).
2. Instale, abra, faça login com a sua conta GitHub.

**Opção B — Git via linha de comando:**
- Windows: [git-scm.com/download/win](https://git-scm.com/download/win)
- Mac: abra o Terminal e escreva `git --version` (instala automaticamente) ou `brew install git`
- Linux: `sudo apt install git`

Neste guia vou mostrar os dois caminhos nos pontos críticos.

### 0.3. Localizar a pasta do projeto

A pasta **TrabalhoJaMZ/** já está no seu computador (foi onde criámos tudo). Abra-a uma vez para confirmar que contém:

```
TrabalhoJaMZ/
├── index.html
├── manifest.webmanifest
├── apps-script/Code.gs        ← vai precisar deste
├── assets/js/api.js           ← vai precisar editar este
├── .github/workflows/deploy.yml
└── ... (restantes ficheiros)
```

---

## Parte 1 — Criar a Google Sheet

### 1.1. Abrir o Google Sheets

1. Abra o browser e vá a https://sheets.google.com
2. Faça login com a sua conta Google (se já não estiver).
3. Clique no **`+` (em branco)** do canto superior esquerdo para criar uma folha nova.

### 1.2. Dar nome à folha

No topo, onde diz **"Untitled spreadsheet"**, clique e escreva:
```
Trabalho Ja MZ - Base de Dados
```
Enter para guardar. O Google guarda automaticamente na sua Drive.

### 1.3. (Opcional) Criar as abas manualmente

O Apps Script cria as abas sozinho na primeira submissão, mas se quiser pode criá-las já:

- Em baixo, onde aparece **"Sheet1"**, faça **duplo clique** e renomeie para `workers`.
- Clique no **`+`** ao lado do nome para criar outra aba; renomeie para `jobs`.

### 1.4. Copiar o SHEET_ID

Olhe para a URL do browser. Ela parece-se com:

```
https://docs.google.com/spreadsheets/d/1LpR5tWncyr4_n0LL8N2fS69T6SpDPeQi6Ejjdz3wn4o/edit#gid=0
                                      └───────────── SHEET_ID ─────────────────────┘
```

**O SHEET_ID é a parte entre `/d/` e `/edit`**. No exemplo acima é:
```
1LpR5tWncyr4_n0LL8N2fS69T6SpDPeQi6Ejjdz3wn4o
```

✅ **Copie esse valor** (selecione com o rato + Ctrl/Cmd+C) e **cole num ficheiro de texto** à parte — vai precisar já a seguir. Chamemos-lhe **SHEET_ID**.

---

## Parte 2 — Criar o backend Google Apps Script

O Apps Script é um pequeno programa que corre nos servidores gratuitos do Google e permite ao site **escrever** na sua Sheet.

### 2.1. Abrir o Apps Script

1. Vá a https://script.google.com
2. Login com a mesma conta Google (muito importante — tem de ser a **mesma** dona da Sheet).
3. Clique em **"+ New project"** no canto superior esquerdo.

### 2.2. Colar o código

Abrirá um editor com um ficheiro `Code.gs` e uma função vazia.

1. **Apague tudo** o que está no editor (Ctrl/Cmd+A → Delete).
2. Abra, no seu computador, o ficheiro `TrabalhoJaMZ/apps-script/Code.gs`.
3. **Copie todo o conteúdo** (Ctrl/Cmd+A → Ctrl/Cmd+C).
4. **Cole** no editor do Apps Script (Ctrl/Cmd+V).
5. Carregue **Ctrl/Cmd+S** para guardar. Se pedir nome, escreva `Trabalho Ja MZ API`.

### 2.3. Definir o SHEET_ID como propriedade

1. No painel esquerdo, clique no **ícone de engrenagem ⚙** (**Project Settings**).
2. Desça até **"Script Properties"**.
3. Clique em **"Add script property"**.
4. No campo **Property** escreva exactamente: `SHEET_ID`
5. No campo **Value** cole o **SHEET_ID** que guardou na Parte 1.4.
6. Clique em **"Save script properties"**.

### 2.4. Fazer o Deploy (publicar como Web App)

1. No topo à direita, clique no botão azul **"Deploy"** → **"New deployment"**.
2. Na janela que abre, clique no **ícone de engrenagem ⚙** ao lado de "Select type" e escolha **"Web app"**.
3. Preencha:
   - **Description**: `TJMZ v1`
   - **Execute as**: **Me (o seu email)**
   - **Who has access**: **Anyone** (sem "with Google account" — deixa qualquer pessoa da internet usar o site)
4. Clique em **"Deploy"**.

### 2.5. Autorizar

Na primeira vez o Google pede permissão porque o script vai escrever na sua Sheet:

1. Uma janela abre e diz **"Authorization required"** → clique em **"Authorize access"**.
2. Escolha a sua conta Google.
3. Vai aparecer um **aviso amarelo assustador**: *"Google hasn't verified this app"*. **Isso é normal** — é o seu próprio script. Clique em:
   - **"Advanced"** (pequeno texto em baixo à esquerda)
   - **"Go to Trabalho Ja MZ API (unsafe)"**
4. Na próxima ecrã, clique em **"Allow"**.

### 2.6. Copiar a URL /exec

Depois do deploy aparece uma janela com **"Web app URL"**. Tem esta cara:

```
https://script.google.com/macros/s/AKfycbx-abc123xyzVERYLONG/exec
```

✅ **Copie essa URL completa** (botão **"Copy"**) e **guarde-a no seu ficheiro de texto**. Chamemos-lhe **APPS_SCRIPT_URL**.

Clique **"Done"** para fechar a janela.

---

## Parte 3 — Ligar o site ao backend

Agora tem de dizer ao site qual é a URL do backend.

### 3.1. Abrir o ficheiro api.js

No seu computador, na pasta `TrabalhoJaMZ/assets/js/`, abra o ficheiro **`api.js`** com um editor de texto (Notepad/VS Code/Sublime — qualquer um serve; **não use Word**).

### 3.2. Encontrar a configuração

Por volta da **linha 16–22** tem este bloco:

```javascript
const CONFIG = {
  APPS_SCRIPT_URL: '',
  SHEET_CSV_URL: '',
  REFRESH_MS: 60000,
  VOTES_KEY: 'tjmz_votes_v1'
};
```

### 3.3. Colar a URL

Substitua a linha `APPS_SCRIPT_URL: '',` pela URL que copiou na Parte 2.6:

```javascript
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbx-abc123xyzVERYLONG/exec',
  SHEET_CSV_URL: '',
  REFRESH_MS: 60000,
  VOTES_KEY: 'tjmz_votes_v1'
};
```

**Atenção**: a URL tem de ficar **entre aspas simples** `'...'` e terminar com **vírgula**.

Guarde o ficheiro (Ctrl/Cmd+S).

---

## Parte 4 — Publicar no GitHub Pages

### 4.1. Criar um repositório no GitHub

1. Vá a https://github.com e faça login.
2. No canto superior direito, clique no **`+`** → **"New repository"**.
3. Preencha:
   - **Repository name**: `trabalhojamz`
   - **Description**: `Plataforma de trabalho em Moçambique — open source`
   - **Public** (tem de ser público para o GitHub Pages ser grátis).
   - **NÃO** marque "Add a README" nem ".gitignore" nem "license" (o projeto já tem).
4. Clique em **"Create repository"**.

Vai aparecer uma página com instruções. Guarde-a aberta.

### 4.2. Enviar os ficheiros — Opção A (GitHub Desktop)

1. Abra o **GitHub Desktop**.
2. Menu **File → Add local repository**.
3. Clique em **"Choose…"** e selecione a pasta `TrabalhoJaMZ`.
4. Se disser *"This directory does not appear to be a Git repository"*, clique em **"create a repository"** no link em baixo.
5. Confirme os dados e clique **"Create Repository"**.
6. Em baixo à esquerda, veja a lista de ficheiros marcados. No campo **Summary** escreva:
   `feat: plataforma v2 completa`
7. Clique em **"Commit to main"**.
8. Agora clique em **"Publish repository"** no topo.
9. Desmarque **"Keep this code private"** (tem de ser público).
10. Confirme **Name: trabalhojamz** e clique **"Publish repository"**.

**Pronto**, o código está no GitHub.

### 4.2. Enviar os ficheiros — Opção B (Terminal com git)

Abra um Terminal (Windows: PowerShell; Mac/Linux: Terminal) e navegue até à pasta:

```bash
cd caminho/para/TrabalhoJaMZ
```

Depois execute (substitua `SEU_USER` pelo seu username GitHub):

```bash
git init
git add .
git commit -m "feat: plataforma v2 completa"
git branch -M main
git remote add origin https://github.com/SEU_USER/trabalhojamz.git
git push -u origin main
```

Se pedir password, use um **Personal Access Token** (não a password normal) — crie em [github.com/settings/tokens](https://github.com/settings/tokens).

### 4.3. Activar o GitHub Pages

1. No seu repositório no GitHub, clique em **"Settings"** (separador em cima à direita).
2. No menu esquerdo clique em **"Pages"**.
3. Em **"Build and deployment"** → **"Source"**, escolha **"GitHub Actions"** (NÃO "Deploy from a branch").
4. Pronto. Não precisa clicar mais nada nesta página.

### 4.4. Esperar o deploy automático

O workflow `.github/workflows/deploy.yml` corre automaticamente porque detectou o push:

1. Clique no separador **"Actions"** no topo do repo.
2. Vai ver um workflow a correr (ícone amarelo/laranja).
3. Espere **5 a 10 minutos** na primeira vez (faz npm install, Jest, Playwright, deploy).
4. Quando ficar **verde ✓** em todos os steps, está publicado.

### 4.5. Abrir o site

Volte a **Settings → Pages**. No topo verá:

> **Your site is live at https://SEU_USER.github.io/trabalhojamz/**

Clique nessa URL. **O site está no ar** 🎉.

---

## Parte 5 — Testar tudo

Abra a URL e teste em ordem:

### 5.1. Testar cadastro (escreve na Sheet)
1. Clique em **"Quero Trabalhar"**.
2. Preencha com dados fictícios:
   - Nome: `Teste Um`
   - Sexo: Mulher
   - Telefone: `844000000`
   - Contacto: WhatsApp
   - Província: Sofala → Distrito: Beira
   - Categoria: Construção → Profissão: Pedreira
   - Aceite o aviso e clique **"Submeter Cadastro"**.
3. Deve aparecer **"✅ Cadastro recebido!"**.
4. **Abra a sua Google Sheet** — deve ver uma nova linha na aba `workers` com os dados.

### 5.2. Testar busca e votos
1. Clique em **"Profissionais"**.
2. Deve ver o Teste Um na lista.
3. Clique em **👍**. Deve incrementar o contador.
4. Recarregue a Sheet — a coluna `voto_positivo` do Teste Um passou a 1.

### 5.3. Testar painel estatístico
1. Clique em **"Painel"**.
2. Deve ver o mapa SVG com Sofala colorido em rosa (Maioria Mulheres porque só tem 1 cadastro feminino).
3. Deve ver KPIs: Total: 1 · Mulheres: 1 · Homens: 0.

### 5.4. Testar instalação como App (PWA)
- **No telemóvel**: abra a URL no Chrome. No menu (3 pontos) → **"Add to Home screen"** / **"Instalar app"**.
- **No computador**: aparece um botão **"⬇ Instalar App"** no topo direito.

Se chegou até aqui — **a plataforma está online, funcional e instalável**.

---

## Problemas comuns (FAQ)

### "Cadastro recebido" aparece mas nada na Sheet
- Verifique que colou a URL **completa** em `api.js` (com `/exec` no fim).
- Verifique que o deploy do Apps Script foi feito como **"Anyone"** (não "Anyone with Google account").
- Abra a **Console do browser** (F12 → Console) e procure o erro — normalmente diz qual é o problema.

### "Authorization required" ou CORS error
- Volte ao Apps Script → **Deploy → Manage deployments** → edite → confirme **Who has access: Anyone** → **Deploy** de novo.
- Cada vez que alterar o `Code.gs`, tem de fazer **New version** no deployment, senão o site continua a chamar a versão antiga.

### O Actions falha no GitHub
- Clique no workflow falhado para ver o erro.
- Normalmente é `npm install` que expira — clique em **"Re-run jobs"**.

### Quero actualizar o site depois
- Faça as alterações na pasta local.
- GitHub Desktop: **Commit to main → Push origin**.
- Ou terminal: `git add . && git commit -m "mensagem" && git push`.
- O Actions corre sozinho e publica em ~3 min.

### Quero ver os dados noutra folha (CSV público)
- Na Sheet: **File → Share → Publish to web → CSV**.
- Copie essa URL para `api.js → CONFIG.SHEET_CSV_URL` (usa-se como fallback se o Apps Script estiver em baixo).

### Os números de votos podem ser manipulados?
- O Apps Script valida no servidor e usa `LockService` para evitar race conditions.
- O `localStorage` impede duplo-voto no mesmo browser.
- Para ataques mais sérios (botnets) seria preciso autenticação — por agora, a base é confiança e transparência comunitária.

---

## Resumo mental (para ter na cabeça depois)

```
GOOGLE SHEET ─────────── guarda os dados
     ▲
     │ SpreadsheetApp
     │
APPS SCRIPT ────────────── /exec URL
     ▲
     │ fetch() POST JSON
     │
GITHUB PAGES (estático) ── o site que as pessoas veem
     ▲
     │ git push
     │
O SEU COMPUTADOR ───────── onde edita
```

Boa sorte Augusto! Qualquer erro, abre a Console do browser (F12) — 90% dos problemas dizem-se logo lá.

— Desenvolvido por Augusto Domingos Luís · [tuketulole.com](https://tuketulole.com/)
