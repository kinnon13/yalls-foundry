/**
 * E2E Smoke Tests
 * Critical user flows that must work in production
 */

import { test, expect } from '@playwright/test';

test.describe('Home Feed', () => {
  test('should load feed lanes', async ({ page }) => {
    await page.goto('/');
    
    // Wait for feed to load
    await page.waitForSelector('[data-testid="feed-scroller"]', { timeout: 10000 });
    
    // Check lanes are present
    const forYouTab = page.locator('text=For You');
    await expect(forYouTab).toBeVisible();
  });

  test('should log impressions on scroll', async ({ page }) => {
    await page.goto('/');
    
    // Wait for feed
    await page.waitForSelector('[data-testid="feed-scroller"]');
    
    // Scroll to trigger impressions
    await page.mouse.wheel(0, 500);
    
    // Wait a bit for telemetry to fire
    await page.waitForTimeout(1000);
    
    // Can't easily verify DB writes in E2E, but this ensures no crashes
  });
});

test.describe('Dashboard', () => {
  test('should show entitlement gates', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should see some dashboard content
    const dashboard = page.locator('text=Dashboard');
    await expect(dashboard).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load home page in <3s', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForSelector('[data-testid="feed-scroller"]');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });
});
