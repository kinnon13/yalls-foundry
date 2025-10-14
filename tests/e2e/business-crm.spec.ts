/**
 * E2E Test: Business CRM Flow
 * 
 * Playwright: login owner → /business/[id]/hub → add contact → verify kanban render
 */

import { test, expect } from '@playwright/test';

test.describe('Business CRM Flow', () => {
  test('owner can access hub and add contact', async ({ page }) => {
    // Navigate to login (stub: assume user logs in)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'owner@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to home
    await page.waitForURL('/');

    // Navigate to business hub (stub: use test business ID)
    const testBusinessId = 'test-business-id'; // Replace with seed data ID in real test
    await page.goto(`/business/${testBusinessId}/hub`);

    // Verify hub renders
    await expect(page.locator('h1')).toContainText('Test Business');

    // Navigate to CRM contacts
    await page.goto(`/business/${testBusinessId}/crm/contacts`);

    // Open add contact dialog
    await page.click('button:has-text("Add Contact")');

    // Fill contact form
    await page.fill('input[placeholder="John Doe"]', 'Jane Smith');
    await page.fill('input[placeholder="john@example.com"]', 'jane@example.com');
    await page.fill('input[placeholder="+1 234 567 8900"]', '+1 555 123 4567');

    // Submit
    await page.click('button:has-text("Add Contact")');

    // Verify toast success (or contact appears in kanban)
    await expect(page.locator('text=Contact added successfully')).toBeVisible({ timeout: 5000 });

    // Verify contact appears in "Lead" column
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('staff can view but not delete business', async ({ page }) => {
    // Stub: Log in as staff user
    await page.goto('/login');
    await page.fill('input[type="email"]', 'staff@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/');

    const testBusinessId = 'test-business-id';
    await page.goto(`/business/${testBusinessId}/hub`);

    // Verify access
    await expect(page.locator('h1')).toBeVisible();

    // Verify no delete button (owner-only action)
    await expect(page.locator('button:has-text("Delete Business")')).not.toBeVisible();
  });
});
