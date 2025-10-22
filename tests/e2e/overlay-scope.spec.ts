/**
 * Overlay Scope Tests - Step 1 Verification
 * Ensures overlays only work on /dashboard, not on /
 */

import { test, expect } from '@playwright/test';

test('root does not render overlays', async ({ page }) => {
  await page.goto('/?app=yallbrary');
  // Overlay should not appear on root
  await page.waitForTimeout(1000);
  const overlayCount = await page.locator('[role="dialog"]').count();
  expect(overlayCount).toBe(0);
});

test('dashboard renders overlays', async ({ page }) => {
  await page.goto('/dashboard?app=yallbrary');
  // Wait for overlay to mount
  await page.waitForTimeout(1500);
  const overlay = page.locator('[role="dialog"]');
  await expect(overlay).toBeVisible();
});

test('overview is user-accessible', async ({ page }) => {
  await page.goto('/dashboard?app=overview');
  await page.waitForTimeout(1500);
  // Should not show 403 error
  const forbidden = page.locator('text=/403|forbidden|not authorized/i');
  await expect(forbidden).toHaveCount(0);
});
