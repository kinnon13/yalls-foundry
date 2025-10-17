/**
 * Dev HUD Hook
 * Manage Dev HUD visibility with URL param and keyboard shortcut
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useDevHUD() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(() => searchParams.get('dev') === '1');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D or Cmd+Shift+D
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsOpen(prev => {
          const next = !prev;
          if (next) {
            setSearchParams({ dev: '1' });
          } else {
            setSearchParams({});
          }
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchParams]);

  // Sync with URL param
  useEffect(() => {
    const devParam = searchParams.get('dev');
    if (devParam === '1' && !isOpen) {
      setIsOpen(true);
    } else if (devParam !== '1' && isOpen) {
      setIsOpen(false);
    }
  }, [searchParams, isOpen]);

  const close = () => {
    setIsOpen(false);
    setSearchParams({});
  };

  return { isOpen, close };
}
