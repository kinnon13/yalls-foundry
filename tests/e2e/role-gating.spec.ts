import { test, expect } from '@playwright/test';

test.describe('Overlay role gating', () => {
  test('anonymous is blocked from admin overlays (CRM)', async ({ page }) => {
    // Manually open overlay to test gating (bypass hidden nav)
    await page.goto('/?role=anonymous&app=crm');
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="overlay-403"]')).toBeVisible();
    await expect(page.locator('[data-testid="overlay-title"]')).toContainText(/CRM/i);
  });

  test('user can open Yallbrary overlay', async ({ page }) => {
    await page.goto('/?role=user');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByTestId('nav-yallbrary').click();
    await expect(page.locator('[data-testid="overlay-title"]')).toContainText('Yallbrary');
    await expect(page.locator('[data-testid="overlay-403"]')).toHaveCount(0);
  });

  test('admin can open CRM overlay', async ({ page }) => {
    await page.goto('/?role=admin&app=crm');
    await expect(page.locator('[data-testid="overlay-title"]')).toContainText('CRM');
    await expect(page.locator('[data-testid="overlay-403"]')).toHaveCount(0);
  });
});
