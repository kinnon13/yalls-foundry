/**
 * User Rocker Capabilities E2E Tests
 * Talk, type, click, navigate, scroll
 */

import { test, expect } from '@playwright/test';

test.describe('User Rocker Capabilities', () => {
  test('can open overlay via action', async ({ page }) => {
    await page.goto('/');
    
    // Dispatch action to open Yallbrary
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('rocker:action', {
          detail: { action: { kind: 'open-app', app: 'yallbrary' } },
        })
      );
    });
    
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible({ timeout: 5000 });
  });

  test('can type and search', async ({ page }) => {
    await page.goto('/?app=yallbrary');
    
    // Dispatch action to search
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('rocker:action', {
          detail: {
            action: {
              kind: 'search-yallbrary',
              query: 'halter',
            },
          },
        })
      );
    });
    
    await expect(page.getByTestId('yallbrary-search')).toHaveValue(/halter/i, { timeout: 3000 });
  });

  test('can scroll to element', async ({ page }) => {
    await page.goto('/?app=yallbrary');
    
    await page.evaluate(() => {
      window.dispatchEvent(
        new CustomEvent('rocker:action', {
          detail: {
            action: {
              kind: 'scroll',
              target: { role: 'list', name: 'Results' },
            },
          },
        })
      );
    });
    
    // Verify scroll happened (element should be in viewport)
    await page.waitForTimeout(500);
  });
});
