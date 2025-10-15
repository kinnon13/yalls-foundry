import { test, expect } from '@playwright/test';

/**
 * Golden Path Tests - Verify core AI workflows
 * These tests ensure the AI wiring works end-to-end
 */

test.describe('Rocker Golden Paths', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and ensure logged in
    await page.goto('/');
    
    // Skip if already logged in
    const isLoggedIn = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    if (!isLoggedIn) {
      // Login flow (adjust selectors as needed)
      await page.click('text=Login');
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/', { timeout: 5000 });
    }
  });

  test('Golden Path: Save Post', async ({ page }) => {
    // Navigate to a feed with posts
    await page.goto('/');
    
    // Wait for posts to load
    await page.waitForSelector('[data-testid="post"]', { timeout: 10000 });
    
    // Find first save button
    const saveButton = page.locator('[data-testid="save-post-btn"]').first();
    await saveButton.click();
    
    // Verify save confirmation appears
    await expect(page.locator('text=saved', { exact: false })).toBeVisible({ timeout: 3000 });
    
    // Check that the post appears in saved posts
    await page.goto('/profile');
    await page.click('text=Saved');
    await expect(page.locator('[data-testid="post"]').first()).toBeVisible();
  });

  test('Golden Path: Upload Media', async ({ page }) => {
    await page.goto('/');
    
    // Open upload dialog
    await page.click('[data-testid="upload-media-btn"]');
    
    // Upload a test image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-horse.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data')
    });
    
    // Optionally add caption
    const captionInput = page.locator('textarea[placeholder*="caption" i]');
    if (await captionInput.isVisible()) {
      await captionInput.fill('Test upload from golden path');
    }
    
    // Submit upload
    await page.click('button:has-text("Upload")');
    
    // Verify upload success
    await expect(page.locator('text=uploaded', { exact: false })).toBeVisible({ timeout: 5000 });
  });

  test('Golden Path: Event Builder Intent', async ({ page }) => {
    // This test verifies the event creation flow starts correctly
    await page.goto('/events/create');
    
    // Check that form elements are present
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="start_date"]')).toBeVisible();
    
    // Fill in basic event details
    await page.fill('input[name="title"]', 'Golden Path Test Event');
    await page.fill('textarea[name="description"]', 'Testing event creation workflow');
    
    // Select event type
    await page.click('[data-testid="event-type-select"]');
    await page.click('text=Barrel Race');
    
    // Verify form accepts input
    const titleValue = await page.inputValue('input[name="title"]');
    expect(titleValue).toBe('Golden Path Test Event');
  });

  test('Health Check: Verify API is responding', async ({ page }) => {
    // Call health endpoint
    const response = await page.request.get('/functions/v1/rocker-health');
    
    expect(response.ok()).toBeTruthy();
    
    const health = await response.json();
    expect(health.status).toMatch(/healthy|degraded/);
    expect(health.checks.db.connected).toBe(true);
    expect(health.checks.functions.total).toBeGreaterThan(0);
  });

  test('Contract: Consent Flow', async ({ page }) => {
    // Navigate to consent page
    await page.goto('/consent');
    
    // Accept consent
    await page.check('input[name="site_opt_in"]');
    await page.click('button:has-text("Accept")');
    
    // Verify consent was accepted
    await expect(page.locator('text=consent accepted', { exact: false })).toBeVisible({ timeout: 3000 });
  });
});
