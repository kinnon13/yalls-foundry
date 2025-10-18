// scripts/feature-audit.ts
// Audit: what you have vs what's missing
import fs from 'fs';

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
};

// Load manifests
const featuresPath = 'docs/features/features.json';
const routeManifestPath = 'generated/route-manifest.json';
const componentRegistryPath = 'generated/component-registry.json';

let fjson: any = { features: [] };
let rmanifest: any = { routes: [] };
let creg: any = { components: [] };

try {
  fjson = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
} catch {
  console.warn('⚠️  features.json not found, using empty set');
}

try {
  rmanifest = JSON.parse(fs.readFileSync(routeManifestPath, 'utf8'));
} catch {
  console.warn('⚠️  route-manifest.json not found, run npm run map:routes first');
}

try {
  creg = JSON.parse(fs.readFileSync(componentRegistryPath, 'utf8'));
} catch {
  console.warn('⚠️  component-registry.json not found, run npm run map:components first');
}

const features: Feature[] = fjson.features ?? [];
const areas = [...new Set(features.map(f => f.area))].sort();

const routes = (rmanifest.routes ?? []) as { path: string; file: string; features?: string[] }[];
const components = (creg.components ?? []) as { path: string; features?: string[]; exports: string[] }[];

const totalRoutes = routes.length;
const routesWithFeature = routes.filter(r => (r.features ?? []).length > 0).length;
const totalComponents = components.length;
const componentsWithFeature = components.filter(c => (c.features ?? []).length > 0).length;

// Items with no @feature(...)
const routesMissing = routes.filter(r => !r.features || r.features.length === 0).map(r => r.path);
const componentsMissing = components.filter(c => !c.features || c.features.length === 0).map(c => c.path);

// Area breakdown
const byArea: Record<string, number> = {};
for (const f of features) byArea[f.area] = (byArea[f.area] ?? 0) + 1;

// Status breakdown
const byStatus: Record<string, number> = { shell: 0, 'full-ui': 0, wired: 0 };
for (const f of features) byStatus[f.status] = (byStatus[f.status] ?? 0) + 1;

// Print report
console.log('\n📊 Feature Audit Report');
console.log('='.repeat(60));
console.log(`\n✅ Features documented: ${features.length}`);
console.log(`   - Shell: ${byStatus.shell}`);
console.log(`   - Full UI: ${byStatus['full-ui']}`);
console.log(`   - Wired: ${byStatus.wired}`);
console.log(`\n📦 Areas present: ${areas.length}`);
console.log(`   ${areas.join(', ')}`);

console.log(`\n🛣️  Routes: ${totalRoutes} total`);
console.log(`   - With @feature: ${routesWithFeature} (${(routesWithFeature / Math.max(1, totalRoutes) * 100).toFixed(1)}%)`);
console.log(`   - Missing tags: ${routesMissing.length} (${(routesMissing.length / Math.max(1, totalRoutes) * 100).toFixed(1)}%)`);

console.log(`\n🧩 Components: ${totalComponents} total`);
console.log(`   - With @feature: ${componentsWithFeature} (${(componentsWithFeature / Math.max(1, totalComponents) * 100).toFixed(1)}%)`);
console.log(`   - Missing tags: ${componentsMissing.length} (${(componentsMissing.length / Math.max(1, totalComponents) * 100).toFixed(1)}%)`);

console.log('\n📊 Features by area:');
for (const [area, count] of Object.entries(byArea).sort((a, b) => b[1] - a[1])) {
  console.log(`   - ${area}: ${count}`);
}

// Check for major missing areas
const expectedAreas = ['marketplace', 'business', 'search', 'orders', 'payments', 'messaging', 'farm', 'shipping', 'settings', 'platform'];
const missingAreas = expectedAreas.filter(a => !areas.includes(a));
if (missingAreas.length) {
  console.log('\n⚠️  Missing major areas:', missingAreas.join(', '));
}

// Show sample of missing items
if (routesMissing.length) {
  console.log(`\n🛣️  Sample routes without @feature (${routesMissing.length} total):`);
  console.log(routesMissing.slice(0, 25).map(p => `   - ${p}`).join('\n'));
  if (routesMissing.length > 25) {
    console.log(`   …+${routesMissing.length - 25} more`);
  }
}

if (componentsMissing.length) {
  console.log(`\n🧩 Sample components without @feature (${componentsMissing.length} total):`);
  console.log(componentsMissing.slice(0, 25).map(p => `   - ${p}`).join('\n'));
  if (componentsMissing.length > 25) {
    console.log(`   …+${componentsMissing.length - 25} more`);
  }
}

// Calculate coverage score
const routeCoverage = routesWithFeature / Math.max(1, totalRoutes) * 100;
const componentCoverage = componentsWithFeature / Math.max(1, totalComponents) * 100;
const overallCoverage = (routesWithFeature + componentsWithFeature) / Math.max(1, totalRoutes + totalComponents) * 100;

console.log('\n📈 Coverage Summary:');
console.log(`   - Route coverage: ${routeCoverage.toFixed(1)}%`);
console.log(`   - Component coverage: ${componentCoverage.toFixed(1)}%`);
console.log(`   - Overall coverage: ${overallCoverage.toFixed(1)}%`);

if (overallCoverage < 50) {
  console.log('\n⚠️  WARNING: Less than 50% of codebase is tagged with features!');
  console.log('   Run: npx tsx scripts/backfill-features.ts');
}

console.log('\n' + '='.repeat(60));
console.log('💡 Next steps:');
console.log('   1. Run: npx tsx scripts/backfill-features.ts (auto-create placeholders)');
console.log('   2. Add @feature(...) tags to untagged files');
console.log('   3. Update placeholder features with proper metadata');
console.log('');
