/**
 * Automation Bus - Role-aware UI automation system
 * 
 * Allows User Rocker, Admin Rocker, and Super Andy to:
 * - Open overlays
 * - Fill form fields
 * - Click buttons
 * - Focus elements
 * 
 * All commands are checked against the capability matrix
 */

import { Capabilities, Role, hasCapability } from '@/security/capabilities';
import { OVERLAY_REGISTRY } from '@/lib/overlay/registry';

export type BusCommand =
  | { type: 'openApp'; app: string; params?: Record<string, string> }
  | { type: 'fill'; selector: string; value: string }
  | { type: 'click'; selector: string }
  | { type: 'focus'; selector: string };

export interface BusEvent {
  command: BusCommand;
  role: Role;
  timestamp: number;
  allowed: boolean;
  reason?: string;
}

const channel = new BroadcastChannel('app-automation-bus');

/**
 * Get current user role (replace with actual auth context)
 */
function getCurrentRole(): Role {
  // In production, get from auth context
  const stored = localStorage.getItem('devRole') as Role | null;
  return stored || 'user';
}

/**
 * Check if a command is allowed for the current role
 */
function isCommandAllowed(cmd: BusCommand, role: Role): { allowed: boolean; reason?: string } {
  const caps = Capabilities[role];
  
  switch (cmd.type) {
    case 'openApp':
      if (!caps.bus.openApp.includes(cmd.app)) {
        return { allowed: false, reason: `Role ${role} cannot access app: ${cmd.app}` };
      }
      break;
    case 'fill':
      if (!caps.bus.fill) {
        return { allowed: false, reason: `Role ${role} cannot fill fields` };
      }
      break;
    case 'click':
    case 'focus':
      if (!caps.bus.click) {
        return { allowed: false, reason: `Role ${role} cannot click/focus` };
      }
      break;
  }
  
  return { allowed: true };
}

/**
 * Send a command to the automation bus
 */
export function sendCommand(cmd: BusCommand) {
  const role = getCurrentRole();
  const check = isCommandAllowed(cmd, role);
  
  const event: BusEvent = {
    command: cmd,
    role,
    timestamp: Date.now(),
    allowed: check.allowed,
    reason: check.reason,
  };
  
  if (!check.allowed) {
    console.warn('[Bus] Command blocked:', event);
    window.dispatchEvent(new CustomEvent('bus:blocked', { detail: event }));
    return;
  }
  
  channel.postMessage(event);
  window.dispatchEvent(new CustomEvent('bus:sent', { detail: event }));
}

/**
 * Execute a bus command (internal handler)
 */
async function executeCommand(cmd: BusCommand) {
  switch (cmd.type) {
    case 'openApp': {
      const entry = OVERLAY_REGISTRY[cmd.app as any];
      if (!entry) {
        console.warn('[Bus] Unknown app:', cmd.app);
        return;
      }
      
      // Build URL with params
      const url = new URL(window.location.href);
      url.searchParams.set('app', cmd.app);
      if (cmd.params) {
        Object.entries(cmd.params).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }
      
      // Navigate
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new Event('popstate'));
      break;
    }
    
    case 'fill': {
      const el = document.querySelector(cmd.selector) as HTMLInputElement | HTMLTextAreaElement | null;
      if (!el) {
        console.warn('[Bus] Element not found:', cmd.selector);
        return;
      }
      
      el.focus();
      el.value = cmd.value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      break;
    }
    
    case 'click': {
      const el = document.querySelector(cmd.selector) as HTMLElement | null;
      if (!el) {
        console.warn('[Bus] Element not found:', cmd.selector);
        return;
      }
      el.click();
      break;
    }
    
    case 'focus': {
      const el = document.querySelector(cmd.selector) as HTMLElement | null;
      if (!el) {
        console.warn('[Bus] Element not found:', cmd.selector);
        return;
      }
      el.focus();
      break;
    }
  }
}

/**
 * Register automation bus handlers
 * Call this once on app startup
 */
export function registerAutomationHandlers() {
  channel.onmessage = async (e: MessageEvent<BusEvent>) => {
    const event = e.data;
    
    // Double-check permission (defensive)
    const role = getCurrentRole();
    if (event.role !== role) {
      console.warn('[Bus] Role mismatch in event:', event.role, 'vs', role);
      return;
    }
    
    if (!event.allowed) {
      console.warn('[Bus] Blocked command in event:', event);
      return;
    }
    
    // Execute
    try {
      await executeCommand(event.command);
      window.dispatchEvent(new CustomEvent('bus:executed', { detail: event }));
    } catch (error) {
      console.error('[Bus] Execution error:', error);
      window.dispatchEvent(new CustomEvent('bus:error', { 
        detail: { event, error: String(error) } 
      }));
    }
  };
  
  console.log('[Bus] Automation handlers registered');
}

/**
 * Helper: Open an app overlay
 */
export function openApp(app: string, params?: Record<string, string>) {
  sendCommand({ type: 'openApp', app, params });
}

/**
 * Helper: Fill a form field
 */
export function fillField(selector: string, value: string) {
  sendCommand({ type: 'fill', selector, value });
}

/**
 * Helper: Click an element
 */
export function clickElement(selector: string) {
  sendCommand({ type: 'click', selector });
}

/**
 * Helper: Focus an element
 */
export function focusElement(selector: string) {
  sendCommand({ type: 'focus', selector });
}
