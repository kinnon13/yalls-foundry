import { test, expect } from '@playwright/test';

test('User Rocker opens in center from nav', async ({ page }) => {
  await page.goto('/?role=user');
  await page.getByTestId('nav-rocker').click();
  await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
  await expect(page.locator('[data-testid="app-rocker"]')).toBeVisible();
});

test('Admin Rocker requires admin role', async ({ page }) => {
  await page.goto('/?role=user&app=admin-rocker');
  await expect(page.locator('[data-testid="overlay-403"]')).toBeVisible();

  await page.goto('/?role=admin&app=admin-rocker');
  await expect(page.locator('[data-testid="app-admin-rocker"]')).toBeVisible();
});

test('Rocker deep-link redirects to overlay', async ({ page }) => {
  await page.goto('/rocker');
  await expect(page).toHaveURL(/app=rocker/);
  await expect(page.locator('[data-testid="app-rocker"]')).toBeVisible();
});
