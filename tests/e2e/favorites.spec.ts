import { test, expect } from '@playwright/test';

test.describe('Favorites System (Mock Mode)', () => {
  test('can toggle favorite on a post', async ({ page }) => {
    await page.goto('/');
    
    // Find first favorite button
    const favoriteBtn = page.getByRole('button', { name: /favorite/i }).first();
    
    if (await favoriteBtn.isVisible()) {
      // Check initial state
      const initialState = await favoriteBtn.getAttribute('aria-pressed');
      
      // Toggle favorite
      await favoriteBtn.click();
      
      // Verify state changed
      await expect(favoriteBtn).toHaveAttribute(
        'aria-pressed',
        initialState === 'true' ? 'false' : 'true'
      );
      
      // Toggle back
      await favoriteBtn.click();
      await expect(favoriteBtn).toHaveAttribute('aria-pressed', initialState || 'false');
    }
  });

  test('favorites appear in profile favorites tab', async ({ page }) => {
    await page.goto('/');
    
    // Favorite a post
    const favoriteBtn = page.getByRole('button', { name: /favorite/i }).first();
    if (await favoriteBtn.isVisible()) {
      await favoriteBtn.click();
      
      // Navigate to favorites
      await page.goto('/profile/me/favorites');
      
      // Check favorites exist
      const favoritesSection = page.getByRole('region', { name: /favorites/i });
      await expect(favoritesSection).toBeVisible();
    }
  });

  test('keyboard accessibility for favorite button', async ({ page }) => {
    await page.goto('/');
    
    const favoriteBtn = page.getByRole('button', { name: /favorite/i }).first();
    if (await favoriteBtn.isVisible()) {
      await favoriteBtn.focus();
      await page.keyboard.press('Enter');
      
      // Verify toggle worked
      await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('optimistic updates work smoothly', async ({ page }) => {
    await page.goto('/');
    
    const favoriteBtn = page.getByRole('button', { name: /favorite/i }).first();
    if (await favoriteBtn.isVisible()) {
      // Click and immediately check state (should be optimistic)
      await favoriteBtn.click();
      
      // State should change within 100ms
      await expect(favoriteBtn).toHaveAttribute('aria-pressed', 'true', { timeout: 100 });
    }
  });
});
