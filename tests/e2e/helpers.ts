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

/**
 * Mock core APIs for dashboards/rockers (incidents, budgets, routes, suggestions, etc.)
 */
export async function mockCoreApis(page: Page) {
  // Seed data used by multiple pages
  const incidents = [
    {
      id: 'inc-1',
      severity: 'medium',
      source: 'circuit_breaker',
      summary: 'Budget soft limit reached',
      detail: { spent: 16000, limit: 20000 },
      created_at: new Date().toISOString(),
      resolved_at: null
    }
  ];

  const modelRoutes = [
    { id: 'r1', tenant_id: null, task_class: 'chat.reply', preferred_model: 'grok-2', fallback_model: 'grok-mini', max_tokens: 8192, temperature: 0.4 },
    { id: 'r2', tenant_id: null, task_class: 'mdr.generate', preferred_model: 'grok-2', fallback_model: 'grok-mini', max_tokens: 12288, temperature: 0.3 },
    { id: 'r3', tenant_id: null, task_class: 'vision.analyze', preferred_model: 'grok-vision', fallback_model: 'grok-2', max_tokens: 8192, temperature: 0.2 }
  ];

  const budgets = [
    { id: 'b1', tenant_id: null, limit_cents: 20000, spent_cents: 16000, period: 'monthly', window_start: null, window_end: null }
  ];

  const suggestions = [
    { id: 's1', title: 'Consolidate backlog', confidence: 0.85, description: 'Merge duplicate dashboards; reduce routes.' },
    { id: 's2', title: 'Optimize model routing cost', confidence: 0.92, description: 'Downgrade non-critical tasks at 80% budget.' },
    { id: 's3', title: 'Improve reminder hygiene', confidence: 0.78, description: 'Tighten daily digest filters.' }
  ];

  const subagentRuns = [
    { id: 'run-1', agent_name: 'orchestrator', task_id: 't-123', success: true, created_at: new Date().toISOString() }
  ];

  const ledger = [
    { id: 'evt-1', topic: 'orchestrate.spawn', payload: { agents: 2 }, created_at: new Date().toISOString() }
  ];

  // Generic route interceptor
  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    // Edge functions (Deno/Supabase functions)
    if (method === 'GET' && /\/functions\/v1\/ai_health/i.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'ok',
          checks: [
            { name: 'database', status: 'ok', latency_ms: 100 },
            { name: 'ai_action_ledger', status: 'ok' },
            { name: 'ai_brain_state', status: 'ok' },
            { name: 'system_metrics', status: 'ok' },
            { name: 'audit_log', status: 'ok' }
          ]
        })
      });
    }

    if (method === 'POST' && /\/functions\/v1\/perceive_tick/i.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, suggestions }) });
    }

    if (method === 'POST' && /\/functions\/v1\/self_improve_tick/i.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          change: {
            id: 'chg-1',
            type: 'policy_weight',
            before: { life_impact: 0.30 },
            after: { life_impact: 0.35 },
            rationale: 'Increase focus on user impact'
          }
        })
      });
    }

    if (method === 'POST' && /\/functions\/v1\/(orchestrate|mdr_orchestrate)/i.test(url)) {
      // spawn subagents, return success
      subagentRuns.unshift({
        id: 'run-' + Math.random().toString(36).slice(2, 8),
        agent_name: 'subagent',
        task_id: 't-' + Math.random().toString(36).slice(2, 6),
        success: true,
        created_at: new Date().toISOString()
      });
      ledger.unshift({ id: 'evt-' + Date.now(), topic: 'orchestrate.spawn', payload: { agents: 1 }, created_at: new Date().toISOString() });

      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, queued: true }) });
    }

    // Supabase REST style (tables)
    const isGET = (table: string) => method === 'GET' && /\/rest\/v1\//i.test(url) && url.includes(table);
    const isPATCH = (table: string) => method === 'PATCH' && /\/rest\/v1\//i.test(url) && url.includes(table);
    const isPOST = (table: string) => method === 'POST' && /\/rest\/v1\//i.test(url) && url.includes(table);

    // incidents
    if (isGET('ai_incidents')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(incidents) });
    }
    if (isPATCH('ai_incidents')) {
      try {
        const body = JSON.parse(req.postData() || '[]');
        body.forEach((row: any) => {
          const idx = incidents.findIndex((i) => i.id === row.id);
          if (idx >= 0) incidents[idx] = { ...incidents[idx], ...row };
        });
      } catch {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(incidents) });
    }

    // budgets
    if (isGET('ai_model_budget')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(budgets) });
    }
    if (isPATCH('ai_model_budget')) {
      try {
        const body = JSON.parse(req.postData() || '[]');
        body.forEach((row: any) => {
          budgets[0] = { ...budgets[0], ...row };
        });
      } catch {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(budgets) });
    }

    // routes
    if (isGET('ai_model_routes')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(modelRoutes) });
    }
    if (isPATCH('ai_model_routes')) {
      try {
        const body = JSON.parse(req.postData() || '[]');
        body.forEach((row: any) => {
          const idx = modelRoutes.findIndex((r) => r.id === row.id || (r.task_class === row.task_class && r.tenant_id === row.tenant_id));
          if (idx >= 0) modelRoutes[idx] = { ...modelRoutes[idx], ...row };
        });
      } catch {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(modelRoutes) });
    }

    // subagent runs
    if (isGET('ai_subagent_runs')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(subagentRuns) });
    }

    // action ledger
    if (isGET('ai_action_ledger')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ledger) });
    }

    // user profiles (prefs page)
    if (isGET('ai_user_profiles')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            user_id: '00000000-0000-0000-0000-000000000007',
            tone: 'friendly concise',
            verbosity: 'medium',
            format_pref: 'bullets',
            approval_mode: 'ask',
            suggestion_freq: 'daily',
            pathway_mode: 'auto',
            visual_pref: ''
          }
        ])
      });
    }
    if (isPATCH('ai_user_profiles') || isPOST('ai_user_profiles')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ updated: true }]) });
    }

    return route.continue();
  });
}

