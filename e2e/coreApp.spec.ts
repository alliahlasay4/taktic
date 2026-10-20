import { test, expect } from '@playwright/test';

test.describe('Core App Functionality in Demo Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Seed onboarding completed so the modal does not overlay dashboard interactions
    await page.addInitScript(() => {
      window.localStorage.setItem('taktic_onboarding_completed', 'true');
    });

    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /Try Interactive Demo/i }).first();
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();
    await expect(page).toHaveURL(/focushub/);
  });

  test('should display habits, focus cards, and tasks in dashboard', async ({ page }) => {
    await expect(page).toHaveURL(/focushub/);

    // Verify key sections are present
    await expect(page.getByRole('heading', { name: /Welcome back/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Today's Priority Focus Queue/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Habit Rhythm Checklist/i })).toBeVisible();
  });

  test('should verify sidebar navigation links exist (desktop & mobile)', async ({ page, isMobile }) => {
    if (isMobile) {
      const openDrawerBtn = page.getByRole('button', { name: /Open Navigation Drawer/i });
      await expect(openDrawerBtn).toBeVisible();
      await openDrawerBtn.click();
    }

    const mainNav = page.getByRole('navigation', { name: /Main Navigation/i });
    await expect(mainNav).toBeVisible();

    // Verify navigating to Inbox
    const inboxBtn = mainNav.getByRole('button', { name: /Inbox & Planning/i });
    await expect(inboxBtn).toBeVisible();
    await inboxBtn.click();

    await expect(page).toHaveURL(/\/inbox/);
    await expect(page).toHaveTitle(/Inbox & Planning/i);
  });
});
