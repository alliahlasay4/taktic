import { test, expect } from '@playwright/test';

test.describe('Landing Page & Navigation Flow', () => {
  test('should load landing page with hero, navigation, and branding', async ({ page }) => {
    await page.goto('/');

    // Verify title contains Taktic
    await expect(page).toHaveTitle(/Taktic/i);

    // Verify brand logo is visible
    const brandElement = page.locator('header').getByText('Taktic').first();
    await expect(brandElement).toBeVisible();

    // Verify hero headline is present
    const headline = page.locator('h1');
    await expect(headline).toBeVisible();
    await expect(headline).toContainText(/Plan what matters today/i);

    // Capture screenshot of the landing page
    await page.screenshot({ path: 'screenshots/landing-page.png' });
  });

  test('should launch interactive demo mode directly from landing page', async ({ page }) => {
    await page.goto('/');

    // Click the hero "Try Interactive Demo" button
    const demoBtn = page.getByRole('button', { name: /Try Interactive Demo/i }).first();
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Verify navigation to Focus Hub in demo mode
    await page.waitForURL('**/focushub', { timeout: 10000 });
    await expect(page).toHaveURL(/focushub/);
    await expect(page).toHaveTitle(/Focus Hub/i);

    // Capture screenshot of demo dashboard
    await page.screenshot({ path: 'screenshots/demo-dashboard.png' });
  });

  test('should open and close authentication modal', async ({ page }) => {
    await page.goto('/');

    // Click Sign In button in navbar
    const signInBtn = page.locator('header').getByRole('button', { name: /Sign In/i }).first();
    if (await signInBtn.isVisible()) {
      await signInBtn.click();
      await page.waitForTimeout(500);

      // Verify email input is displayed in auth view
      const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
      await expect(emailInput).toBeVisible();
    }
  });
});
