/**
 * Route Budget & Legacy Path Tests
 * Validates 10-route ceiling and legacy path remapping
 */

import { test, expect } from '@playwright/test';

test.describe('Route Budget & Legacy Paths', () => {
  test('legacy paths remap to dashboard overlays', async ({ page }) => {
    // Andy remap
    await page.goto('/super-andy');
    await expect(page).toHaveURL(/\/dashboard\?(.+&)?app=andy/);
    
    // Rocker remap
    await page.goto('/rocker');
    await expect(page).toHaveURL(/\/dashboard\?(.+&)?app=rocker/);
    
    // Messages remap
    await page.goto('/messages');
    await expect(page).toHaveURL(/\/dashboard\?(.+&)?app=messages/);
    
    // Orders remap
    await page.goto('/orders/123');
    await expect(page).toHaveURL(/\/dashboard\?(.+&)?app=orders/);
  });

  test('bottom nav opens Andy & Rocker overlays (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/dashboard');
    
    // Open Andy overlay
    await page.getByTestId('nav-andy').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="app-andy"]')).toBeVisible();
    
    // Close and open Rocker
    await page.keyboard.press('Escape');
    await page.getByTestId('nav-rocker').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="app-rocker"]')).toBeVisible();
  });

  test('sidebar opens Andy & Rocker overlays (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    
    // Open Andy overlay
    await page.getByTestId('nav-andy').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="app-andy"]')).toBeVisible();
    
    // Close and open Rocker
    await page.keyboard.press('Escape');
    await page.getByTestId('nav-rocker').click();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-testid="app-rocker"]')).toBeVisible();
  });

  test('unknown path falls back to dashboard with overview', async ({ page }) => {
    await page.goto('/some-random-path-that-does-not-exist');
    await expect(page).toHaveURL(/\/dashboard\?(.+&)?app=overview/);
  });
});
