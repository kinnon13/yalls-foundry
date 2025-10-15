/**
 * Rocker DOM Agent
 * 
 * Enables Rocker to interact with page elements:
 * - Find and click buttons
 * - Fill form fields
 * - Submit forms
 * - Read page content
 */

export interface DOMAction {
  type: 'click' | 'fill' | 'submit' | 'read' | 'scroll';
  selector?: string;
  value?: string; // for scroll: 'top' | 'bottom' | 'up' | 'down' | pixel amount
  targetName?: string; // e.g., "post button", "comment field"
}

/** Helper functions for fuzzy matching and labeling */
function getElementLabel(el: HTMLElement): string {
  const text = el.textContent || '';
  const aria = el.getAttribute('aria-label') || '';
  const rocker = el.getAttribute('data-rocker') || '';
  const placeholder = (el as HTMLElement).getAttribute?.('placeholder') || '';
  return [text, aria, rocker, placeholder].join(' ').toLowerCase().trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

function fuzzyFind(candidates: HTMLElement[], target: string): HTMLElement | null {
  const t = target.toLowerCase().trim();
  const tTokens = t.split(/\s+/);
  let best: { el: HTMLElement; score: number } | null = null;
  for (const el of candidates) {
    const label = getElementLabel(el);
    if (!label) continue;
    if (label.includes(t)) return el;
    let min = Infinity;
    const tokens = label.split(/[^a-z0-9]+/);
    for (const tok of tokens) {
      if (!tok) continue;
      for (const q of tTokens) {
        const d = levenshtein(tok, q);
        if (d < min) min = d;
        if (d <= 1) return el; // fast path near-match
      }
    }
    if (!best || min < best.score) best = { el, score: min };
  }
  if (best && best.score <= 2) return best.el;
  return null;
}

/**
 * Find element by various strategies
 */
export function findElement(targetName: string): HTMLElement | null {
  const normalized = targetName.toLowerCase().trim();
  
  // Try data-rocker attributes first (explicit markers)
  let el = document.querySelector(`[data-rocker="${normalized}"]`) as HTMLElement;
  if (el) return el;
  
  // Try partial data-rocker match
  el = document.querySelector(`[data-rocker*="${normalized}"]`) as HTMLElement;
  if (el) return el;
  
  // Try by aria-label
  el = document.querySelector(`[aria-label*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  // Try by placeholder
  el = document.querySelector(`[placeholder*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  // Try by button text content
  const buttons = Array.from(document.querySelectorAll('button'));
  el = buttons.find(btn => btn.textContent?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;

  // Try by link text content (prioritize links with buttons inside)
  const links = Array.from(document.querySelectorAll('a'));
  el = links.find(a => {
    const text = a.textContent?.toLowerCase() || '';
    const ariaLabel = a.getAttribute('aria-label')?.toLowerCase() || '';
    const dataRocker = a.getAttribute('data-rocker')?.toLowerCase() || '';
    return text.includes(normalized) || ariaLabel.includes(normalized) || dataRocker.includes(normalized);
  }) as HTMLElement;
  if (el) {
    // If link contains a button, return the button for better interaction
    const innerButton = el.querySelector('button');
    if (innerButton) return innerButton;
    return el;
  }
  
  // Try by role-based buttons and tabs
  const roleButtons = Array.from(document.querySelectorAll('[role="button"], [role="tab"]')) as HTMLElement[];
  el = roleButtons.find(node => node.textContent?.toLowerCase().includes(normalized) || node.getAttribute('aria-label')?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;
  
  // Try by input name/id
  el = document.querySelector(`input[name*="${normalized}" i], input[id*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  // Try by textarea
  el = document.querySelector(`textarea[name*="${normalized}" i], textarea[placeholder*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  // Try by generic elements with matching data-rocker (partial)
  el = document.querySelector(`[data-rocker*="${normalized}"]`) as HTMLElement;
  if (el) return el;
  
  // Try label text -> associated control
  const labels = Array.from(document.querySelectorAll('label')) as HTMLLabelElement[];
  const matchedLabel = labels.find(l => (l.textContent || '').toLowerCase().includes(normalized));
  if (matchedLabel) {
    let control: HTMLElement | null = null;
    const forId = matchedLabel.getAttribute('for') || (matchedLabel as any).htmlFor;
    if (forId) {
      control = document.getElementById(forId) as HTMLElement | null;
    }
    if (!control) {
      control = matchedLabel.querySelector('input, textarea, select') as HTMLElement | null;
    }
    if (!control) {
      const parent = matchedLabel.parentElement;
      control = parent?.querySelector('input, textarea, select') as HTMLElement | null;
    }
    if (!control) {
      let sib: Element | null = matchedLabel.nextElementSibling;
      while (sib && !control) {
        if ((sib as HTMLElement).matches?.('input, textarea, select')) {
          control = sib as HTMLElement;
          break;
        }
        const nested = (sib as HTMLElement).querySelector?.('input, textarea, select') as HTMLElement | null;
        if (nested) { control = nested; break; }
        sib = sib.nextElementSibling;
      }
    }
    if (control) return control as HTMLElement;
  }
  
  // Try Radix Select options by text
  const options = Array.from(document.querySelectorAll('[role="option"], [data-radix-select-item]')) as HTMLElement[];
  el = options.find(node => node.textContent?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;
  
  // Try by any clickable element with matching text
  const clickables = Array.from(document.querySelectorAll('[onclick], .cursor-pointer')) as HTMLElement[];
  el = clickables.find(elem => elem.textContent?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;
  
  return null;
}

/**
 * Click an element (button, link, etc.)
 */
export function clickElement(targetName: string): { success: boolean; message: string } {
  console.log('[DOM Agent] Attempting to click:', targetName);
  
  const el = findElement(targetName);
  if (!el) {
    return { 
      success: false, 
      message: `Could not find "${targetName}" to click. Available buttons: ${getAvailableButtons().join(', ')}` 
    };
  }
  
  // Scroll into view and simulate real user interaction
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try {
    const evtInit: any = { bubbles: true, cancelable: true, composed: true, pointerId: 1, isPrimary: true, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', evtInit));
    el.dispatchEvent(new MouseEvent('mousedown', evtInit));
    el.dispatchEvent(new PointerEvent('pointerup', evtInit));
    el.dispatchEvent(new MouseEvent('mouseup', evtInit));
    (el as HTMLElement).click();
    // Also try keyboard for components listening to key events
    (el as HTMLElement).focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  } catch (e) {
    console.warn('[DOM Agent] Click error:', e);
  }

  // Fallbacks for known targets
  const t = targetName.toLowerCase();
  if ((t.includes('new calendar') || t.includes('create calendar')) && (window as any).__openCreateCalendar) {
    try { (window as any).__openCreateCalendar(); } catch {}
  }
  if ((t.includes('new collection') || t.includes('create collection')) && (window as any).__openCreateCollection) {
    try { (window as any).__openCreateCollection(); } catch {}
  }
  
  return { success: true, message: `Clicked "${targetName}"` };
}

/**
 * Fill a form field
 */
export function fillField(targetName: string, value: string): { success: boolean; message: string } {
  console.log('[DOM Agent] Attempting to fill:', targetName, 'with:', value);
  
  const el = findElement(targetName) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) {
    // Fallback: if user asked for calendar name but dialog isn't open yet, open it and retry shortly
    const t = targetName.toLowerCase();
    if (t.includes('calendar') && t.includes('name') && (window as any).__openCreateCalendar) {
      try { (window as any).__openCreateCalendar(); } catch {}
      setTimeout(() => {
        const retry = findElement(targetName) as HTMLInputElement | HTMLTextAreaElement | null;
        if (retry) {
          retry.focus();
          (retry as any).value = value;
          retry.dispatchEvent(new Event('input', { bubbles: true }));
          retry.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 120);
      return { success: true, message: `Opened dialog; filling "${targetName}"` };
    }
    return { 
      success: false, 
      message: `Could not find field "${targetName}". Available fields: ${getAvailableFields().join(', ')}` 
    };
  }
  
  // Scroll into view
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Focus and fill
  el.focus();
  el.value = value;
  
  // Trigger events for React/framework reactivity
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  
  return { success: true, message: `Filled "${targetName}" with "${value}"` };
}

/**
 * Submit a form
 */
export function submitForm(formName?: string): { success: boolean; message: string } {
  console.log('[DOM Agent] Attempting to submit form:', formName || 'nearest form');
  
  let form: HTMLFormElement | null;
  
  if (formName) {
    // Find form by name or nearby submit button
    const submitBtn = findElement(formName);
    form = submitBtn?.closest('form') || null;
  } else {
    // Find first form on page
    form = document.querySelector('form');
  }
  
  if (!form) {
    // Try to find a submit-like button by semantics or text
    const candidates = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
    const submitBtn = candidates.find((btn) => {
      const text = (btn.textContent || '').toLowerCase();
      const aria = (btn.getAttribute('aria-label') || '').toLowerCase();
      const rocker = (btn.getAttribute('data-rocker') || '').toLowerCase();
      return (
        btn.type === 'submit' ||
        /submit|save|create|confirm|continue|done/.test(text) ||
        /submit|save|create|confirm|continue|done/.test(aria) ||
        /submit|save|create|confirm|continue|done/.test(rocker)
      );
    });
    if (submitBtn) {
      submitBtn.click();
      return { success: true, message: 'Clicked submit-like button' };
    }
    return { success: false, message: 'Could not find form or submit button' };
  }
  
  // Trigger submit
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  
  return { success: true, message: 'Form submitted' };
}

/**
 * Read page content
 */
export function readPageContent(): { success: boolean; content: string } {
  const main = document.querySelector('main') || document.body;
  const text = main.textContent?.trim().substring(0, 500) || '';
  
  return {
    success: true,
    content: text
  };
}

/**
 * Get available buttons on page
 */
export function getAvailableButtons(): string[] {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons
    .map(btn => btn.textContent?.trim() || btn.getAttribute('aria-label'))
    .filter(Boolean) as string[];
}

/**
 * Get available form fields
 */
export function getAvailableFields(): string[] {
  const fields = Array.from(document.querySelectorAll('input, textarea'));
  return fields
    .map(field => {
      const name = field.getAttribute('name') 
        || field.getAttribute('placeholder') 
        || field.getAttribute('aria-label')
        || field.id;
      return name;
    })
    .filter(Boolean) as string[];
}

/**
 * Execute a DOM action
 */
export function executeDOMAction(action: DOMAction): { success: boolean; message: string; content?: string } {
  console.log('[DOM Agent] Executing action:', action);
  
  switch (action.type) {
    case 'click':
      return clickElement(action.targetName || action.selector || '');
      
    case 'fill':
      return fillField(action.targetName || action.selector || '', action.value || '');
      
    case 'submit':
      return submitForm(action.targetName);
      
    case 'read': {
      const result = readPageContent();
      return { 
        success: result.success, 
        message: 'Page content read',
        content: result.content 
      };
    }
    
    case 'scroll': {
      const val = (action.value || '').toLowerCase();
      const amount = parseInt(val, 10);
      if (val === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (val === 'bottom') {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      } else if (val === 'up') {
        window.scrollBy({ top: -window.innerHeight * 0.8, behavior: 'smooth' });
      } else if (val === 'down' || Number.isFinite(amount)) {
        window.scrollBy({ top: Number.isFinite(amount) ? amount : window.innerHeight * 0.8, behavior: 'smooth' });
      } else {
        window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
      return { success: true, message: 'Scrolled' };
    }
      
    default:
      return { success: false, message: 'Unknown action type' };
  }
}

// Expose to window for Rocker to use
if (typeof window !== 'undefined') {
  (window as any).__rockerDOMAgent = {
    click: clickElement,
    fill: fillField,
    submit: submitForm,
    read: readPageContent,
    getButtons: getAvailableButtons,
    getFields: getAvailableFields,
    execute: executeDOMAction,
  };
}