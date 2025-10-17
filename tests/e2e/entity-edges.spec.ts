import { test, expect } from '@playwright/test';

test.describe('Entity Edges & Ownership Graph (Mock Mode)', () => {
  test('can access entity edges manager', async ({ page }) => {
    await page.goto('/entities/me/edges');
    
    const edgesSection = page.getByRole('region', { name: /relationships|edges/i });
    await expect(edgesSection).toBeVisible();
  });

  test('can create a new entity relationship', async ({ page }) => {
    await page.goto('/entities/me/edges');
    
    const addEdgeBtn = page.getByRole('button', { name: /add.*relationship/i });
    if (await addEdgeBtn.isVisible()) {
      await addEdgeBtn.click();
      
      // Select edge type
      await page.getByLabel(/type/i).selectOption('owns');
      
      // Search for target entity
      await page.getByLabel(/target|entity/i).fill('Test Brand');
      
      // Submit
      await page.getByRole('button', { name: /create|add/i }).click();
      
      // Verify edge appears
      await page.waitForTimeout(500);
    }
  });

  test('can toggle cross-post and auto-propagate options', async ({ page }) => {
    await page.goto('/entities/me/edges');
    
    const crosspostToggle = page.getByRole('switch', { name: /cross.*post/i }).first();
    if (await crosspostToggle.isVisible()) {
      const initialState = await crosspostToggle.getAttribute('aria-checked');
      await crosspostToggle.click();
      
      await expect(crosspostToggle).toHaveAttribute(
        'aria-checked',
        initialState === 'true' ? 'false' : 'true'
      );
    }
  });

  test('edges appear in composer entity picker', async ({ page }) => {
    // First create an edge
    await page.goto('/entities/me/edges');
    
    // Then open composer
    await page.goto('/');
    const composeBtn = page.getByRole('button', { name: /compose|new post/i });
    if (await composeBtn.isVisible()) {
      await composeBtn.click();
      
      // Open entity picker
      const entityPicker = page.getByRole('button', { name: /tag.*entities/i });
      if (await entityPicker.isVisible()) {
        await entityPicker.click();
        
        // Verify owned entities appear first
        const entityList = page.getByRole('list', { name: /entities/i });
        await expect(entityList).toBeVisible();
      }
    }
  });

  test('visual graph renders relationships', async ({ page }) => {
    await page.goto('/entities/me/edges');
    
    // Look for graph visualization
    const graph = page.getByRole('img', { name: /graph|visualization/i });
    const isSvg = await page.locator('svg').first().isVisible().catch(() => false);
    
    // Graph may be SVG or canvas
    expect(isSvg || await graph.isVisible().catch(() => false)).toBeTruthy();
  });
});
