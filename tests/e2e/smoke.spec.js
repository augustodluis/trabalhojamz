// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('Smoke — Trabalho Já MZ', () => {

  test('homepage carrega com título e CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Trabalho Já MZ/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Quero Trabalhar/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Preciso Contratar/i }).first()).toBeVisible();
  });

  test('rota #/cadastro exibe formulário de trabalhador', async ({ page }) => {
    await page.goto('/#/cadastro');
    await expect(page.locator('#workerForm')).toBeVisible();
    await expect(page.locator('#wProv')).toBeVisible();
    await expect(page.locator('#wDist')).toBeVisible();
  });

  test('selector de província popula distritos dinamicamente', async ({ page }) => {
    await page.goto('/#/cadastro');
    await page.selectOption('#wProv', 'Sofala');
    // esperar o re-render
    await expect(page.locator('#wDist option[value="Beira"]')).toBeAttached();
  });

  test('validação impede submit com telefone inválido', async ({ page }) => {
    await page.goto('/#/cadastro');
    await page.fill('input[name="nome"]', 'Ana Teste');
    await page.check('input[name="sexo"][value="F"]');
    await page.fill('input[name="telefone"]', '123');
    await page.check('input[name="contato"][value="whatsapp"]');
    await page.selectOption('#wProv', 'Sofala');
    await page.selectOption('#wDist', 'Beira');
    await page.selectOption('#wCat', 'construcao');
    await page.fill('input[name="profissao"]', 'Pedreira');
    await page.check('input[type="checkbox"][required]');
    await page.click('button[type="submit"]');
    await expect(page.locator('#workerStatus.is-error')).toBeVisible();
  });

  test('rota #/buscar mostra lista de profissionais', async ({ page }) => {
    await page.goto('/#/buscar');
    // em modo dev temos dados simulados
    await expect(page.locator('#list .item').first()).toBeVisible({ timeout: 10000 });
  });

  test('rota #/painel renderiza mapa SVG com 11 províncias', async ({ page }) => {
    await page.goto('/#/painel');
    await expect(page.locator('#mzMap svg')).toBeVisible({ timeout: 10000 });
    const count = await page.locator('.province').count();
    expect(count).toBe(11);
  });

  test('manifest PWA é válido', async ({ page, request }) => {
    await page.goto('/');
    const res = await request.get('/manifest.webmanifest');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.name).toContain('Trabalho Já');
    expect(json.display).toBe('standalone');
    expect(json.theme_color).toBe('#007168');
  });

  test('navegação muda classe "active"', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Painel' }).click();
    await expect(page.locator('a.active[data-route="/painel"]')).toBeVisible();
  });

  test('aviso de responsabilidade é visível na home', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/não se responsabiliza/i)).toBeVisible();
  });
});
