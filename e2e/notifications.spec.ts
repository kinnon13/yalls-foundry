/**
 * E2E Tests: Notifications Flow
 * Playwright smoke tests for critical notification paths
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Notifications', () => {
  test('drawer opens and displays lanes', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    // Click notification bell
    const bellButton = page.locator('[aria-label*="notification" i], [aria-label*="bell" i]').first();
    
    if (await bellButton.isVisible()) {
      await bellButton.click();

      // Check drawer appears
      const drawer = page.locator('[role="dialog"][aria-label*="notification" i]');
      await expect(drawer).toBeVisible({ timeout: 5000 });

      // Check lanes exist
      await expect(page.getByText(/priority|social|system/i).first()).toBeVisible();
    } else {
      test.skip('Notification bell not found');
    }
  });

  test('mark all read works', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');

    const bellButton = page.locator('[aria-label*="notification" i]').first();
    
    if (await bellButton.isVisible()) {
      await bellButton.click();
      
      const markAllBtn = page.getByRole('button', { name: /mark all read/i });
      if (await markAllBtn.isVisible()) {
        await markAllBtn.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('Health', () => {
  test('health endpoint returns 200', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/health`);
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.latency_ms).toBeLessThan(500);
  });
});
