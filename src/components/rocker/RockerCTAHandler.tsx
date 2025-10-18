/**
 * Rocker CTA Handler
 * 
 * Handles CTA actions from Rocker NBA cards
 */

export function handleRockerCTA(cta: { rpc: string; params?: any }): 'success' | 'error' {
  let result: 'success' | 'error' = 'success';

  try {
    if (cta.rpc === 'ui_open_features') {
      // Call the registered feature handler
      if (typeof window !== 'undefined' && (window as any).__rockerFeatureHandler) {
        (window as any).__rockerFeatureHandler(cta.params);
      } else {
        result = 'error';
      }
    } else {
      result = 'error';
    }
  } catch (err) {
    result = 'error';
  }

  return result;
}
