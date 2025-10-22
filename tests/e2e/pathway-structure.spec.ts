/**
 * Pathway Structure E2E Tests
 * Validates structured vs free-form responses based on user preferences
 */

import { test, expect } from '@playwright/test';
import { loginAs, mockChatReply, sendChatMessage, navigateTo } from './helpers';

test.describe('Pathway Structure', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'user');
    await mockChatReply(page);
  });

  test('Heavy mode delivers structured Pathway format', async ({ page }) => {
    // 1. Set preferences to Heavy
    await navigateTo(page, '/rocker/preferences');
    
    const pathwaySelect = page.locator('[data-testid="select-pathway-mode"]')
      .or(page.locator('select').filter({ hasText: /Action Pathways/i }))
      .or(page.getByLabel(/Action Pathways/i));
    
    await pathwaySelect.selectOption('heavy');
    
    const saveBtn = page.locator('[data-testid="prefs-save"]')
      .or(page.getByRole('button', { name: /save/i }));
    await saveBtn.click();
    
    await page.waitForTimeout(500);

    // 2. Go to chat
    await navigateTo(page, '/super-andy');

    // 3. Ask for a plan
    await sendChatMessage(page, 'Give me a plan to reduce routes to 31');

    // 4. Verify structured response
    const msgOut = page.locator('[data-testid="chat-msg-out"]')
      .or(page.locator('.message-assistant').last())
      .or(page.locator('[role="article"]').last());

    const text = await msgOut.textContent();
    
    expect(text).toContain('Objective:');
    expect(text).toContain('Prep:');
    expect(text).toContain('Steps:');
    expect(text).toContain('Risks');
    expect(text).toContain('Verify');
  });

  test('Light mode delivers free-form response', async ({ page }) => {
    // 1. Set preferences to Light
    await navigateTo(page, '/rocker/preferences');
    
    const pathwaySelect = page.locator('[data-testid="select-pathway-mode"]')
      .or(page.locator('select').filter({ hasText: /Action Pathways/i }))
      .or(page.getByLabel(/Action Pathways/i));
    
    await pathwaySelect.selectOption('light');
    
    const saveBtn = page.locator('[data-testid="prefs-save"]')
      .or(page.getByRole('button', { name: /save/i }));
    await saveBtn.click();
    
    await page.waitForTimeout(500);

    // 2. Go to chat
    await navigateTo(page, '/super-andy');

    // 3. Ask for a plan
    await sendChatMessage(page, 'Give me a plan to reduce routes to 31');

    // 4. Verify free-form response (no Pathway structure)
    const msgOut = page.locator('[data-testid="chat-msg-out"]')
      .or(page.locator('.message-assistant').last())
      .or(page.locator('[role="article"]').last());

    const text = await msgOut.textContent();
    
    expect(text).not.toContain('Objective:');
    expect(text).not.toContain('Prep:');
    expect(text).not.toContain('Steps:');
    expect(text).toContain('plan');
  });

  test('Auto mode follows global flag', async ({ page }) => {
    // 1. Set user preference to Auto
    await navigateTo(page, '/rocker/preferences');
    
    const pathwaySelect = page.locator('[data-testid="select-pathway-mode"]')
      .or(page.locator('select').filter({ hasText: /Action Pathways/i }))
      .or(page.getByLabel(/Action Pathways/i));
    
    await pathwaySelect.selectOption('auto');
    
    const saveBtn = page.locator('[data-testid="prefs-save"]')
      .or(page.getByRole('button', { name: /save/i }));
    await saveBtn.click();
    
    await page.waitForTimeout(500);

    // 2. Test with flag ON (should get Heavy)
    await navigateTo(page, '/super/flags');
    
    const flagToggle = page.locator('[data-testid="flag-pathway_heavy_default"]')
      .or(page.locator('input[type="checkbox"]').filter({ hasText: /pathway/i }))
      .or(page.getByLabel(/pathway.*heavy/i));
    
    await flagToggle.check();
    await page.waitForTimeout(500);

    await navigateTo(page, '/super-andy');
    await sendChatMessage(page, 'Give me a plan to reduce routes to 31');

    let msgOut = page.locator('[data-testid="chat-msg-out"]')
      .or(page.locator('.message-assistant').last())
      .or(page.locator('[role="article"]').last());

    let text = await msgOut.textContent();
    expect(text).toContain('Objective:');
    expect(text).toContain('Steps:');

    // 3. Test with flag OFF (should get Light)
    await navigateTo(page, '/super/flags');
    await flagToggle.uncheck();
    await page.waitForTimeout(500);

    await navigateTo(page, '/super-andy');
    await sendChatMessage(page, 'Give me another plan');

    msgOut = page.locator('[data-testid="chat-msg-out"]')
      .or(page.locator('.message-assistant').last())
      .or(page.locator('[role="article"]').last());

    text = await msgOut.textContent();
    expect(text).not.toContain('Objective:');
    expect(text).not.toContain('Prep:');
  });

  test('Verbosity low compresses to 3 steps', async ({ page }) => {
    await navigateTo(page, '/rocker/preferences');
    
    // Set Heavy + Low verbosity
    const pathwaySelect = page.locator('[data-testid="select-pathway-mode"]')
      .or(page.getByLabel(/Action Pathways/i));
    await pathwaySelect.selectOption('heavy');
    
    const verbositySelect = page.locator('[data-testid="select-verbosity"]')
      .or(page.getByLabel(/Verbosity/i));
    await verbositySelect.selectOption('terse');
    
    const saveBtn = page.locator('[data-testid="prefs-save"]')
      .or(page.getByRole('button', { name: /save/i }));
    await saveBtn.click();
    
    await page.waitForTimeout(500);

    await navigateTo(page, '/super-andy');
    await sendChatMessage(page, 'Give me a plan with many steps');

    const msgOut = page.locator('[data-testid="chat-msg-out"]')
      .or(page.locator('.message-assistant').last());

    const text = await msgOut.textContent();
    
    // Should have Steps: but max 3
    expect(text).toContain('Steps:');
    const stepMatches = text?.match(/^\d+\./gm);
    expect(stepMatches?.length).toBeLessThanOrEqual(3);
  });
});
