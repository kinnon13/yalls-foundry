/**
 * Rocker Feature Handler
 * 
 * Handles Rocker CTAs for opening and managing features
 */

import type { FeatureProps } from './types';

export interface OpenFeaturesParams {
  features: string[];
  props?: Record<string, FeatureProps>;
}

export function openFeaturesViaURL(params: OpenFeaturesParams) {
  const url = new URL(window.location.href);
  const sp = new URLSearchParams(url.search);
  
  // Get current features
  const currentFeatures = (sp.get('f') ?? '').split(',').filter(Boolean);
  
  // Merge with new features (avoid duplicates)
  const allFeatures = [...new Set([...currentFeatures, ...params.features])];
  sp.set('f', allFeatures.join(','));
  
  // Set feature props
  if (params.props) {
    for (const [featureId, featureProps] of Object.entries(params.props)) {
      for (const [key, value] of Object.entries(featureProps)) {
        sp.set(
          `fx.${featureId}.${key}`,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      }
    }
  }
  
  // Navigate
  const newUrl = `/dashboard?${sp.toString()}`;
  window.history.pushState({}, '', newUrl);
  
  // Trigger re-render
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/**
 * Register Rocker CTA handler for ui_open_features
 * 
 * Usage in Rocker CTAs:
 * {
 *   rpc: 'ui_open_features',
 *   params: {
 *     features: ['approvals', 'calendar'],
 *     props: {
 *       approvals: { entity: 'ent_123', filter: 'pending' },
 *       calendar: { view: 'public', range: '7d' }
 *     }
 *   }
 * }
 */
export function registerRockerFeatureHandler() {
  if (typeof window === 'undefined') return;
  
  // @ts-ignore - attaching to window for Rocker to call
  window.__rockerFeatureHandler = openFeaturesViaURL;
}
