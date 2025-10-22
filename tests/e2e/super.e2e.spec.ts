import { test, expect } from '@playwright/test';

test.describe('Super Console & Andy E2E', () => {
  test('Overview health + counts render', async ({ page }) => {
    await page.goto('/super');
    await expect(page.getByText(/System Health/i)).toBeVisible();
    await expect(page.getByText(/OK|HEALTHY/i)).toBeVisible();
    await expect(page.getByText(/Queue Depth/i)).toBeVisible();
  });

  test('Flags toggle (External Calls) on/off', async ({ page }) => {
    await page.goto('/super/flags');
    const toggle = page.getByRole('switch', { name: /External Calls/i });
    await toggle.click();
    await expect(page.getByText(/Flags updated/i)).toBeVisible();
    await toggle.click(); // revert
    await expect(page.getByText(/Flags updated/i)).toBeVisible();
  });

  test('Proactive Suggestions: Execute Now enqueues sub-agents', async ({ page }) => {
    await page.goto('/super-andy-v2');
    const card = page.getByText(/Proactive Suggestions/i).locator('..').locator('article,div').first();
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: /Execute Now/i }).click();
    await expect(page.getByText(/Execution started/i)).toBeVisible();

    // sanity: workers page shows something
    await page.goto('/super/workers');
    await expect(page.getByText(/Active Workers/i)).toBeVisible();
  });

  test('Self-Improve: Run Now writes a new log row', async ({ page }) => {
    await page.goto('/super-andy-v2');
    await page.getByRole('button', { name: /Run Now/i }).click();
    await expect(page.getByText(/Self-improve triggered/i)).toBeVisible();
    // A new row appears; allow a brief refresh cycle
    await page.waitForTimeout(1500);
    await expect(page.getByText(/policy_weight|experiment|quality/i)).toBeVisible();
  });

  test('Incidents: resolve if present', async ({ page }) => {
    await page.goto('/super/incidents');
    // If an incident exists, resolve it
    const open = page.getByRole('button', { name: /Resolve/i }).first();
    if (await open.isVisible().catch(() => false)) {
      await open.click();
      await expect(page.getByText(/Incident resolved|Resolve/i)).toBeVisible();
    } else {
      await expect(page.getByText(/No incidents|System running smoothly/i)).toBeVisible();
    }
  });

  test('Workers: probe a worker', async ({ page }) => {
    await page.goto('/super/workers');
    const probe = page.getByRole('button', { name: /Probe/i }).first();
    if (await probe.isVisible().catch(() => false)) {
      await probe.click();
      await expect(page.getByText(/Probe enqueued/i)).toBeVisible();
    } else {
      await expect(page.getByText(/No active workers/i)).toBeVisible();
    }
  });
});
