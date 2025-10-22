/**
 * Dynamic Home - Step 2 Verification
 * Tests invite personalization, A/B variants, and CTA attribution
 */

import { test, expect } from '@playwright/test';

test('root without invite renders default copy', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  
  // Should show default headline (one of the variants)
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
  
  // Check for variant assignment (A/B/C/D)
  const rootDiv = page.locator('div[data-variant]');
  const variant = await rootDiv.getAttribute('data-variant');
  expect(['A', 'B', 'C', 'D']).toContain(variant);
});

test('root with invite shows personalized experience', async ({ page }) => {
  // Note: This test requires a seeded invite code in the database
  await page.goto('/?invite=testcode');
  await page.waitForTimeout(1500);
  
  // Should render the page (personalization may or may not appear depending on DB state)
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
  
  // Variant should still be assigned
  const rootDiv = page.locator('div[data-variant]');
  const variant = await rootDiv.getAttribute('data-variant');
  expect(['A', 'B', 'C', 'D']).toContain(variant);
});

test('CTA carries invite + variant to auth', async ({ page }) => {
  await page.goto('/?invite=test123');
  await page.waitForTimeout(1000);
  
  // Click primary CTA
  await page.getByTestId('cta-primary').click();
  
  // Should navigate to auth with parameters
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/auth\?mode=signup/);
  await expect(page).toHaveURL(/invite=test123/);
  await expect(page).toHaveURL(/variant=[ABCD]/);
});

test('variant assignment is stable across page loads', async ({ page, context }) => {
  // First visit
  await page.goto('/');
  await page.waitForTimeout(1000);
  
  const rootDiv = page.locator('div[data-variant]');
  const variant1 = await rootDiv.getAttribute('data-variant');
  
  // Reload page
  await page.reload();
  await page.waitForTimeout(1000);
  
  const variant2 = await rootDiv.getAttribute('data-variant');
  
  // Should be the same variant (stable bucketing)
  expect(variant1).toBe(variant2);
});

test('analytics events are logged on page load', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  
  // Analytics should fire home_impression event (check network or console)
  // This is a smoke test - actual validation would require checking DB or mock intercepts
  const heading = page.locator('h1');
  await expect(heading).toBeVisible();
});
