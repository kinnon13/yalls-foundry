#!/usr/bin/env tsx
// Emits generated/feature-backfill.json with auto-created feature entries
// Never overwrites manual status in docs/features/features.json

import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

type FeatureStatus = 'shell' | 'full-ui' | 'wired';
type Feature = {
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
  severity: 'p0' | 'p1' | 'p2';
  notes: string;
};

const BASE = 'docs/features/features.json';
const OVERLAY = 'docs/features/features-complete.json';
const OUT_DIR = 'generated';
const OUT = path.join(OUT_DIR, 'feature-backfill.json');

const FEATURE_TAG = /@feature\(([^)]+)\)/g;
const FLAG_TAG = /@flag\(([^)]+)\)/g;

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return null;
  }
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function toRoute(file: string): string {
  // Convert file path -> route path for React Router
  // e.g. src/routes/orders/[id].tsx -> /orders/:id
  const rel = file
    .replace(/^src\/routes/, '')
    .replace(/\/index\.tsx?$/, '')
    .replace(/\.tsx?$/, '');
  
  return rel
    .replace(/\[(\w+)\]/g, ':$1')
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    || '/';
}

function titleize(id: string) {
  return id.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function guessArea(route: string, file: string): string {
  // Area inference rules (order matters - most specific first)
  if (file.includes('/admin/')) return 'admin';
  if (file.includes('/crm')) return 'business';
  if (file.includes('/kpi') || file.includes('/analytics') || file.includes('/metrics')) return 'business';
  if (file.includes('/campaign') || file.includes('/marketing')) return 'business';
  if (file.includes('/accounting') || file.includes('/financials')) return 'business';
  if (file.includes('/dashboard')) return 'business';
  if (file.includes('/producer') || file.includes('/business')) return 'business';
  if (file.includes('/marketplace') || file.includes('/listing')) return 'marketplace';
  if (file.includes('/orders') || file.includes('/checkout') || file.includes('/cart')) return 'orders';
  if (file.includes('/payment') || file.includes('/billing')) return 'payments';
  if (file.includes('/search') || file.includes('/discover')) return 'search';
  if (file.includes('/message') || file.includes('/chat')) return 'messaging';
  if (file.includes('/farm')) return 'farm';
  if (file.includes('/shipping') || file.includes('/logistic')) return 'shipping';
  if (file.includes('/profile')) return 'profile';
  if (file.includes('/event')) return 'events';
  if (file.includes('/composer')) return 'composer';
  if (file.includes('/notification')) return 'notifications';
  if (file.includes('/earning')) return 'earnings';
  if (file.includes('/ai')) return 'ai';
  if (file.includes('/setting')) return 'settings';
  
  // Fallback to route-based inference
  const parts = (route || '').split('/').filter(Boolean);
  if (parts[0]) return parts[0];
  
  // Fallback to component folder
  const m = file.match(/^src\/components\/([^/]+)/);
  return m ? m[1] : 'platform';
}

function normalizeId(raw: string) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_:.-]/g, '_');
}

