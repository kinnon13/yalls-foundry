/**
 * Accessibility Smoke Tests
 * Basic a11y checks on key pages (full axe tests in other specs)
 */

import { test, expect } from '@playwright/test';
import { loginAs } from './helpers';

test.describe('Accessibility Smoke Tests', () => {
  test('Key pages have main landmarks and no obvious issues', async ({ page }) => {
    await loginAs(page, 'user');
    
    const paths = ['/', '/rocker', '/dashboard'];
    
    for (const path of paths) {
      await page.goto(path);
      
      // Page loads
      await expect(page).toHaveTitle(/./);
      
      // Has main landmark
      const main = page.locator('main, [role="main"]');
      await expect(main).toBeVisible();
      
      // Basic interactive elements are keyboard accessible
      const buttons = page.getByRole('button').first();
      if (await buttons.isVisible().catch(() => false)) {
        await buttons.focus();
        await expect(buttons).toBeFocused();
      }
    }
  });

  test('Super admin pages accessible', async ({ page }) => {
    await loginAs(page, 'super_admin');
    
    const paths = ['/super', '/super/pools', '/super/workers', '/super/flags'];
    
    for (const path of paths) {
      await page.goto(path);
      await expect(page.locator('main, [role="main"]')).toBeVisible();
    }
  });
});
