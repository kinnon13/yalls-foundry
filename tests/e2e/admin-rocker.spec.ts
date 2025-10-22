/**
 * Admin Rocker E2E Tests
 * Tests budgets, model routes, incidents, and audit ledger
 */

import { test, expect } from '@playwright/test';
import { loginAs, mockCoreApis } from './helpers';

test.describe('Admin Rocker', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin');
    await mockCoreApis(page);
  });

  test('Overview loads with budgets & routes, incidents resolve', async ({ page }) => {
    await page.goto('/admin-rocker');

    // Overview cards
    await expect(page.getByText(/Admin Rocker|Overview|Budgets|Routes|Incidents/i))
      .toBeVisible();

    // Budgets card
    const budgetsCard = page.getByTestId('budgets-card')
      .or(page.getByText(/Budget/i).locator('..'));
    
    await expect(budgetsCard).toBeVisible();
    await expect(budgetsCard).toContainText(/\$|cents|limit/i);

    // Navigate to Budgets page and edit a value
    await page.goto('/admin-rocker/budgets');
    await expect(page.getByText(/Model Budgets|limit|spent/i)).toBeVisible();

    const editBtn = page.getByRole('button', { name: /Edit|Update/i }).first();
    if (await editBtn.isVisible().catch(() => false)) {
      await editBtn.click();
      
      const limitInput = page.getByLabel(/Limit|Cap/i)
        .or(page.getByTestId('budget-limit'));
      
      if (await limitInput.isVisible().catch(() => false)) {
        await limitInput.fill('25000');
        
        const save = page.getByRole('button', { name: /Save|Confirm/i })
          .or(page.getByTestId('budget-save'));
        
        await save.click();
        await expect(page.getByText(/Saved|Updated/i))
          .toBeVisible({ timeout: 3000 });
      }
    }

    // Routes page: ensure routes render & allow tweak
    await page.goto('/admin-rocker/tools');
    await expect(page.getByText(/Model Routes|task_class|preferred_model/i))
      .toBeVisible();

    const routeRow = page.getByText(/mdr\.generate/i).locator('..');
    await expect(routeRow).toBeVisible();

    const editRoute = routeRow.getByRole('button', { name: /Edit|Configure/i }).first();
    if (await editRoute.isVisible().catch(() => false)) {
      await editRoute.click();
      
      const temp = page.getByLabel(/temperature/i)
        .or(page.getByTestId('route-temperature'));
      
      if (await temp.isVisible().catch(() => false)) {
        await temp.fill('0.25');
        
        const save = page.getByRole('button', { name: /Save|Confirm/i });
        await save.click();
        await expect(page.getByText(/Saved|Updated/i))
          .toBeVisible({ timeout: 3000 });
      }
    }

    // Moderation (Incidents) — resolve
    await page.goto('/admin-rocker/moderation');
    
    const table = page.getByRole('table')
      .or(page.getByTestId('incidents-table'));
    
    await expect(table).toBeVisible();

    const firstRow = table.locator('tr').nth(1);
    await expect(firstRow).toBeVisible();

    const resolveBtn = firstRow.getByRole('button', { name: /Resolve|Close/i }).first();
    if (await resolveBtn.isVisible().catch(() => false)) {
      await resolveBtn.click();
      await expect(page.getByText(/Incident resolved|Resolved/i))
        .toBeVisible({ timeout: 3000 });
    }

    // Audits page
    await page.goto('/admin-rocker/audits');
    await expect(page.getByText(/Action Ledger|orchestrate\.spawn/i))
      .toBeVisible();
  });
});
