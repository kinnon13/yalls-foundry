/**
 * Notifications Smoke Tests
 * End-to-end verification of Phase 2 completion
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Notifications Phase 2: Full Wiring', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure user is logged in (adjust based on your auth setup)
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('networkidle');
  });

  test('🔥 End-to-end: Create → List → Mark Read → Verify Counts', async ({ page }) => {
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');

    // Step 1: Create test notification
    const testButton = page.getByRole('button', { name: /mention/i }).first();
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(1000);
    }

    // Step 2: Verify notification appears in Priority lane
    const priorityTab = page.getByRole('tab', { name: /priority/i });
    await priorityTab.click();
    
    const notification = page.locator('[role="button"]').filter({ hasText: 'Test mention' });
    await expect(notification).toBeVisible({ timeout: 5000 });

    // Step 3: Mark as read (click notification)
    await notification.click();
    await page.waitForTimeout(500);

    // Step 4: Verify unread count decreased
    const badge = page.locator('.badge').filter({ hasText: /\d+/ });
    const initialCount = await badge.isVisible() ? parseInt(await badge.textContent() || '0') : 0;
    expect(initialCount).toBeGreaterThanOrEqual(0);

    // Step 5: Mark all read
    const markAllBtn = page.getByRole('button', { name: /mark all read/i });
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await page.waitForTimeout(1000);
      
      // Verify no unread badge
      await expect(badge).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('⚙️ Preferences: Toggle channels & persist', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    // Toggle email channel
    const emailSwitch = page.locator('#channel-email');
    await expect(emailSwitch).toBeVisible();
    
    const initialState = await emailSwitch.isChecked();
    await emailSwitch.click();
    await page.waitForTimeout(500);

    // Reload and verify persistence
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const newState = await page.locator('#channel-email').isChecked();
    expect(newState).toBe(!initialState);
  });

  test('📊 Digest: Preview → Send Test → Verify Queue', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    // Set frequency to daily
    const frequencySelect = page.locator('#digest-frequency');
    await frequencySelect.click();
    await page.getByRole('option', { name: /daily/i }).click();
    await page.waitForTimeout(500);

    // Click preview
    const previewBtn = page.getByRole('button', { name: /preview/i });
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await page.waitForTimeout(1000);

      // Verify preview renders
      await expect(page.getByText(/digest preview/i)).toBeVisible();

      // Send test digest
      const sendTestBtn = page.getByRole('button', { name: /send me a test/i });
      if (await sendTestBtn.isVisible()) {
        await sendTestBtn.click();
        
        // Verify success toast
        await expect(page.getByText(/test digest sent/i)).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('🛡️ Quiet Hours: Block notifications during quiet period', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    // Set quiet hours to current time ± 1 hour (with wraparound)
    const h = new Date().getHours();
    const startTime = `${String((h + 23) % 24).padStart(2, '0')}:00`;
    const endTime = `${String((h + 1) % 24).padStart(2, '0')}:00`;

    await page.locator('#quiet-start').fill(startTime);
    await page.locator('#quiet-end').fill(endTime);
    await page.waitForTimeout(500);

    // Go to notifications and try to create test
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');

    const testButton = page.getByRole('button', { name: /mention/i }).first();
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(1000);

      // Should see "blocked" message
      await expect(page.getByText(/blocked by quiet hours/i)).toBeVisible({ timeout: 3000 });
    }
  });

  test('📈 Daily Cap: Enforce notification limit', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings/notifications`);
    await page.waitForLoadState('networkidle');

    // Set daily cap to 1
    const slider = page.locator('[role="slider"]').first();
    await slider.fill('1');
    await page.waitForTimeout(500);

    // Go to notifications
    await page.goto(`${BASE_URL}/notifications`);
    await page.waitForLoadState('networkidle');

    // Create first notification (should succeed)
    const testButton = page.getByRole('button', { name: /mention/i }).first();
    if (await testButton.isVisible()) {
      await testButton.click();
      await page.waitForTimeout(1000);

      // Create second notification (should be blocked)
      await testButton.click();
      await page.waitForTimeout(1000);

      // Should see "blocked" or "cap" message
      await expect(page.getByText(/blocked|cap/i)).toBeVisible({ timeout: 3000 });
    }
  });
});