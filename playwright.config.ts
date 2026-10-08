import { defineConfig, devices } from '@playwright/test';

// On CI (Linux), use standard Playwright Chromium. On local Windows, use native Edge channel if needed.
const browserChannel = process.env.CI ? undefined : (process.platform === 'win32' ? 'msedge' : undefined);

/**
 * Playwright E2E configuration for Taktic
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: !process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
        channel: browserChannel,
      },
    },
    {
      name: 'Mobile Viewport',
      use: {
        ...devices['Pixel 5'],
        channel: browserChannel,
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
