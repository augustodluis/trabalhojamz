# O que falta - checklist rapido

Augusto, avancei ao maximo do que consigo sem estar dentro do teu browser. Sobra um passo manual: publicar no GitHub Pages. Nada mais.

## Ja esta feito

- [x] SHEET_ID `1LpR5tWncyr4_n0LL8N2fS69T6SpDPeQi6Ejjdz3wn4o` embutido no `apps-script/Code.gs` (constante `DEFAULT_SHEET_ID`).
- [x] O backend `Code.gs` ja le pedidos POST como formulario URL-encoded (`e.parameter.action` e `e.parameter.payload`), que e o que o cliente envia para sobreviver ao redirect do Apps Script.
- [x] A URL do teu deploy mais recente ja esta colada em `assets/js/api.js`:
      `https://script.google.com/macros/s/AKfycbz-TqH47GHoR_mA5-ZNIARpDLKc4avHnbeDC1eKKF9fU5IcBgdLpPso-7FbQZLvb7hf/exec`
- [x] Cliente `api.js` envia os dados como `URLSearchParams` em vez de JSON puro.
- [x] Os 39 testes unitarios passam.
- [x] Workflow de CI/CD pronto em `.github/workflows/deploy.yml`.
- [x] Todos os comentarios do codigo foram humanizados: explicam o que o codigo faz, sem emojis nem separadores decorativos.

## Passo 1 - Tornar a Sheet legivel publicamente (30 segundos)

Necessario para o site conseguir ler dados sem precisar do Apps Script:

1. Abre a Sheet: https://docs.google.com/spreadsheets/d/1LpR5tWncyr4_n0LL8N2fS69T6SpDPeQi6Ejjdz3wn4o/edit
2. Canto superior direito - **Share** (botao azul).
3. Em baixo, onde diz "General access", muda de **Restricted** para **Anyone with the link**.
4. Role: **Viewer**.
5. **Done**.

Porque? O endpoint gviz (que o site usa para ler) so funciona se a Sheet for visivel por link. Apenas quem tiver o link consegue ver; ninguem consegue editar.

## Passo 2 - Publicar no GitHub Pages (10 minutos)

1. Vai a https://github.com/new e cria um repositorio **publico** chamado `trabalhojamz`. Nao marques nenhuma opcao extra.
2. Abre o **GitHub Desktop** (ou terminal).

**Opcao A (GitHub Desktop):**
   - File - Add local repository - escolhe a pasta `TrabalhoJaMZ` - "create a repository".
   - Commit: `feat: plataforma v2`.
   - **Publish repository** (desmarca "private").

**Opcao B (terminal):**

```bash
cd /caminho/TrabalhoJaMZ
git init
git add .
git commit -m "feat: plataforma v2"
git branch -M main
git remote add origin https://github.com/augustodluis/trabalhojamz.git
git push -u origin main
```

3. No GitHub, dentro do repositorio: **Settings - Pages - Source: GitHub Actions**.
4. Separador **Actions** - espera que o workflow fique verde (cerca de 5 a 10 minutos).
5. Volta a **Settings - Pages** - a URL final do site aparece no topo.

## Se o cadastro falhar apos publicar

- Abre a **Console do browser** (F12) e ve a mensagem de erro.
- Confirma que a URL em `assets/js/api.js` corresponde ao ultimo deploy do Apps Script. Sempre que fizeres novo deploy, a URL muda e o site precisa de ser actualizado.
- Verifica que o deploy do Apps Script esta com "Who has access: Anyone" (nao "Anyone with Google account").
- Verifica que a Sheet continua partilhada como "Anyone with link" - Viewer.

Qualquer duvida, manda screenshot da Console do browser.

- Augusto Domingos Luis
