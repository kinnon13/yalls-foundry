/**
 * Object Utilities
 * 
 * Common object manipulation helpers.
 * 
 * Usage:
 *   import { omit, pick } from '@/lib/utils/objects';
 */

/**
 * Omit keys from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

/**
 * Pick keys from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  ...keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  
  const source = sources.shift();
  if (!source) return target;
  
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (isObject(sourceValue) && isObject(targetValue)) {
      target[key] = deepMerge({ ...targetValue }, sourceValue);
    } else if (sourceValue !== undefined) {
      target[key] = sourceValue as any;
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * Check if value is plain object
 */
function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Group array by key
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const group = String(item[key]);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}