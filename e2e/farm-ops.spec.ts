import { test, expect } from '@playwright/test';

test('create a horse', async ({ page }) => {
  await page.goto('/farm/horses');
  await page.getByRole('button', { name: /add horse/i }).click();
  await page.getByPlaceholder('Name').fill('Rocket');
  await page.getByRole('button', { name: /save/i }).click();
  await expect(page.getByText('Rocket')).toBeVisible();
});
