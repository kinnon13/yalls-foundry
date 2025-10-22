/**
 * Super Andy Dashboard E2E Tests
 * Tests proactive suggestions, self-improve, subagent runs, and chat
 */

import { test, expect } from '@playwright/test';
import { loginAs, mockChatReply, mockCoreApis } from './helpers';

test.describe('Super Andy Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'super_admin');
    await mockCoreApis(page);
    await mockChatReply(page);
  });

  test('loads dashboard rails and executes suggestion & self-improve', async ({ page }) => {
    await page.goto('/super-andy-v2');

    // Health strip/tiles present
    await expect(page.getByText(/Super Andy|Proactive|Self-Improve/i)).toBeVisible();

    // Ensure suggestions are visible
    const refreshBtn = page.getByTestId('suggestions-refresh')
      .or(page.getByRole('button', { name: /refresh/i }));
    
    if (await refreshBtn.isVisible().catch(() => false)) {
      await refreshBtn.click();
    }

    const rail = page.getByTestId('proactive-rail')
      .or(page.getByText(/Proactive Suggestions/i).locator('..'));
    
    await expect(rail).toBeVisible();
    await expect(rail.getByText(/Consolidate backlog|Optimize model routing cost|Improve reminder hygiene/i))
      .toHaveCount(3);

    // Execute the first suggestion
    const execBtn = rail.getByRole('button', { name: /Execute Now|Run|Start/i }).first();
    await execBtn.click();
    
    // Toast or status
    await expect(page.getByText(/Execution started|Probe enqueued|Queued/i))
      .toBeVisible({ timeout: 3000 });

    // Verify subagent runs table updates
    const runsTab = page.getByRole('tab', { name: /Runs|Subagents|Activity/i }).first();
    if (await runsTab.isVisible().catch(() => false)) {
      await runsTab.click();
    }

    const runsTable = page.getByTestId('subagent-runs-table')
      .or(page.getByRole('table'));
    
    await expect(runsTable).toBeVisible();
    await expect(runsTable.getByText(/orchestrator|subagent/i)).toBeVisible();

    // Kick self-improvement
    const siBtn = page.getByTestId('self-improve-run')
      .or(page.getByRole('button', { name: /Run Now/i }));
    
    await siBtn.click();
    await expect(page.getByText(/policy_weight|Increase focus on user impact/i))
      .toBeVisible({ timeout: 3000 });

    // Chat check: send a prompt and assert Heavy structure
    await page.goto('/super-andy');
    
    const input = page.getByTestId('chat-input')
      .or(page.getByPlaceholder(/Type a message|Ask/i));
    const send = page.getByTestId('chat-send')
      .or(page.getByRole('button', { name: /Send/i }));
    
    await input.fill('Give me a crisp action plan to clean routes.');
    await send.click();

    const last = page.locator('[data-testid="chat-msg-out"]').last()
      .or(page.getByText(/Objective:/i).last());
    
    await expect(last).toBeVisible({ timeout: 5000 });
    await expect(last).toContainText(/Objective:/i);
    await expect(last).toContainText(/Prep:/i);
    await expect(last).toContainText(/Steps:/i);
  });
});
