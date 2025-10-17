/**
 * Rocker Mode Hook
 * Production-grade mode state (actor role, UI visibility)
 */

import { useState, useCallback } from 'react';
import type { AIRole } from '../types';

export function useRockerMode() {
  const [actorRole, setActorRole] = useState<AIRole>('user');
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    actorRole,
    setActorRole,
    isOpen,
    setIsOpen,
    toggleOpen,
  };
}
