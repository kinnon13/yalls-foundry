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
  type: 'click' | 'fill' | 'submit' | 'read';
  selector?: string;
  value?: string;
  targetName?: string; // e.g., "post button", "comment field"
}

/**
 * Find element by various strategies
 */
export function findElement(targetName: string): HTMLElement | null {
  const normalized = targetName.toLowerCase().trim();
  
  // Try data-rocker attributes first (explicit markers)
  let el = document.querySelector(`[data-rocker="${normalized}"]`) as HTMLElement;
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
  
  // Try by input name/id
  el = document.querySelector(`input[name*="${normalized}" i], input[id*="${normalized}" i]`) as HTMLElement;
  if (el) return el;
  
  // Try by textarea
  el = document.querySelector(`textarea[name*="${normalized}" i], textarea[placeholder*="${normalized}" i]`) as HTMLElement;
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
  
  // Scroll into view and click immediately to avoid race with subsequent actions
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  try {
    (el as HTMLElement).click();
  } catch (e) {
    console.warn('[DOM Agent] Click error:', e);
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
    // Try to find submit button instead
    const submitBtn = document.querySelector('button[type="submit"], button:has-text("Submit")') as HTMLButtonElement;
    if (submitBtn) {
      submitBtn.click();
      return { success: true, message: 'Clicked submit button' };
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