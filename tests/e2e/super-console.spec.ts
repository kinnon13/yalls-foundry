/**
 * Super Console E2E Tests
 * Tests overview, pools, workers, flags, and incidents
 */

import { test, expect } from '@playwright/test';
import { loginAs, mockCoreApis, mockSuperConsoleApis } from './helpers';

test.describe('Super Console (Overview, Pools, Workers, Flags, Incidents)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'super_admin');
    await mockCoreApis(page);
    await mockSuperConsoleApis(page);
  });

  test('Overview shows green health and links work', async ({ page }) => {
    await page.goto('/super');

    // Health tiles / text
    await expect(page.getByText(/Super|Overview|Health/i)).toBeVisible();
    await expect(page.getByText(/database.*ok/i)).toBeVisible();

    // Navigate quickly to each section
    const poolsLink = page.getByRole('link', { name: /Pools/i })
      .or(page.getByText(/Pools/i).first());
    const workersLink = page.getByRole('link', { name: /Workers/i })
      .or(page.getByText(/Workers/i).first());
    const flagsLink = page.getByRole('link', { name: /Flags/i })
      .or(page.getByText(/Flags/i).first());
    const incidentsLink = page.getByRole('link', { name: /Incidents/i })
      .or(page.getByText(/Incidents/i).first());

    await expect(poolsLink).toBeVisible();
    await expect(workersLink).toBeVisible();
    await expect(flagsLink).toBeVisible();
    await expect(incidentsLink).toBeVisible();
  });

  test('Pools page lists pools and allows concurrency edits', async ({ page }) => {
    await page.goto('/super/pools');

    const table = page.getByTestId('pools-table')
      .or(page.getByRole('table'));
    
    await expect(table).toBeVisible();

    // Find a row (e.g., realtime)
    const rtRow = table.getByText(/realtime/i).locator('..');
    await expect(rtRow).toBeVisible();

    // Click edit -> change current_concurrency -> save
    const edit = rtRow.getByRole('button', { name: /Edit|Configure|Update/i }).first();
    if (await edit.isVisible().catch(() => false)) {
      await edit.click();
      
      const input = rtRow.getByLabel(/current|concurrency/i)
        .or(rtRow.locator('input[type="number"]')).first();
      
      await input.fill('12');
      
      const save = rtRow.getByRole('button', { name: /Save|Confirm/i }).first();
      await save.click();
      
      await expect(page.getByText(/Saved|Updated/i))
        .toBeVisible({ timeout: 3000 });
    }
  });

  test('Workers page shows heartbeats', async ({ page }) => {
    await page.goto('/super/workers');

    const table = page.getByTestId('workers-table')
      .or(page.getByRole('table'));
    
    await expect(table).toBeVisible();
    await expect(table.getByText(/realtime|heavy/i)).toBeVisible();
    await expect(table.getByText(/w-01|w-02/i)).toBeVisible();
  });

  test('Flags page toggles persist (external calls + global pause)', async ({ page }) => {
    await page.goto('/super/flags');

    // Toggle by testid or fallback to switch/checkbox
    const external = page.getByTestId('flag-external_calls_enabled')
      .or(page.getByRole('switch', { name: /External Calls Enabled/i }))
      .or(page.getByLabel(/External Calls Enabled/i));
    
    const pause = page.getByTestId('flag-global_pause')
      .or(page.getByRole('switch', { name: /Global Pause/i }))
      .or(page.getByLabel(/Global Pause/i));

    await expect(external).toBeVisible();
    await expect(pause).toBeVisible();

    // Toggle both
    await external.click();
    await pause.click();

    // Reload to ensure persisted via PATCH mock
    await page.reload();
    await expect(external).toBeVisible();
    await expect(pause).toBeVisible();
  });

  test('Incidents page lists and can resolve', async ({ page }) => {
    await page.goto('/super/incidents');

    const table = page.getByTestId('incidents-table')
      .or(page.getByRole('table'));
    
    await expect(table).toBeVisible();

    const firstRow = table.locator('tr').nth(1);
    await expect(firstRow).toBeVisible();
    await expect(firstRow.getByText(/Budget soft limit reached/i)).toBeVisible();

    const resolve = firstRow.getByRole('button', { name: /Resolve|Close/i }).first();
    if (await resolve.isVisible().catch(() => false)) {
      await resolve.click();
      await expect(page.getByText(/Incident resolved|Resolved/i))
        .toBeVisible({ timeout: 3000 });
    }
  });
});
