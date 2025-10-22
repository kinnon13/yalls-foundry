import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4173';

// Root (/) must NEVER render overlays, even if ?app= is present.
test('root does NOT render overlays even with ?app=', async ({ page }) => {
  await page.goto(`${BASE}/?app=yallbrary`);
  await page.waitForTimeout(500);
  const dialogs = await page.locator('[data-testid="overlay-root"], [role="dialog"]').count();
  expect(dialogs).toBe(0);
});

// Dashboard MUST render overlays when ?app= is present.
test('dashboard renders overlays via ?app=', async ({ page }) => {
  await page.goto(`${BASE}/dashboard?app=yallbrary`);
  const overlay = page.locator('[data-testid="overlay-root"], [role="dialog"]');
  await expect(overlay).toBeVisible();
});

// Overview should be user-accessible (no 403 screen)
test('overview app is user-accessible (no 403)', async ({ page }) => {
  await page.goto(`${BASE}/dashboard?app=overview`);
  const forbidden = page.locator('text=/403|forbidden|not authorized/i');
  await expect(forbidden).toHaveCount(0);
});
