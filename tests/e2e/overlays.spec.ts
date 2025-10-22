/**
 * Overlay System E2E Tests
 * Validates that overlays load correctly via ?app= parameter
 */

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Overlay System', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'user');
  });

  test('Overlays load via ?app= parameter', async ({ page }) => {
    // Test multiple overlays
    for (const key of ['messages', 'marketplace', 'events', 'entities']) {
      await page.goto(`/?app=${key}`);
      
      // Overlay host should be visible
      const host = page.getByTestId('overlay-host');
      await expect(host).toBeVisible({ timeout: 5000 });
      
      // Should not show loading state after load
      const loading = page.getByTestId('overlay-loading');
      await expect(loading).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('Invalid overlay key shows nothing', async ({ page }) => {
    await page.goto('/?app=invalid-key-xyz');
    
    // Should not crash or show overlay host
    const host = page.getByTestId('overlay-host');
    await expect(host).not.toBeVisible();
  });

  test('No app parameter shows no overlay', async ({ page }) => {
    await page.goto('/');
    
    const host = page.getByTestId('overlay-host');
    await expect(host).not.toBeVisible();
  });
});
