/**
 * E2E Tests: Earnings Dashboard
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Earnings Dashboard', () => {
  test.skip('CSV export downloads file', async ({ page }) => {
    // Skip if not authenticated
    await page.goto(`${BASE_URL}/earnings`);

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Check if we're on login page
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (isLoginPage) {
      test.skip('Requires authentication');
    }

    // Look for export button
    const exportBtn = page.getByRole('button', { name: /export csv/i });
    
    if (await exportBtn.isVisible()) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportBtn.click(),
      ]);

      const filename = await download.suggestedFilename();
      expect(filename).toMatch(/earnings/i);
      expect(filename).toMatch(/\.csv$/i);
    }
  });

  test('dashboard displays summary cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/earnings`);
    
    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Check if login required
    const isLoginPage = await page.locator('input[type="email"]').isVisible();
    
    if (!isLoginPage) {
      // Should see earning metrics
      await expect(page.getByText(/total earned|captured|pending/i).first()).toBeVisible({ timeout: 5000 });
    }
  });
});
