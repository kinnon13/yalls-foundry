/**
 * E2E Tests: Dev HUD
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Dev HUD', () => {
  test('opens with ?dev=1 query param', async ({ page }) => {
    await page.goto(`${BASE_URL}/?dev=1`);
    await page.waitForLoadState('networkidle');

    // Dev HUD should be visible
    await expect(page.getByRole('complementary', { name: /developer hud/i })).toBeVisible();
    await expect(page.getByText(/dev hud/i)).toBeVisible();
  });

  test('displays route info', async ({ page }) => {
    await page.goto(`${BASE_URL}/profile/me?dev=1`);
    await page.waitForLoadState('networkidle');

    const hud = page.getByRole('complementary', { name: /developer hud/i });
    await expect(hud).toBeVisible();

    // Should show route path
    await expect(hud.getByText(/\/profile\/me/i)).toBeVisible();
  });

  test('closes with X button', async ({ page }) => {
    await page.goto(`${BASE_URL}/?dev=1`);
    await page.waitForLoadState('networkidle');

    const hud = page.getByRole('complementary', { name: /developer hud/i });
    await expect(hud).toBeVisible();

    // Close button
    await page.getByRole('button', { name: /close dev hud/i }).click();
    await expect(hud).not.toBeVisible();
  });

  test('quick links navigate to admin pages', async ({ page }) => {
    await page.goto(`${BASE_URL}/?dev=1`);
    await page.waitForLoadState('networkidle');

    const hud = page.getByRole('complementary', { name: /developer hud/i });
    
    // Click Features link
    const featuresLink = hud.getByRole('link', { name: /^features$/i });
    await expect(featuresLink).toHaveAttribute('href', '/admin/features');
  });
});
