/**
 * Feature Kernel Loader
 * Handles async loading and merging of feature datasets
 */

import type { Feature } from './feature-kernel';
import featuresDoc from '../../docs/features/features.json';

interface FeaturesFile {
  features?: Feature[];
}

const loadedFeatures = (Array.isArray(featuresDoc) 
  ? featuresDoc 
  : (featuresDoc as FeaturesFile).features || []
) as Feature[];

// Try to load complete dataset
let completeFeatures: Feature[] = loadedFeatures;

// Dynamic import of complete dataset (build-time optimization)
try {
  const completeModule = await import('../../docs/features/features-complete.json');
  const completeDoc = completeModule.default || completeModule;
  const completeList = (Array.isArray(completeDoc)
    ? completeDoc
    : (completeDoc as FeaturesFile).features || []
  ) as Feature[];
  
  if (completeList.length > 0) {
    // Deep merge: prefer completeList, combine arrays
    const map = new Map<string, Feature>();
    for (const f of loadedFeatures) map.set(f.id, f);
    for (const f of completeList) {
      if (map.has(f.id)) {
        const existing = map.get(f.id)!;
        map.set(f.id, {
          ...existing,
          ...f,
          routes: Array.from(new Set([...existing.routes, ...f.routes])),
          components: Array.from(new Set([...existing.components, ...f.components])),
          rpc: Array.from(new Set([...existing.rpc, ...f.rpc])),
          flags: Array.from(new Set([...existing.flags, ...f.flags])),
          tests: {
            unit: Array.from(new Set([...existing.tests.unit, ...f.tests.unit])),
            e2e: Array.from(new Set([...existing.tests.e2e, ...f.tests.e2e]))
          }
        });
      } else {
        map.set(f.id, f);
      }
    }
    completeFeatures = Array.from(map.values());
  }
} catch (err) {
  // If complete file doesn't exist or fails to load, use loaded features
  console.info('[Feature Kernel] Using base features.json only');
}

// Sort by ID
completeFeatures.sort((a, b) => a.id.localeCompare(b.id));

export const mergedFeatures = completeFeatures;
