/**
 * React hook for automation bus integration
 * 
 * Usage:
 * ```tsx
 * const { openApp, fillField, clickElement, isAllowed } = useAutomationBus();
 * 
 * // Open Yallbrary
 * openApp('yallbrary', { search: 'bridles' });
 * 
 * // Fill a form
 * fillField('[data-testid="search-input"]', 'horse tack');
 * 
 * // Click button
 * clickElement('[data-testid="search-btn"]');
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { 
  openApp, 
  fillField, 
  clickElement, 
  focusElement,
  registerAutomationHandlers,
  type BusEvent 
} from '@/automation/bus';
import { hasCapability, type Role } from '@/security/capabilities';

export function useAutomationBus() {
  const [lastEvent, setLastEvent] = useState<BusEvent | null>(null);
  const [role, setRole] = useState<Role>('user');

  useEffect(() => {
    // Get current role
    const storedRole = localStorage.getItem('devRole') as Role | null;
    if (storedRole) setRole(storedRole);

    // Register handlers on mount
    registerAutomationHandlers();

    // Listen for bus events
    const handleSent = (e: Event) => {
      const event = (e as CustomEvent<BusEvent>).detail;
      setLastEvent(event);
    };

    const handleBlocked = (e: Event) => {
      const event = (e as CustomEvent<BusEvent>).detail;
      setLastEvent(event);
      console.warn('[Bus] Command blocked:', event);
    };

    window.addEventListener('bus:sent', handleSent);
    window.addEventListener('bus:blocked', handleBlocked);

    return () => {
      window.removeEventListener('bus:sent', handleSent);
      window.removeEventListener('bus:blocked', handleBlocked);
    };
  }, []);

  const isAllowed = useCallback((category: 'bus' | 'api', capability: string) => {
    return hasCapability(role, category, capability);
  }, [role]);

  return {
    openApp,
    fillField,
    clickElement,
    focusElement,
    isAllowed,
    lastEvent,
    role,
  };
}
