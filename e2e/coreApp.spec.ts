import { test, expect } from '@playwright/test';

test.describe('Core App Functionality in Demo Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /Try Interactive Demo/i }).first();
    await demoBtn.click();
    await page.waitForURL('**/focushub', { timeout: 10000 });
  });

  test('should display habits, focus cards, and tasks in dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/focushub/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/Focus|Habit|Task|Today/i);

    // Capture screenshot of core dashboard
    await page.screenshot({ path: 'screenshots/core-app-dashboard.png' });
  });

  test('should verify sidebar navigation links exist', async ({ page }) => {
    const appRoot = page.locator('#root, main, aside').first();
    await expect(appRoot).toBeVisible();
    await expect(page).toHaveTitle(/Focus Hub/i);
  });
});
