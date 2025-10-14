/**
 * E2E Test: Control Room
 */

import { test, expect } from '@playwright/test';

test.describe('Control Room', () => {
  test('should load control room and run health check', async ({ page }) => {
    // Navigate to control room
    await page.goto('/admin/control-room');
    
    // Verify page loaded
    await expect(page.locator('h1')).toContainText('Control Room');
    
    // Find and click health check button
    const healthButton = page.locator('button', { hasText: 'Run Health Check' });
    await healthButton.click();
    
    // Wait for result and verify OK badge appears
    await expect(page.locator('text=OK (mock)')).toBeVisible({ timeout: 5000 });
  });

  test('should seed mock data and show counts', async ({ page }) => {
    await page.goto('/admin/control-room');
    
    // Click seed profiles button
    await page.locator('button', { hasText: '+10 Profiles' }).click();
    
    // Verify count updated
    await expect(page.locator('text=/Profiles: .*10/')).toBeVisible();
    
    // Click seed events button
    await page.locator('button', { hasText: '+5 Events' }).click();
    
    // Verify count updated
    await expect(page.locator('text=/Events: .*5/')).toBeVisible();
  });

  test('should toggle feature flags', async ({ page }) => {
    await page.goto('/admin/control-room');
    
    // Find a feature flag switch (feed)
    const feedSwitch = page.locator('[id="flag-feed"]');
    
    // Toggle it off
    await feedSwitch.click();
    
    // Reload page
    await page.reload();
    
    // Verify persistence (flag should still be off)
    await expect(feedSwitch).not.toBeChecked();
  });

  test('should run synthetic checks', async ({ page }) => {
    await page.goto('/admin/control-room');
    
    // Click synthetic checks button
    await page.locator('button', { hasText: 'Run Synthetic Checks' }).click();
    
    // Wait for results
    await page.waitForTimeout(1000);
    
    // Verify PASS badges appear
    await expect(page.locator('text=PASS').first()).toBeVisible();
  });
});
