import { test, expect } from '@playwright/test';

test.describe('Deep-links & Panels', () => {
  test('route → auto-opens overlay', async ({ page }) => {
    await page.goto('/orders'); // direct route
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="overlay-title"]')).toContainText(/Orders/i);
  });

  test('overlay → keeps route in URL', async ({ page }) => {
    await page.goto('/?app=orders');
    await page.waitForTimeout(500); // allow sync
    await expect(page).toHaveURL(/\/orders/); // base route synced
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
  });

  test('panel host renders + closes', async ({ page }) => {
    await page.goto('/?role=user&panel=notifications');
    await expect(page.locator('[data-testid="panel-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-title"]')).toContainText(/Notifications/i);

    // Close panel
    await page.getByRole('button', { name: /Close panel/i }).click();
    await expect(page.locator('[data-testid="panel-root"]')).toHaveCount(0);
  });

  test('panel is role-gated', async ({ page }) => {
    await page.goto('/?role=anonymous&panel=crm');
    await expect(page.locator('[data-testid="panel-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="panel-403"]')).toBeVisible();
  });

  test('overlay closes on click-outside + ESC (regression)', async ({ page }) => {
    await page.goto('/?app=yallbrary');
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
    
    // click outside (on overlay backdrop)
    const overlay = page.locator('[data-testid="overlay-root"]');
    await overlay.click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="overlay-root"]')).toHaveCount(0);

    // reopen and ESC
    await page.goto('/?app=yallbrary');
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="overlay-root"]')).toHaveCount(0);
  });
});
