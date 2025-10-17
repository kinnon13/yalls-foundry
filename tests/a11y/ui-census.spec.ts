/**
 * UI Census Tests
 * Verifies that critical UI elements are present and properly marked
 */

import { test, expect } from '@playwright/test';

test.describe('UI Census: Critical Elements', () => {
  test('profile page has required landmarks', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Check for main landmark
    const main = page.locator('main#main-content, [role="main"]');
    await expect(main).toBeVisible();
    
    // Check for skip link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a:has-text("Skip to content")');
    await expect(skipLink).toBeFocused();
  });

  test('pin board renders with proper markers', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Look for pin board region
    const pinBoard = page.getByRole('region', { name: /pins|pinned items/i });
    if (await pinBoard.isVisible()) {
      await expect(pinBoard).toBeVisible();
      
      // Check for list structure
      const list = pinBoard.getByRole('list');
      await expect(list).toBeVisible();
    }
  });

  test('favorite buttons have proper ARIA', async ({ page }) => {
    await page.goto('/');
    
    const favoriteButton = page.getByRole('button', { name: /favorite/i }).first();
    if (await favoriteButton.isVisible()) {
      // Check for aria-pressed attribute
      const ariaPressed = await favoriteButton.getAttribute('aria-pressed');
      expect(ariaPressed).toMatch(/true|false/);
      
      // Check for aria-label
      const ariaLabel = await favoriteButton.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toMatch(/favorite/i);
    }
  });

  test('modals have proper dialog markup', async ({ page }) => {
    await page.goto('/profile/me');
    
    const addPinButton = page.getByRole('button', { name: /add.*pin/i });
    if (await addPinButton.isVisible()) {
      await addPinButton.click();
      
      // Check for dialog role
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();
      
      // Check for aria-modal
      const ariaModal = await dialog.getAttribute('aria-modal');
      expect(ariaModal).toBe('true');
      
      // Check for aria-labelledby
      const labelledBy = await dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
    }
  });

  test('forms have proper labels', async ({ page }) => {
    await page.goto('/profile/me');
    
    const addPinButton = page.getByRole('button', { name: /add.*pin/i });
    if (await addPinButton.isVisible()) {
      await addPinButton.click();
      
      // All inputs should have labels
      const inputs = page.locator('input, textarea, select');
      const count = await inputs.count();
      
      for (let i = 0; i < count; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          await expect(label).toBeVisible();
        }
      }
    }
  });

  test('interactive elements are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab through page
    let tabCount = 0;
    const maxTabs = 20;
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      // Check if focused element is interactive
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el) return null;
        
        return {
          tag: el.tagName,
          role: el.getAttribute('role'),
          tabindex: el.getAttribute('tabindex'),
          isVisible: el.getBoundingClientRect().width > 0
        };
      });
      
      if (focused && focused.isVisible) {
        // Interactive elements should be buttons, links, or have appropriate roles
        const isInteractive = 
          focused.tag === 'BUTTON' ||
          focused.tag === 'A' ||
          focused.tag === 'INPUT' ||
          focused.tag === 'TEXTAREA' ||
          focused.tag === 'SELECT' ||
          ['button', 'link', 'textbox', 'combobox'].includes(focused.role || '');
        
        expect(isInteractive).toBe(true);
      }
    }
  });

  test('headings form proper hierarchy', async ({ page }) => {
    await page.goto('/profile/me');
    
    // Get all headings
    const headings = await page.evaluate(() => {
      const h = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      return h.map(el => ({
        level: parseInt(el.tagName[1]),
        text: el.textContent?.trim() || ''
      }));
    });
    
    // Should have exactly one h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    
    // Headings should not skip levels
    for (let i = 1; i < headings.length; i++) {
      const diff = headings[i].level - headings[i-1].level;
      expect(diff).toBeLessThanOrEqual(1);
    }
  });
});
