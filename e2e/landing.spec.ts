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
    await expect(headline).toContainText(/Focus on what matters today/i);
  });

  test('should launch interactive demo mode directly from landing page', async ({ page }) => {
    await page.goto('/');

    // Click the hero "Try Interactive Demo" button
    const demoBtn = page.getByRole('button', { name: /Try Interactive Demo/i }).first();
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Verify navigation to Focus Hub in demo mode
    await expect(page).toHaveURL(/focushub/);
    await expect(page).toHaveTitle(/Focus Hub/i);
  });

  test('should navigate to Sign In portal and return to landing page', async ({ page }) => {
    await page.goto('/');

    // Click Sign In button in header
    const signInBtn = page.locator('header').getByRole('button', { name: /Sign In/i });
    await expect(signInBtn).toBeVisible();
    await signInBtn.click();

    // Verify authentication portal renders
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /Login/i })).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();

    // Verify returning back to landing page via Back to Home button
    const backBtn = page.getByRole('button', { name: 'Back to Home' }).or(page.getByRole('button', { name: 'Home', exact: true })).first();
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page).toHaveURL(/\/landing/);
    await expect(page.getByRole('heading', { name: /Focus on what matters today/i })).toBeVisible();
  });
});
