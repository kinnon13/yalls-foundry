import { useMemo } from 'react';
import areaConfig from '../../configs/area-discovery.json';

export interface Area {
  raw: string;
  canonical: string;
  subareas: string[];
  description: string;
}

export interface AreaDiscoveryConfig {
  version: string;
  lastUpdated: string;
  areas: Area[];
  routeAliases: Record<string, string>;
  collapsedHeads: string[];
  routeCategories: Record<string, string>;
  featureFlags: Record<string, any>;
  kpiDefinitions: Record<string, any>;
  themeDefaults: Record<string, any>;
  nbaConfig: Record<string, any>;
  growthConfig?: Record<string, any>;
  rockerLearning?: Record<string, any>;
  kpiFloConfig?: Record<string, any>;
  meta: Record<string, any>;
}

/**
 * Hook to access the area discovery configuration
 * Memoized for performance
 */
export function useAreaDiscovery(): AreaDiscoveryConfig {
  return useMemo(() => areaConfig as AreaDiscoveryConfig, []);
}

/**
 * Resolve the canonical area for a given route path
 * @param path - The route path to resolve
 * @returns The canonical area or null if not found
 */
export function useAreaForRoute(path: string): Area | null {
  const config = useAreaDiscovery();
  
  return useMemo(() => {
    // Remove query params and hash
    const cleanPath = path.split('?')[0].split('#')[0];
    
    // Check if path matches any area routes
    for (const area of config.areas) {
      // Match against canonical name
      if (cleanPath.startsWith(`/${area.canonical}`)) {
        return area;
      }
      
      // Match against raw name
      if (cleanPath.startsWith(`/${area.raw}`)) {
        return area;
      }
      
      // Match against subareas
      for (const subarea of area.subareas) {
        if (cleanPath.includes(`/${subarea}`)) {
          return area;
        }
      }
    }
    
    // Check collapsed heads
    for (const head of config.collapsedHeads) {
      if (cleanPath.startsWith(head)) {
        // Find matching area
        const matchingArea = config.areas.find(a => 
          cleanPath.includes(a.canonical) || 
          cleanPath.includes(a.raw) ||
          a.subareas.some(sub => cleanPath.includes(sub))
        );
        if (matchingArea) return matchingArea;
      }
    }
    
    return null;
  }, [path, config]);
}

/**
 * Resolve the subarea for a given route path
 * @param path - The route path to resolve
 * @returns The subarea string or null if not found
 */
export function useSubareaForRoute(path: string): string | null {
  const area = useAreaForRoute(path);
  
  return useMemo(() => {
    if (!area) return null;
    
    // Remove query params and hash
    const cleanPath = path.split('?')[0].split('#')[0];
    
    // Check each subarea
    for (const subarea of area.subareas) {
      if (cleanPath.includes(`/${subarea}`)) {
        return subarea;
      }
    }
    
    // If no specific subarea found, return first one as default
    return area.subareas[0] || null;
  }, [path, area]);
}

/**
 * Check if a route should be collapsed in navigation
 * @param path - The route path to check
 * @returns True if the route should be collapsed
 */
export function useIsCollapsedRoute(path: string): boolean {
  const config = useAreaDiscovery();
  
  return useMemo(() => {
    const cleanPath = path.split('?')[0].split('#')[0];
    return config.collapsedHeads.some(head => cleanPath.startsWith(head));
  }, [path, config]);
}

/**
 * Get the route category (public, private, workspace, dashboard)
 * @param path - The route path to check
 * @returns The category string or null
 */
export function useRouteCategory(path: string): string | null {
  const config = useAreaDiscovery();
  
  return useMemo(() => {
    const cleanPath = path.split('?')[0].split('#')[0];
    
    // Check exact match first
    if (config.routeCategories[cleanPath]) {
      return config.routeCategories[cleanPath];
    }
    
    // Check prefix match
    for (const [route, category] of Object.entries(config.routeCategories)) {
      if (cleanPath.startsWith(route)) {
        return category;
      }
    }
    
    return null;
  }, [path, config]);
}

/**
 * Resolve route aliases
 * @param path - The original path
 * @returns The resolved path (or original if no alias found)
 */
export function useResolvedRoute(path: string): string {
  const config = useAreaDiscovery();
  
  return useMemo(() => {
    const cleanPath = path.split('?')[0].split('#')[0];
    
    // Check exact match
    if (config.routeAliases[cleanPath]) {
      return config.routeAliases[cleanPath];
    }
    
    // Check wildcard match
    for (const [alias, target] of Object.entries(config.routeAliases)) {
      if (alias.endsWith('/*')) {
        const prefix = alias.slice(0, -2);
        if (cleanPath.startsWith(prefix)) {
          const suffix = cleanPath.slice(prefix.length);
          return target.replace('/*', suffix);
        }
      }
    }
    
    return path;
  }, [path, config]);
}
