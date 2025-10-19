/**
 * useDesignLock Hook
 * 
 * React hook for design lock PIN system
 */

import { useState, useCallback, useEffect } from 'react';
import { 
  isDesignLocked, 
  unlockDesign, 
  lockDesign, 
  getDesignLockState,
  attemptAction 
} from '@/lib/design-lock/pin-system';
import type { DesignLockAction } from '@/lib/design-lock/types';

export function useDesignLock() {
  const [locked, setLocked] = useState(isDesignLocked);
  
  // Check lock state on mount and set up interval
  useEffect(() => {
    const checkLock = () => {
      setLocked(isDesignLocked());
    };
    
    checkLock();
    const interval = setInterval(checkLock, 5000);  // Check every 5s
    
    return () => clearInterval(interval);
  }, []);
  
  const unlock = useCallback((pin: string): boolean => {
    const success = unlockDesign(pin);
    setLocked(!success);
    return success;
  }, []);
  
  const lock = useCallback(() => {
    lockDesign();
    setLocked(true);
  }, []);
  
  const tryAction = useCallback((action: DesignLockAction): boolean => {
    try {
      attemptAction(action);
      return true;
    } catch {
      return false;
    }
  }, []);
  
  return {
    locked,
    unlock,
    lock,
    tryAction,
    isLocked: locked,
  };
}
