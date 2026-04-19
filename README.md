# Trabalho Já MZ

> **Ligamos talento local a oportunidades reais em Moçambique.**
> Plataforma **open source**, **grátis**, **sem backend pago**, que corre em **GitHub Pages** e usa **Google Sheets** como base de dados.

**Site ao vivo:** <https://augustodluis.github.io/trabalhojamz/>

![Bandeira](https://img.shields.io/badge/Moçambique-Open_Source-007168?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-instalável-FCD116?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-CE1126?style=flat-square)
![Tests](https://img.shields.io/badge/tests-Jest_%7C_Playwright-000000?style=flat-square)

---

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Arquitetura](#arquitetura)
- [Stack técnica](#stack-técnica)
- [Como rodar localmente](#como-rodar-localmente)
- [Configurar o backend (Google Apps Script)](#configurar-o-backend-google-apps-script)
- [Estrutura da Google Sheet](#estrutura-da-google-sheet)
- [Deploy no GitHub Pages](#deploy-no-github-pages)
- [Testes](#testes)
- [Contribuir](#contribuir)
- [Aviso de responsabilidade](#aviso-de-responsabilidade)
- [Desenvolvedor](#desenvolvedor)

---

## Visão geral

Muitos jovens moçambicanos sabem trabalhar, mas poucas oportunidades chegam até eles. Esta plataforma fecha essa lacuna em **11 províncias** — do KaMpfumu (Maputo Cidade) a Palma (Cabo Delgado) — sem cobrar nada a trabalhadores ou contratadores.

## Funcionalidades

- 🟢 **Cadastro de trabalhador** com validação (nome, sexo, 9-dígitos, província/distrito, categoria, profissão, descrição, GPS opcional).
- 🟡 **Pedidos de contratação** com urgência e valor.
- 🔴 **Busca filtrável** por província, profissão, distrito ou bairro.
- ⚫ **Sistema de votos** 👍/👎 — cada clique é somado na Google Sheet. Sinaliza perfis bons ou problemáticos.
- ⚪ **Flag WhatsApp vs. Chamadas** — utilizadores indicam se o número recebe WhatsApp.
- 📊 **Painel estatístico** com **mapa SVG de Moçambique** mostrando desigualdade de género por província (mulheres vs. homens cadastrados).
- 📍 **Mapa GPS** (Leaflet + OpenStreetMap) — localização geográfica opcional.
- 📱 **Progressive Web App (PWA)** — instalável com shortcut no ecrã, funciona offline (assets cached).
- 🔎 **SEO otimizado** — meta tags, Open Graph, sitemap.xml, robots.txt, Schema.org.
- 🎨 **Cores oficiais da bandeira de Moçambique** — verde, preto, amarelo, vermelho, branco.
- ✅ **Testes automatizados** — Jest (unit) + Playwright (E2E).
- 🚀 **CI/CD** — GitHub Actions: testes + deploy automático para GitHub Pages.

## Arquitetura

```
┌──────────────────────────┐         ┌──────────────────────────┐
│   GitHub Pages (Static)  │◄────────┤    Google Sheets (DB)    │
│   HTML · CSS · JS · PWA  │  fetch  │  workers, jobs, votes    │
└──────────┬───────────────┘         └────────────▲─────────────┘
           │ POST JSON                             │
           ▼                                       │
┌──────────────────────────┐                       │
│ Google Apps Script Web   │───────────────────────┘
│ App (serverless backend) │
└──────────────────────────┘
```

## Stack técnica

| Camada        | Tecnologia                                     |
|---------------|------------------------------------------------|
| Front-end     | HTML5 · CSS3 · JavaScript Vanilla (ES2020+)    |
| Mapa estatístico | SVG inline com polígonos posicionais         |
| Mapa GPS      | Leaflet 1.9 + OpenStreetMap                    |
| PWA           | Web Manifest + Service Worker (cache-first)    |
| Backend       | Google Apps Script (LockService, SpreadsheetApp) |
| Base de dados | Google Sheets (workers + jobs)                 |
| Testes        | Jest + jsdom + Playwright (Chromium + Pixel 5) |
| CI/CD         | GitHub Actions                                 |
| Hosting       | GitHub Pages                                   |

**Navegador APIs**: `fetch()`, `localStorage`, `navigator.geolocation`, `beforeinstallprompt`, `serviceWorker`.

## Como rodar localmente

```bash
# Clonar
git clone https://github.com/augustodluis/trabalhojamz.git
cd trabalhojamz

# Instalar devDependencies (Jest + Playwright)
npm install

# Servir em http://localhost:8080
npm start
```

Abre `http://localhost:8080`. Todos os dados mostrados (profissionais, pedidos, votos) vêm da Google Sheet real através do backend Apps Script — não há dados simulados. Se a Sheet estiver vazia, a plataforma mostra listas vazias e o painel com contadores a zero.

## Configurar o backend (Google Apps Script)

1. Criar uma Google Sheet nova (em `sheets.google.com`) e copiar o **ID** da URL (entre `/d/` e `/edit`).
2. Ir a [`script.google.com`](https://script.google.com/) → **New project**.
3. Colar o conteúdo de [`apps-script/Code.gs`](apps-script/Code.gs) no `Code.gs`.
4. Em **Project Settings (⚙) → Script Properties**, adicionar:
   - Key: `SHEET_ID`
   - Value: `<ID da sua Google Sheet>`
5. **Deploy → New deployment → Web App**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Clique em **Deploy**, autorize e copie a **URL `/exec`**.
6. Em [`assets/js/api.js`](assets/js/api.js), colar essa URL em `CONFIG.APPS_SCRIPT_URL`.

## Estrutura da Google Sheet

O Apps Script cria as folhas automaticamente na primeira execução. Pode também criá-las manualmente:

**Folha `workers`:**
`id · createdAt · nome · sexo · nascimento · telefone · contato · provincia · distrito · bairro · categoria · profissao · experiencia · descricao · gps_lat · gps_lng · voto_positivo · voto_negativo`

**Folha `jobs`:**
`id · createdAt · nome · telefone · provincia · distrito · bairro · categoria · urgencia · descricao · valor`

## Deploy no GitHub Pages

Automaticamente via GitHub Actions:

1. Faz push para a branch `main`.
2. O workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) corre: **Jest → Playwright → deploy**.
3. Em **Settings → Pages**, seleciona **Source: GitHub Actions**.
4. A plataforma fica em <https://augustodluis.github.io/trabalhojamz/>.

## Testes

```bash
# Unit tests (Jest + jsdom)
npm test

# E2E tests (Playwright — Chromium + mobile Pixel 5)
npm run test:e2e:install   # primeira vez
npm run test:e2e

# Tudo
npm run test:all
```

Cobertura atual: **39 unit tests** (data, api, validation, map) + **9 E2E** (smoke, rotas, formulários, PWA, mapa, acessibilidade).

## Contribuir

Este projeto é aberto e cresce com a comunidade. Formas de ajudar:

- 🐛 Abrir **issues** para bugs ou sugestões.
- 🔀 Fazer **pull requests** com melhorias.
- 💬 Juntar-se à **comunidade no Telegram**: <https://t.me/+bSGJgG6VYLc1MTM8>
- 📢 Divulgar em Moçambique para mais jovens aceder.

Siga o padrão: código limpo, validação, testes.

## Aviso de responsabilidade

> **A plataforma não se responsabiliza pelo uso com segundas intenções das informações aqui partilhadas. Tenha cuidado ao interagir:**
> - Confirme identidades antes de combinar trabalhos.
> - Prefira encontros em locais públicos.
> - Nunca partilhe dados bancários ou códigos M-Pesa/e-Mola.
> - Reporte perfis suspeitos.

## Desenvolvedor

**Augusto Domingos Luís** — Engenheiro de Software Pleno/Sénior

- 📧 [augusto.domingos.luis@gmail.com](mailto:augusto.domingos.luis@gmail.com)
- 📞 +258 844 324 296 (Chamadas & WhatsApp)
- 🌐 [tuketulole.com](https://tuketulole.com/) — mais produtos do dev
- 💬 [Comunidade no Telegram](https://t.me/+bSGJgG6VYLc1MTM8)
- 🐙 [github.com/augustodluis](https://github.com/augustodluis)

---

© 2025–2026 Augusto Domingos Luís · Licença MIT · Feito com ❤ em Moçambique.
