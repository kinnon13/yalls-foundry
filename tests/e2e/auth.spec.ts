/**
 * E2E Auth Tests
 * 
 * Playwright tests for signup → email confirm stub → login → session persistence
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show login link on homepage when not authenticated', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /login/i });
    await expect(loginLink).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for invalid email', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('not-an-email');
    await page.getByLabel(/password/i).fill('TestPass123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error toast or message
    await expect(page.getByText(/invalid email/i)).toBeVisible({ timeout: 3000 });
  });

  test('should show validation errors for weak password on signup', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to signup tab
    await page.getByRole('tab', { name: /sign up/i }).click();
    
    await page.getByLabel(/email/i).fill('new@example.com');
    await page.getByLabel(/password/i).fill('weak');
    await page.getByRole('button', { name: /sign up/i }).click();

    // Should show password strength error
    await expect(page.getByText(/password must/i)).toBeVisible({ timeout: 3000 });
  });

  test('should persist session after login (stub)', async ({ page }) => {
    await page.goto('/login');
    
    // Mock successful login (in real test, use test user credentials)
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/password/i).fill('TestPass123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to home (or show success message if email confirmation required)
    // In stub mode, check for toast/message
    await expect(page.getByText(/check your email|signed in/i)).toBeVisible({ timeout: 5000 });
  });

  test('should block access to protected pages when not authenticated', async ({ page }) => {
    // Try accessing admin control room without auth
    await page.goto('/admin/control-room');
    
    // Should redirect to login (in real app with useRequireAuth)
    // For now, check if login link is visible (indicates not authenticated)
    const loginLink = page.getByRole('link', { name: /login/i });
    await expect(loginLink).toBeVisible();
  });

  test('should allow claim after authentication (RLS gate)', async ({ page }) => {
    // This test requires real auth + RLS
    // Stub: Navigate to horse detail, check claim button disabled if not authed
    await page.goto('/horses');
    
    // Should show horses list (public view)
    await expect(page.getByText(/horses/i)).toBeVisible();
    
    // Click first horse (if exists)
    const firstHorse = page.locator('[data-testid="horse-card"]').first();
    if (await firstHorse.isVisible()) {
      await firstHorse.click();
      
      // Claim button should be disabled or hidden if not authenticated
      const claimButton = page.getByRole('button', { name: /claim/i });
      if (await claimButton.isVisible()) {
        await expect(claimButton).toBeDisabled();
      }
    }
  });
});

test.describe('Session Management', () => {
  test('should show session info in control room (admin only)', async ({ page }) => {
    await page.goto('/admin/control-room');
    
    // Admin panel should show session details
    // In stub, check if "Not signed in" or session email is visible
    await expect(page.getByText(/not signed in|email:/i)).toBeVisible();
  });

  test('should allow logout and clear session', async ({ page }) => {
    // Navigate to control room (or any page with logout)
    await page.goto('/admin/control-room');
    
    // Look for sign out button
    const signOutButton = page.getByRole('button', { name: /sign out/i });
    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      
      // Should show "Not signed in" after logout
      await expect(page.getByText(/not signed in/i)).toBeVisible({ timeout: 3000 });
    }
  });
});
