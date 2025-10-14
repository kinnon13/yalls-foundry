/**
 * E2E: Account Deletion Flow (v1.1 Tombstone)
 * 
 * Scenario: User deletes account → profile anonymized, entities unclaimed, signed out
 */

import { test, expect } from '@playwright/test';

test.describe('Account Deletion (Safe Tombstone)', () => {
  test('should anonymize profile and unclaim entities on delete', async ({ page }) => {
    // 1. Login as test user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test-delete@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/');

    // 2. Create a horse (claimed by user)
    await page.goto('/horses/create');
    await page.fill('input[name="name"]', 'Delete Test Horse');
    await page.fill('input[name="slug"]', 'delete-test-horse');
    await page.click('button:has-text("Create Horse")');
    await expect(page.getByText('Horse created')).toBeVisible();

    // 3. Navigate to profile settings
    await page.goto('/profile/123'); // mock profile ID
    
    // 4. Click delete account
    await page.click('button:has-text("Delete Account")');
    await expect(page.getByText('Permanently Delete Account')).toBeVisible();

    // 5. Type DELETE to confirm
    await page.fill('input[placeholder="DELETE"]', 'DELETE');
    
    // 6. Confirm delete
    await page.click('button:has-text("Delete Account")');

    // 7. Verify success toast
    await expect(page.getByText('Account anonymized')).toBeVisible();

    // 8. Verify signed out (redirected to login)
    await expect(page).toHaveURL('/login');

    // 9. Verify horse is now unclaimed (browse as public)
    await page.goto('/horses/delete-test-horse');
    await expect(page.getByText('Unclaimed')).toBeVisible();
    await expect(page.getByText('Claim Profile')).toBeVisible();
  });

  test('should block deletion if sole admin on business', async ({ page }) => {
    // 1. Login as business owner (sole admin)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'sole-admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // 2. Create business with no other admins
    await page.goto('/business/create');
    await page.fill('input[name="name"]', 'Sole Admin Ranch');
    await page.click('button:has-text("Create Business")');

    // 3. Attempt to delete account
    await page.goto('/profile/456');
    await page.click('button:has-text("Delete Account")');
    await page.fill('input[placeholder="DELETE"]', 'DELETE');
    await page.click('button:has-text("Delete Account")');

    // 4. Verify error toast (sole admin block)
    await expect(page.getByText('Cannot delete account')).toBeVisible();
    await expect(page.getByText('Transfer admin rights before deleting')).toBeVisible();

    // 5. Verify still on page (not signed out)
    await expect(page).toHaveURL('/profile/456');
  });

  test('should allow deletion after transferring admin', async ({ page }) => {
    // 1. Login as sole admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'transfer-admin@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    // 2. Add another admin to business
    await page.goto('/business/my-biz/settings/team');
    await page.click('button:has-text("Add Member")');
    await page.fill('input[name="email"]', 'new-admin@example.com');
    await page.selectOption('select[name="role"]', 'admin');
    await page.click('button:has-text("Invite")');
    await expect(page.getByText('Admin added')).toBeVisible();

    // 3. Now delete account (should succeed)
    await page.goto('/profile/789');
    await page.click('button:has-text("Delete Account")');
    await page.fill('input[placeholder="DELETE"]', 'DELETE');
    await page.click('button:has-text("Delete Account")');

    // 4. Verify success
    await expect(page.getByText('Account anonymized')).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});
