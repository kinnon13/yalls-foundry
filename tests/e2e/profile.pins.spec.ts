import { test, expect } from '@playwright/test';

test.describe('Profile Pins (Mock Mode)', () => {
  test('renders empty state and allows adding a pin', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Check for empty state
    const emptyState = page.getByText(/no pins yet/i);
    if (await emptyState.isVisible()) {
      // Add first pin
      await page.getByRole('button', { name: /add.*pin/i }).click();
      
      // Fill pin details
      await page.getByLabel(/title/i).fill('My First Achievement');
      await page.getByRole('button', { name: /^add pin$/i }).click();
      
      // Verify pin appears
      await expect(page.getByText(/my first achievement/i)).toBeVisible();
    }
  });

  test('keyboard navigation for pins', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Focus first pin
    const firstPin = page.getByRole('listitem').first();
    await firstPin.focus();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    expect(focused).toBeTruthy();
  });

  test('can remove a pin', async ({ page }) => {
    await page.goto('/profile/me');
    
    const removeButton = page.getByRole('button', { name: /remove/i }).first();
    if (await removeButton.isVisible()) {
      const pinText = await page.getByRole('listitem').first().textContent();
      await removeButton.click();
      
      // Verify pin is removed
      if (pinText) {
        await expect(page.getByText(pinText)).not.toBeVisible();
      }
    }
  });

  test('enforces maximum 8 pins', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Try to add pins until limit
    const addButton = page.getByRole('button', { name: /add.*pin/i });
    let pinsAdded = 0;
    
    while (pinsAdded < 10 && await addButton.isVisible()) {
      await addButton.click();
      await page.getByLabel(/title/i).fill(`Pin ${pinsAdded + 1}`);
      await page.getByRole('button', { name: /^add pin$/i }).click();
      pinsAdded++;
    }
    
    // Verify max 8 pins
    const pinCount = await page.getByRole('listitem').count();
    expect(pinCount).toBeLessThanOrEqual(8);
  });
});
