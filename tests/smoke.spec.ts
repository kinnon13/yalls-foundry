import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('home loads and scrolls', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await page.mouse.wheel(0, 1500);
    // Verify page is responsive
    await page.waitForTimeout(500);
  });

  test('dashboard overview shows NBAs', async ({ page }) => {
    await page.goto('/dashboard?m=overview');
    await expect(
      page.getByText(/Next Best Actions|Overview/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('earnings module renders', async ({ page }) => {
    await page.goto('/dashboard?m=earnings');
    await expect(page.getByText(/Earnings/i)).toBeVisible({ timeout: 10000 });
  });

  test('incentives list', async ({ page }) => {
    await page.goto('/dashboard?m=incentives');
    await expect(
      page.getByText(/Incentive Programs/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('farm ops renders', async ({ page }) => {
    await page.goto('/dashboard?m=farm-ops');
    await expect(
      page.getByText(/Barn Dashboard/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('messages page loads', async ({ page }) => {
    await page.goto('/messages');
    await expect(page.getByText(/Notifications/i)).toBeVisible({ timeout: 10000 });
  });

  test('discover page loads', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.locator('body')).toBeVisible();
  });
});
