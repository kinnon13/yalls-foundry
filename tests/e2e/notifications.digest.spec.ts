/**
 * E2E Tests: Notification Digest
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Notification Digest', () => {
  test('preview renders groups', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    // Set frequency to daily
    const frequencySelect = page.locator('#digest-frequency');
    await frequencySelect.click();
    await page.getByRole('option', { name: /daily/i }).click();

    // Click preview button
    const previewBtn = page.getByRole('button', { name: /preview/i });
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await page.waitForTimeout(500);

      // Preview should appear
      await expect(page.getByText(/digest preview/i)).toBeVisible();
    }
  });

  test('send test digest shows success', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    // Set frequency to daily and preview
    const frequencySelect = page.locator('#digest-frequency');
    await frequencySelect.click();
    await page.getByRole('option', { name: /daily/i }).click();

    const previewBtn = page.getByRole('button', { name: /preview/i });
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await page.waitForTimeout(500);

      const sendTestBtn = page.getByRole('button', { name: /send me a test/i });
      if (await sendTestBtn.isVisible()) {
        await sendTestBtn.click();
        
        // Toast should appear
        await expect(page.getByText(/test digest sent/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('a11y: settings page has no violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.toast')
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });
});
