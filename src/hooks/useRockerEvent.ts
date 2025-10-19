/**
 * useRockerEvent Hook
 * 
 * React hook for emitting Rocker AI events
 */

import { useCallback } from 'react';
import { rocker } from '@/lib/rocker/event-bus';
import { isDemo } from '@/lib/env';
import type { RockerEvent } from '@/lib/rocker/event-bus';

export function useRockerEvent() {
  const emit = useCallback((
    name: string, 
    data?: Partial<Omit<RockerEvent, 'name' | 'timestamp'>>
  ) => {
    rocker.emit(name, {
      ...data,
      demo: isDemo(),
    });
  }, []);
  
  return { emit };
}