/**
 * Mock Super Console APIs (pools, heartbeats, control flags, and breaker tick)
 */
export async function mockSuperConsoleApis(page: Page) {
  const pools = [
    { id: 'p-rt', pool: 'realtime', max_concurrency: 106, current_concurrency: 40, burst: 212, updated_at: new Date().toISOString() },
    { id: 'p-hvy', pool: 'heavy', max_concurrency: 106, current_concurrency: 30, burst: 141, updated_at: new Date().toISOString() },
    { id: 'p-adm', pool: 'admin', max_concurrency: 53, current_concurrency: 12, burst: 71, updated_at: new Date().toISOString() }
  ];

  const heartbeats = [
    { id: 'hb-1', pool: 'realtime', worker_id: 'w-01', last_beat_at: new Date().toISOString(), version: '1.2.3' },
    { id: 'hb-2', pool: 'heavy', worker_id: 'w-02', last_beat_at: new Date().toISOString(), version: '1.2.3' }
  ];

  let flags = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      global_pause: false,
      write_freeze: false,
      external_calls_enabled: true,
      burst_override: false,
      updated_at: new Date().toISOString()
    }
  ];

  // === REST table mocks ===
  await page.route('**/rest/v1/ai_worker_pools**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pools) });
    }
    if (method === 'PATCH') {
      try {
        const body = JSON.parse(route.request().postData() || '[]');
        body.forEach((row: any) => {
          const i = pools.findIndex((p) => p.id === row.id || p.pool === row.pool);
          if (i >= 0) pools[i] = { ...pools[i], ...row, updated_at: new Date().toISOString() };
        });
      } catch {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(pools) });
    }
    return route.continue();
  });

  await page.route('**/rest/v1/ai_worker_heartbeats**', async (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(heartbeats) });
  });

  await page.route('**/rest/v1/ai_control_flags**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(flags) });
    }
    if (method === 'PATCH') {
      try {
        const body = JSON.parse(route.request().postData() || '[]');
        body.forEach((row: any) => {
          flags[0] = { ...flags[0], ...row, updated_at: new Date().toISOString() };
        });
      } catch {}
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(flags) });
    }
    return route.continue();
  });

  // === Edge Function: circuit_breaker_tick ===
  await page.route('**/functions/v1/circuit_breaker_tick', async (route) => {
    const clamped = pools.map((p) => ({ pool: p.pool, new_concurrency: Math.max(1, Math.floor(p.current_concurrency * 0.7)) }));
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        api_breakers: [{ service: 'model_router', state: 'closed', error_pct: 2 }],
        topic_breakers: [],
        budget: { spent: 16000, limit: 20000, pct: 0.8 },
        dlqCount: 0,
        clampPreview: clamped
      })
    });
  });
}
