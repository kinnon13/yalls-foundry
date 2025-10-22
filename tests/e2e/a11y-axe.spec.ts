/**
 * Accessibility Tests with Axe
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (A11y)', () => {
  test('home page has no critical a11y violations', async ({ page }) => {
    await page.goto('/');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('Super Andy has no critical violations', async ({ page }) => {
    await page.goto('/super-andy');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('overlay (Yallbrary) has no critical violations', async ({ page }) => {
    await page.goto('/?app=yallbrary');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    
    expect(results.violations.filter(v => v.impact === 'critical')).toEqual([]);
  });

  test('keyboard navigation works on critical UI', async ({ page }) => {
    await page.goto('/super-andy');
    
    // Tab through key elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Should be able to focus chat input
    const input = page.getByTestId('chat-input').or(page.getByPlaceholder(/Type|Ask/i));
    await expect(input).toBeFocused({ timeout: 3000 });
  });
});
