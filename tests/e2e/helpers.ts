/**
 * Playwright E2E Test Helpers
 * Provides auth mocking and chat reply interception
 */

import { expect, Page } from '@playwright/test';

export type Role = 'user' | 'admin' | 'super_admin';

const CHAT_ENDPOINT_RE = /\/functions\/v1\/(chat\.reply|andy_chat|mdr_generate|orchestrate)/i;

const HEAVY_MESSAGE = [
  'Objective: Clean route bloat to ~31 routes (from 39).',
  'Prep: Git, pnpm, branch; ~2.5h.',
  'Steps:',
  '1. Archive 5 replaced files (no deletes).',
  '2. Pick one dashboard, archive others.',
  '3. Remove admin/overlay routes from App.tsx (overlays/tabs).',
  '4. Verify: grep path= ≈31, pnpm build, e2e green.',
  'Risks & Mitigations: hidden dynamic imports → grep lazy/dynamic; rollback via git revert.',
  'Verify & Next: run CI, merge; phase 2 collapse panels into tabs.'
].join('\n');

const LIGHT_MESSAGE =
  'Here's a quick plan: archive the old rocker/andy files, choose a single dashboard, shift admin/overlay routes out of App.tsx, then build & run e2e. If anything breaks, revert.';

/**
 * Login as a specific role (mocked for E2E)
 */
export async function loginAs(page: Page, role: Role = 'user') {
  // App-agnostic: simulate session with localStorage + cookie
  await page.addInitScript((r: Role) => {
    try {
      localStorage.setItem('auth:logged_in', 'true');
      localStorage.setItem('auth:role', r);
      localStorage.setItem('auth:user_id', '00000000-0000-0000-0000-000000000007');
    } catch {}
  }, role);

  await page.context().addCookies([
    { name: 'role', value: role, url: 'http://localhost:5173', path: '/' }
  ]);
}

/**
 * Mock chat replies based on UI pathway mode toggles
 * Tracks live mode/flag by listening to UI changes
 */
export async function mockChatReply(page: Page) {
  // Track the **live** mode/flag by listening to UI changes
  await page.addInitScript(() => {
    (window as any).__PW_MODE__ = 'heavy';           // heavy | light | auto
    (window as any).__PW_FLAG_HEAVY__ = true;        // global default

    document.addEventListener(
      'change',
      (ev) => {
        const t = ev.target as HTMLElement | null;
        if (!t) return;

        // Pathway Mode select: by data-testid or label fallback
        const isModeSelect =
          (t as HTMLElement).getAttribute?.('data-testid') === 'select-pathway-mode' ||
          t.closest('label')?.textContent?.match(/Action Pathways/i);

        if (isModeSelect && (t as HTMLSelectElement).value) {
          (window as any).__PW_MODE__ = (t as HTMLSelectElement).value;
        }

        // Global Heavy flag switch
        const isGlobalHeavy =
          (t as HTMLElement).getAttribute?.('data-testid') === 'flag-pathway_heavy_default';

        if (isGlobalHeavy && (t as HTMLInputElement).checked !== undefined) {
          (window as any).__PW_FLAG_HEAVY__ = (t as HTMLInputElement).checked;
        }
      },
      true
    );
  });

  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    // Only intercept our chat-ish calls (POST to functions)
    if (method === 'POST' && CHAT_ENDPOINT_RE.test(url)) {
      const mode = await page.evaluate(() => (window as any).__PW_MODE__ ?? 'heavy');
      const heavyDefault = await page.evaluate(() => !!(window as any).__PW_FLAG_HEAVY__);

      const effective =
        mode === 'auto' ? (heavyDefault ? 'heavy' : 'light') : (mode || 'heavy');

      const text = effective === 'heavy' ? HEAVY_MESSAGE : LIGHT_MESSAGE;

      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          message: {
            role: 'assistant',
            content: text
          }
        })
      });
    }

    return route.continue();
  });
}

/**
 * Optional: Set pathway mode via cookie
 */
export async function setPathwayModeCookie(page: Page, mode: 'heavy' | 'light' | 'auto') {
  await page.context().addCookies([
    { name: 'pathway_mode', value: mode, url: 'http://localhost:5173' }
  ]);
}

/**
 * Optional: Toggle global heavy flag via cookie
 */
export async function toggleGlobalHeavyFlag(page: Page, on: boolean) {
  await page.context().addCookies([
    { name: 'flag_pathway_heavy_default', value: on ? '1' : '0', url: 'http://localhost:5173' }
  ]);
}

/**
 * Wait for chat response to appear
 */
export async function waitForChatResponse(page: Page, timeout = 5000) {
  await page.waitForSelector('[data-testid="chat-msg-out"]', { timeout });
}

/**
 * Send a chat message and wait for response
 */
export async function sendChatMessage(page: Page, message: string) {
  await page.fill('[data-testid="chat-input"]', message);
  await page.click('[data-testid="chat-send"]');
  await waitForChatResponse(page);
}

/**
 * Navigate to a route and wait for it to load
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Check if element contains text (case insensitive)
 */
export async function expectTextInElement(page: Page, selector: string, text: string) {
  const content = await page.textContent(selector);
  expect(content?.toLowerCase()).toContain(text.toLowerCase());
}