function deriveFeatureIdFromPath(p: string) {
  // e.g. src/routes/marketplace/listing/[id].tsx -> marketplace_listing
  const rel = p.replace(/^src\//, '').replace(/\.[tj]sx?$/, '');
  const parts = rel.split('/').filter(Boolean);
  const area = guessArea('', p);
  const name = parts[parts.length - 1]?.replace(/\[|\]/g, '') || parts[parts.length - 2] || 'index';
  return normalizeId(`${area}_${name}`);
}

async function main() {
  console.log('\n🔧 Starting feature backfill...\n');
  
  // Load existing manual features
  const baseData = readJson<{ features: Feature[] }>(BASE);
  const overlayData = readJson<{ features: Feature[] }>(OVERLAY);
  const base = baseData?.features ?? [];
  const overlay = overlayData?.features ?? [];
  const manual = new Map(base.concat(overlay).map(f => [f.id, f]));
  
  console.log(`   Manual features: ${manual.size}`);

  // Scan codebase
  const routeFiles = await glob(['src/routes/**/*.{ts,tsx}'], { ignore: ['**/__tests__/**', '**/*.test.*', '**/*.spec.*'] });
  const compFiles = await glob(['src/components/**/*.{ts,tsx}'], { 
    ignore: ['**/__tests__/**', '**/*.test.*', '**/*.spec.*', '**/ui/**'] 
  });
  const testFiles = await glob(['tests/**/*.{ts,tsx}'], {});
  
  console.log(`   Routes: ${routeFiles.length}`);
  console.log(`   Components: ${compFiles.length} (excluding ui/)`);
  console.log(`   Tests: ${testFiles.length}\n`);

  // Collect discovered features
  const discovered = new Map<string, Feature>();

  function upsert(id: string, updater: (f: Feature) => void, seed?: Partial<Feature>) {
    const ex = discovered.get(id) || {
      id,
      title: titleize(id),
      area: 'platform',
      status: 'shell' as FeatureStatus,
      routes: [],
      components: [],
      rpc: [],
      flags: [],
      docs: '',
      tests: { unit: [], e2e: [] },
      owner: 'web',
      severity: 'p2' as const,
      notes: 'Auto-generated placeholder - needs review',
      ...seed,
    };
    updater(ex);
    discovered.set(id, ex);
  }

  function scanFileForFeatureIds(file: string, content: string): string[] {
    const ids = new Set<string>();
    for (const m of content.matchAll(FEATURE_TAG)) {
      ids.add(normalizeId(m[1]));
    }
    if (ids.size === 0) {
      ids.add(deriveFeatureIdFromPath(file));
    }
    return [...ids];
  }

  function scanFileForFlags(content: string): string[] {
    const ids = new Set<string>();
    for (const m of content.matchAll(FLAG_TAG)) {
      ids.add(normalizeId(m[1]));
    }
    return [...ids];
  }

  // Process routes
  for (const file of routeFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const route = toRoute(file);
    const flags = scanFileForFlags(content);
    const featureIds = scanFileForFeatureIds(file, content);
    
    for (const id of featureIds) {
      upsert(id, f => {
        f.routes = Array.from(new Set([...f.routes, route])).sort();
        f.flags = Array.from(new Set([...f.flags, ...flags])).sort();
        f.area = guessArea(route, file);
      });
    }
  }

  // Process components
  for (const file of compFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const featureIds = scanFileForFeatureIds(file, content);
    
    for (const id of featureIds) {
      upsert(id, f => {
        f.components = Array.from(new Set([...f.components, file])).sort();
        if (f.area === 'platform') f.area = guessArea('', file);
      });
    }
  }

  // Process tests
  for (const file of testFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const tagged = scanFileForFeatureIds(file, content);
    const isE2E = /\/e2e\//.test(file);
    const ids = tagged.length ? tagged : [deriveFeatureIdFromPath(file)];
    
    for (const id of ids) {
      upsert(id, f => {
        if (isE2E) {
          f.tests.e2e = Array.from(new Set([...f.tests.e2e, file])).sort();
        } else {
          f.tests.unit = Array.from(new Set([...f.tests.unit, file])).sort();
        }
      });
    }
  }

  // Remove anything already defined manually to avoid duplicates
  for (const id of manual.keys()) {
    discovered.delete(id);
  }

  // Calculate area breakdown
  const byArea: Record<string, number> = {};
  for (const f of discovered.values()) {
    byArea[f.area] = (byArea[f.area] ?? 0) + 1;
  }
  
  // Emit generated features
  ensureDir(OUT_DIR);
  const payload = {
    features: Array.from(discovered.values()).sort((a, b) => a.id.localeCompare(b.id)),
    metadata: {
      generated: new Date().toISOString(),
      source: 'backfill',
      version: '1.0.0',
      counts: {
        total: discovered.size,
        routes: routeFiles.length,
        components: compFiles.length,
        tests: testFiles.length,
        byArea
      }
    }
  };
  
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');

  console.log(`✅ Backfill complete!`);
  console.log(`   Generated features: ${payload.features.length}`);
  console.log(`   Manual features (excluded): ${manual.size}`);
  console.log(`   Total unique features: ${payload.features.length + manual.size}`);
  console.log(`\n📊 By area:`);
  
  const sorted = Object.entries(byArea).sort((a, b) => b[1] - a[1]);
  for (const [area, count] of sorted.slice(0, 15)) {
    console.log(`   ${area.padEnd(15)} ${count}`);
  }
  
  console.log(`\n   Output: ${OUT}`);
  console.log(`\n💡 Next: Refresh /admin/features to see all ${payload.features.length + manual.size} features\n`);
}

main().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
