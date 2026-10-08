import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Taktic
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on',
    screenshot: 'on',
    video: 'off',
  },
  projects: [
    {
      name: 'Desktop Browser',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'msedge',
      },
    },
    {
      name: 'Mobile Viewport',
      use: {
        ...devices['Pixel 5'],
        channel: 'msedge',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
