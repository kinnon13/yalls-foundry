/**
 * Global Accessibility Tests
 * Runs axe-core on all critical routes to ensure WCAG 2.1 AA compliance
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const criticalRoutes = [
  { path: '/', name: 'Home' },
  { path: '/profile/me', name: 'Profile' },
  { path: '/profile/me/favorites', name: 'Favorites' },
  { path: '/profile/me/reposts', name: 'Reposts' },
];

for (const route of criticalRoutes) {
  test(`a11y: ${route.name} (${route.path})`, async ({ page }) => {
    await page.goto(route.path);
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.toast, [data-sonner-toast], [role="status"]') // Ignore transient notifications
      .analyze();

    // Log violations for debugging
    if (results.violations.length > 0) {
      console.error(`Accessibility violations on ${route.name}:`);
      results.violations.forEach(violation => {
        console.error(`  - ${violation.id}: ${violation.description}`);
        console.error(`    Impact: ${violation.impact}`);
        console.error(`    Help: ${violation.helpUrl}`);
      });
    }

    expect(
      results.violations,
      `Found ${results.violations.length} accessibility violations on ${route.name}:\n${JSON.stringify(results.violations, null, 2)}`
    ).toHaveLength(0);
  });
}

test('keyboard navigation: skip link works', async ({ page }) => {
  await page.goto('/');
  
  // Tab to skip link (should be first focusable element)
  await page.keyboard.press('Tab');
  
  const focused = await page.evaluate(() => document.activeElement?.textContent);
  expect(focused).toContain('Skip to content');
  
  // Activate skip link
  await page.keyboard.press('Enter');
  
  // Verify focus moved to main content
  const mainFocused = await page.evaluate(() => 
    document.activeElement?.closest('#main-content') !== null
  );
  expect(mainFocused).toBe(true);
});

test('keyboard navigation: modal focus trap', async ({ page }) => {
  await page.goto('/profile/me');
  
  // Open add pin modal
  const addPinButton = page.getByRole('button', { name: /add.*pin/i });
  if (await addPinButton.isVisible()) {
    await addPinButton.click();
    
    // Modal should trap focus
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    
    // Tab through modal elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focus should stay within modal
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return el?.closest('[role="dialog"]') !== null;
    });
    expect(focusedElement).toBe(true);
    
    // Escape should close modal
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  }
});

test('reduced motion: respects user preference', async ({ page, context }) => {
  // Set reduced motion preference
  await context.addInitScript(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }),
    });
  });

  await page.goto('/');
  
  // Check that animations are disabled
  const hasTransitions = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.some(btn => {
      const style = window.getComputedStyle(btn);
      return style.transition !== 'none' && style.transition !== '';
    });
  });
  
  // In reduced motion mode, transitions should be minimal or none
  expect(hasTransitions).toBe(false);
});
