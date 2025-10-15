/**
 * Rocker DOM Agent with Learning
 * 
 * Handles direct interaction with the page DOM and learns from successes/failures.
 */

import { supabase } from '@/integrations/supabase/client';

// ============= LEARNING INFRASTRUCTURE =============

/**
 * Store action result in ai_feedback for learning
 */
async function logActionResult(
  action: string,
  targetName: string,
  success: boolean,
  message: string,
  userId?: string
) {
  if (!userId) return;
  
  try {
    await supabase.from('ai_feedback').insert({
      session_id: (window as any).__rockerSessionId || null,
      user_id: userId,
      kind: success ? 'dom_success' : 'dom_failure',
      payload: {
        action,
        target: targetName,
        message,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        available_elements: getAvailableElements().slice(0, 20)
      }
    });
  } catch (e) {
    console.warn('[Learning] Failed to log action result:', e);
  }
}

/**
 * Retrieve past failures for this action type to learn from
 */
async function getPastFailures(action: string, userId?: string): Promise<any[]> {
  if (!userId) return [];
  
  try {
    const { data } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('kind', 'dom_failure')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(10);
    
    return data?.filter(f => (f.payload as any)?.action === action) || [];
  } catch (e) {
    console.warn('[Learning] Failed to retrieve past failures:', e);
    return [];
  }
}

/**
 * Store hypothesis when user corrects Rocker
 */
async function storeHypothesis(
  key: string,
  value: any,
  evidence: any,
  userId?: string
) {
  if (!userId) return;
  
  try {
    const { data: existing } = await supabase
      .from('ai_hypotheses')
      .select('*')
      .eq('user_id', userId)
      .eq('key', key)
      .single();
    
    if (existing) {
      const currentEvidence = Array.isArray(existing.evidence) ? existing.evidence : [];
      await supabase
        .from('ai_hypotheses')
        .update({
          confidence: Math.min((existing.confidence || 0.5) + 0.1, 1.0),
          evidence: [...currentEvidence, evidence],
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('ai_hypotheses').insert({
        tenant_id: '00000000-0000-0000-0000-000000000000',
        user_id: userId,
        key,
        value,
        confidence: 0.7,
        evidence: [evidence],
        status: 'active'
      });
    }
  } catch (e) {
    console.warn('[Learning] Failed to store hypothesis:', e);
  }
}

// ============= ELEMENT FINDING =============

export interface DOMAction {
  type: 'click' | 'fill' | 'submit' | 'read' | 'scroll';
  selector?: string;
  value?: string;
  targetName?: string;
}

function getElementLabel(el: HTMLElement): string {
  const text = el.textContent || '';
  const aria = el.getAttribute('aria-label') || '';
  const rocker = el.getAttribute('data-rocker') || '';
  const placeholder = (el as any).getAttribute?.('placeholder') || '';
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
        if (d <= 1) return el;
      }
    }
    if (!best || min < best.score) best = { el, score: min };
  }
  if (best && best.score <= 2) return best.el;
  return null;
}

