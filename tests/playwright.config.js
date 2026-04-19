// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: '../playwright-report', open: 'never' }], ['list']],

  use: {
    baseURL: 'http://127.0.0.1:8080',
    trace: 'on-first-retry',
    viewport: { width: 1280, height: 900 }
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile',   use: { ...devices['Pixel 5'] } }
  ],

  webServer: {
    command: 'npx serve . -l 8080',
    cwd: '..',
    port: 8080,
    reuseExistingServer: !process.env.CI,
    timeout: 60000
  }
});
