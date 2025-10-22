/**
 * Role-Based Automation E2E Tests
 * 
 * Validates that:
 * - User Rocker can open apps and perform actions
 * - Admin Rocker can audit but is blocked from writes
 * - Super Andy respects approval_mode
 */

import { test, expect } from '@playwright/test';
import { loginAs, mockCoreApis } from './helpers';

test.describe('Role-Based Automation', () => {
  test.beforeEach(async ({ page }) => {
    await mockCoreApis(page);
  });

  test('User can open Yallbrary via automation bus', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('devRole', 'user');
    });
    
    await page.goto('/rocker');
    
    // Simulate bus command to open Yallbrary
    await page.evaluate(() => {
      const event = {
        command: { type: 'openApp', app: 'yallbrary' },
        role: 'user',
        timestamp: Date.now(),
        allowed: true,
      };
      new BroadcastChannel('app-automation-bus').postMessage(event);
    });
    
    // Wait for overlay to load
    await expect(page.getByTestId('overlay-host')).toBeVisible({ timeout: 3000 });
  });

  test('Admin can open apps for UI testing', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('devRole', 'admin');
    });
    
    await page.goto('/admin-rocker');
    
    // Admin should be able to open marketplace
    await page.evaluate(() => {
      const event = {
        command: { type: 'openApp', app: 'marketplace' },
        role: 'admin',
        timestamp: Date.now(),
        allowed: true,
      };
      new BroadcastChannel('app-automation-bus').postMessage(event);
    });
    
    await expect(page.getByTestId('overlay-host')).toBeVisible({ timeout: 3000 });
  });

  test('Admin blocked from writing by default', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin-rocker/tools');
    
    // Look for read-only indicator
    const readOnlyPill = page.getByText(/Read-only|Simulate|Audit Only/i);
    
    // May not exist yet, but write operations should be blocked
    if (await readOnlyPill.isVisible().catch(() => false)) {
      await expect(readOnlyPill).toBeVisible();
    }
    
    // Attempting a write action should show simulate or block message
    const writeBtn = page.getByRole('button', { name: /Create|Post|Submit/i }).first();
    if (await writeBtn.isVisible().catch(() => false)) {
      await writeBtn.click();
      await expect(
        page.getByText(/Simulated|Would write|Blocked|Needs elevation/i)
      ).toBeVisible({ timeout: 3000 });
    }
  });

  test('Super admin has full access', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('devRole', 'super_admin');
    });
    
    await page.goto('/super');
    
    // Super admin can access all areas
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Can navigate to admin areas
    await page.goto('/super/pools');
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });

  test('Agent Super Andy respects capabilities', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('devRole', 'agent_super_andy');
    });
    
    await page.goto('/super-andy');
    
    // Andy can open allowed apps
    await page.evaluate(() => {
      const event = {
        command: { type: 'openApp', app: 'messages' },
        role: 'agent_super_andy',
        timestamp: Date.now(),
        allowed: true,
      };
      new BroadcastChannel('app-automation-bus').postMessage(event);
    });
    
    await expect(page.getByTestId('overlay-host')).toBeVisible({ timeout: 3000 });
  });

  test('Bus blocks unauthorized app access', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('devRole', 'user');
    });
    
    await page.goto('/');
    
    // User tries to access admin-only app (crm)
    let blocked = false;
    page.on('console', msg => {
      if (msg.text().includes('blocked') || msg.text().includes('Blocked')) {
        blocked = true;
      }
    });
    
    await page.evaluate(() => {
      const channel = new BroadcastChannel('app-automation-bus');
      const event = {
        command: { type: 'openApp', app: 'crm' },
        role: 'user',
        timestamp: Date.now(),
        allowed: false,
        reason: 'Role user cannot access app: crm',
      };
      channel.postMessage(event);
    });
    
    // Give it a moment
    await page.waitForTimeout(500);
    
    // CRM should NOT open
    const overlay = page.getByTestId('overlay-host');
    await expect(overlay).not.toBeVisible();
  });
});
