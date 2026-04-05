import { defineConfig, devices } from '@playwright/test';

/**
 * E2E test configuration.
 *
 * Usage:
 *   npx playwright test              — run all e2e tests (starts dev server automatically)
 *   E2E_BASE_URL=https://staging.example.com npx playwright test — run against staging
 *   npx playwright test --ui         — interactive UI mode
 *
 * The dev server is started automatically unless E2E_BASE_URL is set.
 * All Supabase API calls are mocked within each test using page.route().
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start the Vite dev server when no external URL is provided
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
