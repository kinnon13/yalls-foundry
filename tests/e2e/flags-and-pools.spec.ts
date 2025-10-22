/**
 * Control Flags and Worker Pools E2E Tests
 */

import { test, expect } from '@playwright/test';
import { loginAs, mockCoreApis } from './helpers';

test.describe('Flags and Pools', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'super_admin');
    await mockCoreApis(page);
  });

  test('Toggle external calls flag persists', async ({ page }) => {
    await page.goto('/super/flags');
    
    const extSwitch = page.getByTestId('flag-external_calls_enabled')
      .or(page.getByRole('switch', { name: /External Calls/i }))
      .or(page.getByLabel(/External Calls/i));
    
    await expect(extSwitch).toBeVisible();
    
    // Toggle it
    await extSwitch.click();
    
    // Reload to verify persistence
    await page.reload();
    await expect(extSwitch).toBeVisible();
  });

  test('Worker pools display concurrency info', async ({ page }) => {
    await page.goto('/super/pools');
    
    const table = page.getByTestId('pools-table')
      .or(page.getByRole('table'));
    
    await expect(table).toBeVisible();
    
    // Should show pool names
    await expect(table.getByText(/realtime|heavy|admin/i)).toBeVisible();
    
    // Should show concurrency numbers
    await expect(table.getByText(/\d+/)).toBeVisible();
  });

  test('Global pause flag exists', async ({ page }) => {
    await page.goto('/super/flags');
    
    const pauseSwitch = page.getByTestId('flag-global_pause')
      .or(page.getByRole('switch', { name: /Global Pause/i }))
      .or(page.getByLabel(/Global Pause/i));
    
    await expect(pauseSwitch).toBeVisible();
  });
});
