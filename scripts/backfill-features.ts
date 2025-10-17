// scripts/backfill-features.ts
// Auto-create placeholder features for untagged routes/components
import fs from 'fs';

const FEATURES = 'docs/features/features.json';
const ROUTE_MANIFEST = 'generated/route-manifest.json';
const COMPONENT_REGISTRY = 'generated/component-registry.json';

type Feature = {
  id: string;
  area: string;
  title: string;
  status: 'shell' | 'full-ui' | 'wired';
  routes: string[];
  components: string[];
  tests: { unit: string[]; e2e: string[] };
  owner?: string;
  severity?: 'p0' | 'p1' | 'p2';
  docs?: string;
  notes?: string;
};

// Load existing data
let fjson: any = { features: [] };
let rmanifest: any = { routes: [] };
let creg: any = { components: [] };

try {
  fjson = JSON.parse(fs.readFileSync(FEATURES, 'utf8'));
} catch {
  console.warn('⚠️  features.json not found, creating new');
}

try {
  rmanifest = JSON.parse(fs.readFileSync(ROUTE_MANIFEST, 'utf8'));
} catch {
  console.error('❌ route-manifest.json not found. Run npm run map:routes first');
  process.exit(1);
}

try {
  creg = JSON.parse(fs.readFileSync(COMPONENT_REGISTRY, 'utf8'));
} catch {
  console.warn('⚠️  component-registry.json not found');
}

const features: Feature[] = fjson.features ?? [];
const byId = new Map(features.map(f => [f.id, f]));

const routes = (rmanifest.routes ?? []) as { path: string; file: string; features?: string[] }[];
const components = (creg.components ?? []) as { path: string; features?: string[] }[];

// Area inference rules (order matters - first match wins)
const AREA_RULES: { test: (s: string) => boolean; area: string }[] = [
  { test: p => p.includes('/admin/'), area: 'admin' },
  { test: p => p.includes('/marketplace') || p.includes('/listings'), area: 'marketplace' },
  { test: p => p.includes('/orders') || p.includes('/checkout') || p.includes('/cart'), area: 'orders' },
  { test: p => p.includes('/payments') || p.includes('/billing'), area: 'payments' },
  { test: p => p.includes('/search') || p.includes('/discover'), area: 'search' },
  { test: p => p.includes('/messages') || p.includes('/chat'), area: 'messaging' },
  { test: p => p.includes('/farm'), area: 'farm' },
  { test: p => p.includes('/shipping') || p.includes('/logistics'), area: 'shipping' },
  { test: p => p.includes('/producer') || p.includes('/business') || p.includes('/dashboard'), area: 'business' },
  { test: p => p.includes('/profile'), area: 'profile' },
  { test: p => p.includes('/events'), area: 'events' },
  { test: p => p.includes('/composer'), area: 'composer' },
  { test: p => p.includes('/notifications'), area: 'notifications' },
  { test: p => p.includes('/earnings'), area: 'earnings' },
  { test: p => p.includes('/ai'), area: 'ai' },
  { test: p => p.includes('/settings'), area: 'settings' },
  { test: _ => true, area: 'platform' }, // fallback
];

const slug = (s: string) => s.replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
const inferArea = (path: string) => (AREA_RULES.find(r => r.test(path))?.area) ?? 'platform';

const titleFromRoute = (path: string) => {
  const parts = path.split('/').filter(p => p && !p.startsWith(':') && !p.startsWith('['));
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')).join(' ') || path;
};

const titleFromComponent = (path: string) => {
  const name = path.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || path;
  return name.replace(/([A-Z])/g, ' $1').trim();
};

const idFromRoute = (path: string) => {
  const area = inferArea(path);
  const pathSlug = slug(path).replace(/^_/, '').replace(/_index$/, '').replace(/_id$/, '_detail');
  return `${area}_${pathSlug}`;
};

const idFromComponent = (path: string) => {
  const area = inferArea(path);
  const componentSlug = slug(path.replace(/^src\/components\//, '').replace(/\.(tsx?|jsx?)$/, ''));
  return `${area}_${componentSlug}`;
};

let created = 0;
let updated = 0;

// Backfill routes
for (const r of routes) {
  if (r.features && r.features.length) continue; // Already tagged
  
  const id = idFromRoute(r.path);
  if (!byId.has(id)) {
    byId.set(id, {
      id,
      area: inferArea(r.path),
      title: titleFromRoute(r.path),
      status: 'shell',
      routes: [r.path],
      components: [],
      tests: { unit: [], e2e: [] },
      owner: 'web',
      severity: 'p2',
      docs: '',
      notes: 'Auto-generated placeholder - needs @feature tag'
    });
    created++;
  } else {
    const f = byId.get(id)!;
    if (!f.routes.includes(r.path)) {
      f.routes.push(r.path);
      updated++;
    }
  }
}

// Backfill components
for (const c of components) {
  if (c.features && c.features.length) continue; // Already tagged
  
  const id = idFromComponent(c.path);
  if (!byId.has(id)) {
    byId.set(id, {
      id,
      area: inferArea(c.path),
      title: titleFromComponent(c.path),
      status: 'shell',
      routes: [],
      components: [c.path],
      tests: { unit: [], e2e: [] },
      owner: 'web',
      severity: 'p2',
      docs: '',
      notes: 'Auto-generated placeholder - needs @feature tag'
    });
    created++;
  } else {
    const f = byId.get(id)!;
    if (!f.components.includes(c.path)) {
      f.components.push(c.path);
      updated++;
    }
  }
}

// Write output to generated/ (non-destructive)
const outputDir = 'generated';
const outputFile = `${outputDir}/feature-backfill.json`;

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const out = {
  "$schema": "../docs/features/features-schema.json",
  "version": "1.0.0",
  "lastUpdated": new Date().toISOString().split('T')[0],
  "source": "backfill",
  features: Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id))
};

// Create backup of existing backfill
if (fs.existsSync(outputFile)) {
  const backup = outputFile.replace('.json', `.backup-${Date.now()}.json`);
  fs.copyFileSync(outputFile, backup);
  console.log(`📦 Backup created: ${backup}`);
}

fs.writeFileSync(outputFile, JSON.stringify(out, null, 2) + '\n');

console.log('\n✅ Backfill complete!');
console.log(`   - New features: ${created}`);
console.log(`   - Updated features: ${updated}`);
console.log(`   - Total features: ${out.features.length}`);
console.log(`   - Output: ${outputFile}`);
console.log('\n💡 Next steps:');
console.log('   1. Refresh the app - kernel auto-loads from generated/');
console.log('   2. Add @feature(...) tags to files with placeholder entries');
console.log('   3. View placeholders at /admin/features with "Show Placeholders" filter\n');
