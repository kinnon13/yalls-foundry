import { useState, useEffect } from 'react';

/**
 * Debounced value hook - delays value updates
 * @param value - Value to debounce
 * @param delay - Delay in ms (default 350ms)
 */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
