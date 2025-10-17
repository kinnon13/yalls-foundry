// Unified features dataset loader
// Merges base features.json with optional features-complete.json

import base from '../../docs/features/features.json';
import complete from '../../docs/features/features-complete.json';

export type FeatureStatus = 'shell' | 'full-ui' | 'wired' | string;

export interface Feature {
  id: string;
  area: string;
  title: string;
  status: FeatureStatus;
  routes: string[];
  components: string[];
  rpc: string[];
  flags: string[];
  docs: string;
  tests: { unit: string[]; e2e: string[] };
  owner: string;
  severity: string;
  notes: string;
  parentFeature?: string;
  subFeatures?: string[];
}

interface FeaturesFile { features: Feature[] }

const baseList: Feature[] = (base as FeaturesFile).features || [];
const extraList: Feature[] = (complete as FeaturesFile)?.features || [];

// Merge, prefer extraList entries on id collision
const map = new Map<string, Feature>();
for (const f of baseList) map.set(f.id, f);
for (const f of extraList) map.set(f.id, f);

export const features: Feature[] = Array.from(map.values());

export function getById(id: string): Feature | undefined {
  return features.find(f => f.id === id);
}

export const stats = {
  total: features.length,
};
