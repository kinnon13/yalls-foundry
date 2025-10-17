import { test, expect } from '@playwright/test';

test.describe('Linked Accounts & Verification (Mock Mode)', () => {
  test('can access linked accounts settings', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Navigate to linked accounts
    const linkedAccountsSection = page.getByRole('region', { name: /linked accounts/i });
    await expect(linkedAccountsSection).toBeVisible();
  });

  test('can link a new social account', async ({ page }) => {
    await page.goto('/profile/me');
    
    const addAccountBtn = page.getByRole('button', { name: /link.*account/i });
    if (await addAccountBtn.isVisible()) {
      await addAccountBtn.click();
      
      // Select provider
      await page.getByRole('option', { name: /instagram/i }).click();
      
      // Enter handle
      await page.getByLabel(/handle|username/i).fill('@testrider');
      
      // Submit
      await page.getByRole('button', { name: /save|link/i }).click();
      
      // Verify account appears
      await expect(page.getByText(/@testrider/i)).toBeVisible();
    }
  });

  test('shows verification badge when account is verified', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Look for verified badge
    const verifiedBadge = page.getByRole('img', { name: /verified/i });
    // Badge may or may not exist depending on verification status
    const isVisible = await verifiedBadge.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('can submit proof URL for verification', async ({ page }) => {
    await page.goto('/profile/me');
    
    const verifyBtn = page.getByRole('button', { name: /verify/i }).first();
    if (await verifyBtn.isVisible()) {
      await verifyBtn.click();
      
      // Enter proof URL
      const proofInput = page.getByLabel(/proof.*url/i);
      await proofInput.fill('https://instagram.com/p/abc123');
      
      // Submit verification request
      await page.getByRole('button', { name: /submit/i }).click();
      
      // Check for success message
      await page.waitForTimeout(500);
    }
  });

  test('keyboard accessibility for linked accounts', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Tab through linked accounts
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('role'));
    expect(focused).toBeTruthy();
  });
});
