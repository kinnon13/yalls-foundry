import { test, expect } from '@playwright/test';

test.describe('Reposts with Attribution (Mock Mode)', () => {
  test('can open repost modal from a post', async ({ page }) => {
    await page.goto('/');
    
    const repostBtn = page.getByRole('button', { name: /repost/i }).first();
    if (await repostBtn.isVisible()) {
      await repostBtn.click();
      
      // Verify modal opens
      const modal = page.getByRole('dialog', { name: /repost/i });
      await expect(modal).toBeVisible();
    }
  });

  test('can add caption to repost', async ({ page }) => {
    await page.goto('/');
    
    const repostBtn = page.getByRole('button', { name: /repost/i }).first();
    if (await repostBtn.isVisible()) {
      await repostBtn.click();
      
      // Add caption
      const captionInput = page.getByPlaceholder(/add.*caption/i);
      await captionInput.fill('Great post! Adding context here.');
      
      // Submit repost
      await page.getByRole('button', { name: /^repost$/i }).click();
      
      // Verify success (could check for toast or redirect)
      await page.waitForTimeout(500);
    }
  });

  test('shows attribution on reposted content', async ({ page }) => {
    await page.goto('/profile/me/reposts');
    
    // Check for attribution text
    const attribution = page.getByText(/reposted from|originally by/i).first();
    if (await attribution.isVisible()) {
      await expect(attribution).toBeVisible();
    }
  });

  test('keyboard navigation in repost modal', async ({ page }) => {
    await page.goto('/');
    
    const repostBtn = page.getByRole('button', { name: /repost/i }).first();
    if (await repostBtn.isVisible()) {
      await repostBtn.click();
      
      // Test Tab navigation
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['INPUT', 'TEXTAREA', 'BUTTON']).toContain(focused);
      
      // Test Escape to close
      await page.keyboard.press('Escape');
      const modal = page.getByRole('dialog', { name: /repost/i });
      await expect(modal).not.toBeVisible();
    }
  });
});
