/**
 * E2E Tests - Navigation opens overlays correctly
 * Tests mobile bottom nav and desktop sidebar interaction with overlay system
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation overlay integration', () => {
  test('mobile bottom nav → Yallbrary overlay opens and ESC closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    // Wait for nav to be visible
    await expect(page.getByTestId('nav-bottom')).toBeVisible();
    
    // Click Yallbrary nav item
    await page.getByTestId('nav-yallbrary').click();
    
    // Overlay should open
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="overlay-title"]')).toContainText('Yallbrary');
    
    // ESC key should close overlay
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="overlay-root"]')).toHaveCount(0);
  });

  test('desktop sidebar → Marketplace overlay opens', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    
    // Wait for sidebar to be visible
    await expect(page.getByTestId('nav-sidebar')).toBeVisible();
    
    // Click Marketplace nav item
    await page.getByTestId('nav-marketplace').click();
    
    // Overlay should open with correct title
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
    await expect(page.locator('[data-testid="overlay-title"]')).toContainText('Marketplace');
  });
  
  test('desktop sidebar → direct route navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    
    // Click Messages (direct route, not overlay)
    await page.getByTestId('nav-messages').click();
    
    // Should navigate, not open overlay
    await expect(page).toHaveURL(/\/messages/);
    await expect(page.locator('[data-testid="overlay-root"]')).toHaveCount(0);
  });
  
  test('overlay click-outside closes overlay', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    
    // Open Yallbrary
    await page.getByTestId('nav-yallbrary').click();
    await expect(page.locator('[data-testid="overlay-root"]')).toBeVisible();
    
    // Click backdrop (outside overlay content)
    const overlay = page.locator('[data-testid="overlay-root"]');
    await overlay.click({ position: { x: 10, y: 10 } }); // Click top-left corner of backdrop
    
    // Overlay should close
    await expect(page.locator('[data-testid="overlay-root"]')).toHaveCount(0);
  });
  
  test('mobile nav items have proper aria labels', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    
    const yallbraryBtn = page.getByTestId('nav-yallbrary');
    await expect(yallbraryBtn).toHaveAttribute('aria-label', 'Yallbrary');
    
    const homeLink = page.getByTestId('nav-home');
    await expect(homeLink).toHaveAttribute('aria-label', 'Home');
  });
});
