import { test, expect } from '@playwright/test';

// Root (/) must NEVER render overlays, even if ?app= is present.
test('root never renders overlays', async ({ page }) => {
  await page.goto('/?app=yallbrary');
  await page.waitForTimeout(800); // allow any stray mounts
  await expect(page.locator('[data-testid="overlay-root"]')).toHaveCount(0);
  await expect(page.locator('[role="dialog"]')).toHaveCount(0);
});

// Dashboard MUST render overlays when ?app= is present.
test('dashboard renders overlays', async ({ page }) => {
  await page.goto('/dashboard?app=yallbrary');
  await expect(page.locator('[data-testid="overlay-root"], [role="dialog"]')).toBeVisible();
});
