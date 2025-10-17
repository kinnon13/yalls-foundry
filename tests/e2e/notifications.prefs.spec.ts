/**
 * E2E Tests: Notification Preferences
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Notification Preferences', () => {
  test('toggle channels', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    // Toggle email channel
    const emailSwitch = page.locator('#channel-email');
    await expect(emailSwitch).toBeVisible();
    
    const initialState = await emailSwitch.isChecked();
    await emailSwitch.click();
    
    // State should change
    await expect(emailSwitch).toHaveAttribute('aria-checked', initialState ? 'false' : 'true');
  });

  test('set quiet hours', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    const startInput = page.locator('#quiet-start');
    const endInput = page.locator('#quiet-end');

    await startInput.fill('22:00');
    await endInput.fill('08:00');

    await expect(startInput).toHaveValue('22:00');
    await expect(endInput).toHaveValue('08:00');
  });

  test('adjust daily cap slider', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    const slider = page.locator('[role="slider"]').first();
    await expect(slider).toBeVisible();

    // Move slider
    await slider.focus();
    await slider.press('ArrowRight');
    await slider.press('ArrowRight');
  });

  test('change digest frequency', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    const frequencySelect = page.locator('#digest-frequency');
    await frequencySelect.click();
    
    await page.getByRole('option', { name: /daily/i }).click();
    await expect(frequencySelect).toContainText(/daily/i);
  });
});