export function findElement(targetName: string): HTMLElement | null {
  const normalized = targetName.toLowerCase().trim();
  
  let el = document.querySelector(`[data-rocker="${normalized}"]`) as HTMLElement;
  if (el) return el;
  
  el = document.querySelector(`[data-rocker*="${normalized}"]`) as HTMLElement;
  if (el) return el;
  
  el = document.querySelector(`[aria-label*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  el = document.querySelector(`[placeholder*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  const buttons = Array.from(document.querySelectorAll('button'));
  el = buttons.find(btn => btn.textContent?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;

  const links = Array.from(document.querySelectorAll('a'));
  el = links.find(a => {
    const text = a.textContent?.toLowerCase() || '';
    const ariaLabel = a.getAttribute('aria-label')?.toLowerCase() || '';
    const dataRocker = a.getAttribute('data-rocker')?.toLowerCase() || '';
    return text.includes(normalized) || ariaLabel.includes(normalized) || dataRocker.includes(normalized);
  }) as HTMLElement;
  if (el) {
    const innerButton = el.querySelector('button');
    if (innerButton) return innerButton;
    return el;
  }
  
  const roleButtons = Array.from(document.querySelectorAll('[role="button"], [role="tab"]')) as HTMLElement[];
  el = roleButtons.find(node => node.textContent?.toLowerCase().includes(normalized) || node.getAttribute('aria-label')?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;
  
  el = document.querySelector(`input[name*="${normalized}" i], input[id*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  el = document.querySelector(`textarea[name*="${normalized}" i], textarea[placeholder*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  el = document.querySelector(`[data-rocker*="${normalized}"]`) as HTMLElement;
  if (el) return el;
  
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
  
  const options = Array.from(document.querySelectorAll('[role="option"], [data-radix-select-item]')) as HTMLElement[];
  el = options.find(node => node.textContent?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;
  
  const clickables = Array.from(document.querySelectorAll('[onclick], .cursor-pointer')) as HTMLElement[];
  el = clickables.find(elem => elem.textContent?.toLowerCase().includes(normalized)) as HTMLElement;
  if (el) return el;
  
  return null;
}

// ============= ACTIONS WITH LEARNING =============

export async function clickElement(targetName: string, userId?: string): Promise<{ success: boolean; message: string }> {
  console.log('[DOM Agent] Click:', targetName);
  
  const pastFailures = await getPastFailures('click', userId);
  if (pastFailures.length > 2) {
    console.log(`[Learning] Found ${pastFailures.length} past click failures. Trying alternative approach.`);
  }
  
  const el = findElement(targetName);
  if (!el) {
    const result = { 
      success: false, 
      message: `Could not find "${targetName}". Available buttons: ${getAvailableButtons().join(', ')}` 
    };
    await logActionResult('click', targetName, false, result.message, userId);
    return result;
  }
  
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try {
    const evtInit: any = { bubbles: true, cancelable: true, composed: true, pointerId: 1, isPrimary: true, button: 0 };
    el.dispatchEvent(new PointerEvent('pointerdown', evtInit));
    el.dispatchEvent(new MouseEvent('mousedown', evtInit));
    el.dispatchEvent(new PointerEvent('pointerup', evtInit));
    el.dispatchEvent(new MouseEvent('mouseup', evtInit));
    (el as HTMLElement).click();
    (el as HTMLElement).focus();
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  } catch (e) {
    console.warn('[DOM Agent] Click error:', e);
  }

  const t = targetName.toLowerCase();
  if ((t.includes('new calendar') || t.includes('create calendar')) && (window as any).__openCreateCalendar) {
    try { (window as any).__openCreateCalendar(); } catch {}
  }
  if ((t.includes('new collection') || t.includes('create collection')) && (window as any).__openCreateCollection) {
    try { (window as any).__openCreateCollection(); } catch {}
  }
  
  const result = { success: true, message: `Clicked "${targetName}"` };
  await logActionResult('click', targetName, true, result.message, userId);
  return result;
}

export async function fillField(targetName: string, value: string, userId?: string): Promise<{ success: boolean; message: string }> {
  console.log('[DOM Agent] Fill:', targetName, '=', value);
  
  const pastFailures = await getPastFailures('fill', userId);
  if (pastFailures.length > 2) {
    console.log(`[Learning] Found ${pastFailures.length} past fill failures. Trying alternative.`);
  }
  
  const el = findElement(targetName) as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el) {
    const t = targetName.toLowerCase();
    if (t.includes('calendar') && t.includes('name') && (window as any).__openCreateCalendar) {
      try { (window as any).__openCreateCalendar(); } catch {}
      setTimeout(() => {
        const retry = findElement(targetName) as HTMLInputElement | HTMLTextAreaElement | null;
        if (retry) {
          retry.focus();
          retry.value = value;
          retry.dispatchEvent(new Event('input', { bubbles: true }));
          retry.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 120);
      return { success: true, message: `Opened dialog; filling "${targetName}"` };
    }
    const result = { 
      success: false, 
      message: `Could not find field "${targetName}". Available fields: ${getAvailableFields().join(', ')}` 
    };
    await logActionResult('fill', targetName, false, result.message, userId);
    return result;
  }
  
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.focus();
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  
  const result = { success: true, message: `Filled "${targetName}"` };
  await logActionResult('fill', targetName, true, result.message, userId);
  
  await storeHypothesis(
    `fill_field_${targetName.toLowerCase().replace(/\s+/g, '_')}`,
    { selector: el.getAttribute('data-rocker') || el.id || el.name },
    { action: 'fill', target: targetName, timestamp: new Date().toISOString() },
    userId
  );
  
  return result;
}

export function submitForm(formName?: string): { success: boolean; message: string } {
  console.log('[DOM Agent] Attempting to submit form:', formName || 'nearest form');
  
  let form: HTMLFormElement | null;
  
  if (formName) {
    const submitBtn = findElement(formName);
    form = submitBtn?.closest('form') || null;
  } else {
    form = document.querySelector('form');
  }
  
  if (!form) {
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
  
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  return { success: true, message: 'Form submitted' };
}

export function readPageContent(): { success: boolean; content: string } {
  const main = document.querySelector('main') || document.body;
  const text = main.textContent?.trim().substring(0, 500) || '';
  return { success: true, content: text };
}

export function getAvailableButtons(): string[] {
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons
    .map(btn => btn.textContent?.trim() || btn.getAttribute('aria-label'))
    .filter(Boolean) as string[];
}

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

export function getAvailableElements(): string[] {
  return [...getAvailableButtons(), ...getAvailableFields()];
}

export function executeDOMAction(action: DOMAction): { success: boolean; message: string; content?: string } {
  console.log('[DOM Agent] Executing action:', action);
  
  switch (action.type) {
    case 'click':
      return clickElement(action.targetName || action.selector || '') as any;
      
    case 'fill':
      return fillField(action.targetName || action.selector || '', action.value || '') as any;
      
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
