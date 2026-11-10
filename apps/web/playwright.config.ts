import { defineConfig, devices } from '@playwright/test'

// Testes de ponta a ponta das telas (pasta e2e/), com axe para acessibilidade.
// Os testes de unidade continuam no Vitest (src/**/*.test.tsx).
export default defineConfig({
  testDir: 'e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Porta própria e sem reaproveitar servidor: o e2e nunca testa outro app que esteja na 5173
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
  },
})
