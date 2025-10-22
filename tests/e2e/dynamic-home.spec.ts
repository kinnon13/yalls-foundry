import { test, expect } from '@playwright/test';
const BASE = process.env.BASE_URL || 'http://localhost:4173';

test('landing loads and shows hero', async ({ page }) => {
  await page.goto(`${BASE}/`);
  const h1 = page.locator('h1, [data-testid="hero-title"]');
  await expect(h1).toBeVisible();
});

test('invite param is carried to auth from CTA', async ({ page }) => {
  await page.goto(`${BASE}/?invite=test123`);
  const cta = page.locator('[data-testid="cta-primary"], text=/Get Started/i');
  await expect(cta).toBeVisible();
  await cta.first().click();
  await expect(page).toHaveURL(/\/auth\?mode=signup/);
  await expect(page).toHaveURL(/invite=test123/);
});
