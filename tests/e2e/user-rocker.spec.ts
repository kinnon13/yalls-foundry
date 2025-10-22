/**
 * User Rocker E2E Tests
 * Tests hub, preferences, and chat behavior with pathway settings
 */

import { test, expect } from '@playwright/test';
import { loginAs, mockChatReply, mockCoreApis } from './helpers';

test.describe('User Rocker', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'user');
    await mockCoreApis(page);
    await mockChatReply(page);
  });

  test('Hub loads, prefs save, chat reflects Heavy Pathway', async ({ page }) => {
    // Hub
    await page.goto('/rocker');
    await expect(page.getByText(/Rocker|Hub|Quick Links/i)).toBeVisible();

    // Preferences
    await page.goto('/rocker/preferences');
    
    const modeSel = page.getByTestId('select-pathway-mode')
      .or(page.getByLabel(/Action Pathways/i));
    
    await expect(modeSel).toBeVisible();
    await modeSel.selectOption('heavy');

    const toneSel = page.getByTestId('select-tone')
      .or(page.getByLabel(/Tone/i));
    
    if (await toneSel.isVisible().catch(() => false)) {
      await toneSel.selectOption('friendly concise');
    }

    const save = page.getByTestId('prefs-save')
      .or(page.getByRole('button', { name: /Save/i }));
    
    await save.click();
    await expect(page.getByText(/Saved|Updated/i))
      .toBeVisible({ timeout: 3000 });

    // Chat reflects Heavy
    await page.goto('/super-andy');
    
    const input = page.getByTestId('chat-input')
      .or(page.getByPlaceholder(/Type a message|Ask/i));
    const send = page.getByTestId('chat-send')
      .or(page.getByRole('button', { name: /Send/i }));
    
    await input.fill('Plan my cleanup.');
    await send.click();

    const msg = page.locator('[data-testid="chat-msg-out"]').last()
      .or(page.getByText(/Objective:/i).last());
    
    await expect(msg).toBeVisible({ timeout: 5000 });
    await expect(msg).toContainText(/Objective:/i);
    await expect(msg).toContainText(/Prep:/i);
    await expect(msg).toContainText(/Steps:/i);
  });
});
