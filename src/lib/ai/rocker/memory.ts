/**
 * Rocker Selector Memory
 * Learns and recalls the best selectors for UI elements per user and route
 */

import { supabase } from '@/integrations/supabase/client';

export interface SelectorMemory {
  source: 'user' | 'global';
  selector: string;
  score: number;
}

// Session cache to avoid repeated DB calls
const memoryCache = new Map<string, { data: SelectorMemory | null; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function cacheKey(route: string, target: string): string {
  return `${route}:${target}`;
}

/**
 * Get the best known selector for a target element on a route
 * Checks user memory first, then falls back to global catalog
 */
export async function getBestSelector(
  route: string, 
  targetName: string
): Promise<SelectorMemory | null> {
  const key = cacheKey(route, targetName);
  const cached = memoryCache.get(key);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  
  try {
    const { data, error } = await supabase.rpc('ai_mem_get', {
      p_route: route,
      p_target: targetName
    });
    
    if (error) {
      console.warn('[Memory] Failed to get selector:', error);
      return null;
    }
    
    const result = data?.[0] as SelectorMemory | undefined;
    
    // Cache the result
    memoryCache.set(key, {
      data: result || null,
      expiry: Date.now() + CACHE_TTL
    });
    
    return result || null;
  } catch (err) {
    console.warn('[Memory] Get selector error:', err);
    return null;
  }
}

/**
 * Store a new selector or update an existing one
 * Increases confidence score on each successful use
 */
export async function upsertSelector(
  route: string,
  targetName: string,
  selector: string,
  meta?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase.rpc('ai_mem_upsert', {
      p_route: route,
      p_target: targetName,
      p_selector: selector,
      p_meta: meta || {}
    });
    
    if (error) {
      console.warn('[Memory] Failed to upsert selector:', error);
    } else {
      // Invalidate cache
      memoryCache.delete(cacheKey(route, targetName));
      console.log(`[Memory] Saved: ${targetName} → ${selector}`);
    }
  } catch (err) {
    console.warn('[Memory] Upsert error:', err);
  }
}

/**
 * Record whether a selector worked or failed
 * Adjusts confidence score accordingly
 */
export async function markOutcome(
  route: string,
  targetName: string,
  success: boolean
): Promise<void> {
  try {
    const { error } = await supabase.rpc('ai_mem_mark', {
      p_route: route,
      p_target: targetName,
      p_success: success
    });
    
    if (error) {
      console.warn('[Memory] Failed to mark outcome:', error);
    } else {
      // Invalidate cache
      memoryCache.delete(cacheKey(route, targetName));
      console.log(`[Memory] Marked ${success ? 'success' : 'failure'}: ${targetName}`);
      
      // Try to promote if successful
      if (success) {
        await promoteIfStrong(route, targetName);
      }
    }
  } catch (err) {
    console.warn('[Memory] Mark outcome error:', err);
  }
}

/**
 * Promote a user selector to global catalog if it's strong enough
 */
async function promoteIfStrong(route: string, targetName: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('ai_mem_promote', {
      p_route: route,
      p_target: targetName
    });
    
    if (error) {
      console.warn('[Memory] Failed to promote:', error);
    }
  } catch (err) {
    console.warn('[Memory] Promote error:', err);
  }
}

/**
 * Clear the in-memory cache (e.g., on route change)
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}

/**
 * Generate a stable, reusable selector for an element
 * Prefers: id > data-rocker > aria-label > class path
 */
export function stableSelector(el: HTMLElement): string {
  // Prefer ID
  if (el.id) {
    return `#${el.id}`;
  }
  
  // Prefer data-rocker
  const rocker = el.getAttribute('data-rocker');
  if (rocker) {
    return `[data-rocker="${rocker}"]`;
  }
  
  // Try aria-label
  const aria = el.getAttribute('aria-label');
  if (aria) {
    return `[aria-label="${aria}"]`;
  }
  
  // Fallback to tag + nth-of-type path
  const path: string[] = [];
  let current: Element | null = el;
  
  while (current && current !== document.body && path.length < 4) {
    const tag = current.tagName.toLowerCase();
    const parent = current.parentElement;
    
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === current!.tagName
      );
      const index = siblings.indexOf(current) + 1;
      
      if (siblings.length > 1) {
        path.unshift(`${tag}:nth-of-type(${index})`);
      } else {
        path.unshift(tag);
      }
    }
    
    current = parent;
  }
  
  return path.join(' > ');
}
