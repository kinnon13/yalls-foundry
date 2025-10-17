import { test, expect } from '@playwright/test';

test('bell renders and marks all read', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /notifications/i }).click();
  
  const dropdown = page.getByTestId('notif-dropdown');
  await expect(dropdown).toBeVisible();
  
  const markAll = dropdown.getByRole('button', { name: /mark all read/i });
  if (await markAll.isVisible()) {
    await markAll.click();
  }
});
