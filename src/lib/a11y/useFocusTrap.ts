/**
 * Focus Trap Hook
 * Traps keyboard focus within a modal/dialog for accessibility
 * Implements ARIA best practices for modal dialogs
 */

import { useEffect, useRef } from 'react';

export function useFocusTrap<T extends HTMLElement>(enabled = true) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;
    
    const root = ref.current;
    const selectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');

    const getNodes = () => 
      Array.from(root.querySelectorAll<HTMLElement>(selectors))
        .filter(n => !n.hasAttribute('aria-hidden'));

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      const nodes = getNodes();
      if (nodes.length === 0) return;
      
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        // Shift+Tab: wrap from first to last
        if (active === first || !root.contains(active)) {
          last.focus();
          e.preventDefault();
        }
      } else {
        // Tab: wrap from last to first
        if (active === last || !root.contains(active)) {
          first.focus();
          e.preventDefault();
        }
      }
    };

    root.addEventListener('keydown', onKeyDown);
    
    // Auto-focus first element
    const nodes = getNodes();
    if (nodes[0]) nodes[0].focus();
    
    return () => root.removeEventListener('keydown', onKeyDown);
  }, [enabled]);

  return ref;
}
