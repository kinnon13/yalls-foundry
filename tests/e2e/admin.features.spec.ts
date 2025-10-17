/**
 * E2E Tests: Feature Index Admin
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Feature Index', () => {
  test('displays all features with filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/features`);
    await page.waitForLoadState('networkidle');

    // Check header
    await expect(page.getByRole('heading', { name: /feature index/i })).toBeVisible();

    // Check summary cards
    await expect(page.getByText(/shell/i)).toBeVisible();
    await expect(page.getByText(/full ui/i)).toBeVisible();
    await expect(page.getByText(/wired/i)).toBeVisible();

    // Check filters exist
    await expect(page.getByPlaceholder(/search features/i)).toBeVisible();
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('search filters features', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/features`);
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/search features/i);
    await searchInput.fill('notification');

    // Should show notification-related features
    await expect(page.getByText(/notification lanes/i)).toBeVisible();
  });

  test('area filter works', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/features`);
    await page.waitForLoadState('networkidle');

    // Open area filter
    const areaSelect = page.getByRole('combobox').first();
    await areaSelect.click();
    
    await page.getByRole('option', { name: /profile/i }).click();

    // Should show only profile features
    await expect(page.getByText(/profile pins/i)).toBeVisible();
  });

  test('a11y: no violations', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/features`);
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('.toast')
      .analyze();

    expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
  });
});
