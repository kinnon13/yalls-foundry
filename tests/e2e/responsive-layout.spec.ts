/**
 * Responsive Layout E2E Tests
 */

import { test, expect } from '@playwright/test';

test.describe('Responsive Layouts', () => {
  test('mobile: bottom nav visible, sidebar hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone size
    await page.goto('/');
    
    await expect(page.locator('[data-testid="nav-bottom"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-sidebar"]')).toHaveCount(0);
  });

  test('desktop: sidebar visible, bottom nav hidden', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    
    await expect(page.locator('[data-testid="nav-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-bottom"]')).toHaveCount(0);
  });

  test('overlay adapts to mobile (bottom sheet style)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/?app=yallbrary');
    
    const overlay = page.locator('[data-testid="overlay-root"]');
    await expect(overlay).toBeVisible();
    
    // Check that it's near full width on mobile
    const width = await overlay.evaluate((el) => {
      const dialog = el.querySelector('div[role="dialog"], div > div');
      return dialog ? (dialog as HTMLElement).clientWidth : 0;
    });
    
    expect(width).toBeGreaterThan(300);
  });

  test('can navigate from bottom nav on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    await page.getByTestId('nav-yallbrary').click();
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible({ timeout: 3000 });
  });
});
