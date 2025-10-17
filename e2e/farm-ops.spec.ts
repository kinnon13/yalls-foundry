import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

test.describe('Farm Operations', () => {
  test('Tasks page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/farm/tasks`);
    await page.waitForLoadState('networkidle');
    
    const heading = page.getByRole('heading', { name: /tasks/i });
    await expect(heading).toBeVisible();
  });

  test('Health Log page renders', async ({ page }) => {
    await page.goto(`${BASE_URL}/farm/health`);
    await page.waitForLoadState('networkidle');
    
    const heading = page.getByRole('heading', { name: /health log/i });
    await expect(heading).toBeVisible();
  });

  test('Can add a task', async ({ page }) => {
    await page.goto(`${BASE_URL}/farm/tasks`);
    await page.waitForLoadState('networkidle');
    
    const input = page.getByPlaceholder(/new task/i);
    if (await input.count() > 0) {
      await input.first().fill('Test task from E2E');
      const addBtn = page.getByRole('button', { name: /add/i }).first();
      await addBtn.click();
      
      await page.waitForTimeout(1000);
      await expect(page.getByText(/test task from e2e/i)).toBeVisible();
    }
  });
});

test.describe('Composer', () => {
  test('Composer renders', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const composer = page.getByPlaceholder(/what's on your mind/i);
    if (await composer.count() > 0) {
      await expect(composer.first()).toBeVisible();
    }
  });

  test('Can type in composer', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    const composer = page.getByPlaceholder(/what's on your mind/i);
    if (await composer.count() > 0) {
      await composer.first().fill('Hello from E2E test');
      await expect(composer.first()).toHaveValue(/hello from e2e/i);
    }
  });
});
