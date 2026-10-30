import { defineConfig, devices } from '@playwright/test'

/**
 * Pruebas de punta a punta: una tienda de verdad (API + Postgres + Next) y un
 * navegador que compra en ella. En el CI corren después del build; en local:
 *
 *   npm run e2e      (con la API en :4000 y la web en :3000 ya levantadas)
 *
 * Las tiendas se abren en <subdominio>.localhost, que Chromium resuelve solo.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    locale: 'es-CO',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Chromium preinstalado en algunos entornos; si no, el de `npx playwright install`.
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
})
