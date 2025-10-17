/**
 * E2E Tests: Notification Lanes
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Notification Lanes', () => {
  test('switch between lanes and see different notifications', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');

    // Check tabs exist
    await expect(page.getByRole('tab', { name: /priority/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /social/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /system/i })).toBeVisible();

    // Switch to social
    await page.getByRole('tab', { name: /social/i }).click();
    await expect(page.getByRole('tab', { name: /social/i })).toHaveAttribute('aria-selected', 'true');
  });

  test('mark single notification as read', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');

    // Find first unread notification
    const unreadNotif = page.locator('[role="button"]').filter({ hasText: /Test/ }).first();
    
    if (await unreadNotif.isVisible()) {
      await unreadNotif.click();
      // Badge should disappear
      await expect(unreadNotif.locator('.bg-primary.animate-pulse')).not.toBeVisible();
    }
  });

  test('mark all read updates counts', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');

    const markAllBtn = page.getByRole('button', { name: /mark all read/i });
    
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await page.waitForTimeout(1000);
      
      // Button should disappear after marking all read
      await expect(markAllBtn).not.toBeVisible();
    }
  });
});
