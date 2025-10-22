/**
 * App Action Broker
 * High-level actions + DOM primitives
 */

import { typeInto, click, navigate, openOverlay, scroll, speak } from '@/rocker/runtime';

export type AppAction =
  | { kind: 'open-app'; app: string; params?: Record<string, string> }
  | { kind: 'navigate'; path: string }
  | { kind: 'search-yallbrary'; query: string }
  | { kind: 'type'; target: { testId?: string; role?: string; name?: string; placeholder?: string }; text: string }
  | { kind: 'click'; target: { testId?: string; role?: string; name?: string } }
  | { kind: 'scroll'; target?: { testId?: string; role?: string; name?: string }; behavior?: ScrollBehavior }
  | { kind: 'speak'; text: string };

export async function invokeAction(a: AppAction) {
  switch (a.kind) {
    case 'open-app':
      openOverlay(a.app, a.params);
      break;
    case 'navigate':
      navigate(a.path);
      break;
    case 'search-yallbrary':
      openOverlay('yallbrary');
      await new Promise(r => setTimeout(r, 200)); // wait for overlay
      await typeInto({ testId: 'yallbrary-search' }, a.query);
      await click({ testId: 'yallbrary-search-btn' });
      break;
    case 'type':
      await typeInto(a.target, a.text);
      break;
    case 'click':
      await click(a.target);
      break;
    case 'scroll':
      scroll(a.target, a.behavior ?? 'smooth');
      break;
    case 'speak':
      speak(a.text);
      break;
  }
}
