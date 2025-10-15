import { test, expect } from '@playwright/test';

test.describe('Knowledge Browser', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin (adjust based on your auth setup)
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to KB browser', async ({ page }) => {
    await page.goto('/admin/kb');
    
    // Check main elements are present
    await expect(page.locator('text=Knowledge Base')).toBeVisible();
    await expect(page.locator('text=Global')).toBeVisible();
    await expect(page.locator('text=Site')).toBeVisible();
    await expect(page.locator('text=User')).toBeVisible();
  });

  test('should search for knowledge items', async ({ page }) => {
    await page.goto('/admin/kb');
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Enter search query
    const searchInput = page.locator('input[placeholder*="Search knowledge"]');
    await searchInput.fill('create event');
    
    // Wait for debounced search
    await page.waitForTimeout(500);
    
    // Check that results are displayed (if any exist)
    const resultsContainer = page.locator('[role="article"]').first();
    // Either results exist or "No knowledge items found" message
    const hasResults = await resultsContainer.isVisible().catch(() => false);
    const noResults = await page.locator('text=No knowledge items found').isVisible().catch(() => false);
    
    expect(hasResults || noResults).toBeTruthy();
  });

  test('should navigate tree and filter by category', async ({ page }) => {
    await page.goto('/admin/kb');
    
    // Expand tree nodes
    const entitiesNode = page.locator('button:has-text("Entities & Data")');
    await entitiesNode.click();
    
    const profilesNode = page.locator('button:has-text("Profiles")');
    await profilesNode.click();
    
    // Click on a leaf node (e.g., Business)
    const businessNode = page.locator('button:has-text("Business")').first();
    await businessNode.click();
    
    // Wait for filter to apply
    await page.waitForTimeout(500);
    
    // Check that category badge appears
    await expect(page.locator('text=Category:')).toBeVisible();
  });

  test('should open and view knowledge item', async ({ page }) => {
    await page.goto('/admin/kb');
    
    // Wait for items to load
    await page.waitForTimeout(1000);
    
    // Click first result card if exists
    const firstCard = page.locator('[role="article"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      
      // Wait for markdown viewer to open
      await page.waitForTimeout(500);
      
      // Check viewer is visible with actions
      await expect(page.locator('button:has-text("Edit")')).toBeVisible();
      await expect(page.locator('button:has-text("History")')).toBeVisible();
    }
  });

  test('should open edit dialog', async ({ page }) => {
    await page.goto('/admin/kb');
    
    await page.waitForTimeout(1000);
    
    const firstCard = page.locator('[role="article"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);
      
      // Click edit button
      await page.locator('button:has-text("Edit")').click();
      
      // Check dialog opens
      await expect(page.locator('text=Edit Knowledge Item')).toBeVisible();
      await expect(page.locator('label:has-text("Title")')).toBeVisible();
      await expect(page.locator('label:has-text("Content (YAML + Markdown)")')).toBeVisible();
      
      // Close without saving
      await page.locator('button:has-text("Cancel")').click();
    }
  });

  test('should switch between scope tabs', async ({ page }) => {
    await page.goto('/admin/kb');
    
    // Check Global is active by default
    const globalTab = page.locator('button[role="tab"]:has-text("Global")');
    await expect(globalTab).toHaveAttribute('data-state', 'active');
    
    // Switch to Site
    const siteTab = page.locator('button[role="tab"]:has-text("Site")');
    await siteTab.click();
    await expect(siteTab).toHaveAttribute('data-state', 'active');
    
    // Switch to User
    const userTab = page.locator('button[role="tab"]:has-text("User")');
    await userTab.click();
    await expect(userTab).toHaveAttribute('data-state', 'active');
  });

  test('should add and remove tags filter', async ({ page }) => {
    await page.goto('/admin/kb');
    
    // Open filter popover
    const filterButton = page.locator('button').filter({ has: page.locator('svg') }).nth(1); // Filter icon
    await filterButton.click();
    
    // Add a tag
    await page.fill('input[placeholder="Enter tag..."]', 'test-tag');
    await page.click('button:has-text("Add")');
    
    // Check tag badge appears
    await expect(page.locator('text=test-tag')).toBeVisible();
    
    // Remove tag
    const removeTagButton = page.locator('[role="status"]:has-text("test-tag")').locator('svg').last();
    await removeTagButton.click();
    
    // Tag should be gone
    await expect(page.locator('text=test-tag')).not.toBeVisible();
  });

  test('should clear all filters', async ({ page }) => {
    await page.goto('/admin/kb');
    
    // Add search
    await page.fill('input[placeholder*="Search knowledge"]', 'test query');
    await page.waitForTimeout(500);
    
    // Click tree item to add category filter
    await page.locator('button:has-text("Entities & Data")').click();
    await page.locator('button:has-text("Profiles")').click();
    await page.locator('button:has-text("Business")').first().click();
    
    // Clear all
    await page.click('button:has-text("Clear")');
    
    // Check search is cleared
    const searchInput = page.locator('input[placeholder*="Search knowledge"]');
    await expect(searchInput).toHaveValue('');
    
    // Check no filter badges
    await expect(page.locator('text=Category:')).not.toBeVisible();
  });
});
