/**
 * Universal Rocker Runtime
 * Core primitives for User Rocker: talk, type, click, nav, scroll
 */

type Selector = { 
  testId?: string; 
  role?: string; 
  name?: string; 
  placeholder?: string 
};

function find(sel: Selector): HTMLElement | null {
  if (sel.testId) {
    const byId = document.querySelector<HTMLElement>(`[data-testid="${sel.testId}"]`);
    if (byId) return byId;
  }
  if (sel.role || sel.name) {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[role]'));
    const m = nodes.find(n =>
      (!sel.role || n.getAttribute('role') === sel.role) &&
      (!sel.name || (n.getAttribute('aria-label') || n.textContent || '').match(new RegExp(sel.name, 'i')))
    );
    if (m) return m;
  }
  if (sel.placeholder) {
    const m = document.querySelector<HTMLElement>(`input[placeholder*="${sel.placeholder}"],textarea[placeholder*="${sel.placeholder}"]`);
    if (m) return m;
  }
  return null;
}

export async function typeInto(sel: Selector, text: string) {
  const el = find(sel) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) throw new Error('Target not found');
  el.focus();
  el.value = text;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export async function click(sel: Selector) {
  const el = find(sel);
  if (!el) throw new Error('Target not found');
  (el as HTMLElement).focus();
  (el as HTMLElement).click();
}

export function navigate(path: string) {
  history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function openOverlay(appKey: string, params?: Record<string, string>) {
  const url = new URL(location.href);
  url.searchParams.set('app', appKey);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  history.pushState({}, '', url.toString());
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function scroll(sel?: Selector, behavior: ScrollBehavior = 'smooth') {
  if (!sel) { 
    window.scrollTo({ top: 0, behavior }); 
    return; 
  }
  const el = find(sel);
  if (el) (el as HTMLElement).scrollIntoView({ behavior, block: 'center' });
}

export function speak(text: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }
}

export function listen(onResult: (text: string) => void): () => void {
  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) throw new Error('SpeechRecognition not supported');
  const sr = new SR();
  sr.lang = 'en-US'; 
  sr.interimResults = false; 
  sr.maxAlternatives = 1;
  sr.onresult = (e: any) => onResult(e.results[0][0].transcript);
  sr.start();
  return () => sr.stop();
}
