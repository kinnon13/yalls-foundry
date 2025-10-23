#!/usr/bin/env node
/**
 * Catalog Sync - Bulk stub undocumented items
 * 
 * Takes undocumented routes/RPCs/tables from the scanner and adds them
 * as "pending" stubs to the feature catalog, driving undocumented count to 0.
 * 
 * Usage:
 *   1. Visit /admin/features?debug=catalog
 *   2. Run __copyUndoc() in console
 *   3. Paste JSON into docs/undocumented-gaps.json
 *   4. Run: node scripts/catalog-sync.mjs --write
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CATALOG_PATH = path.join(ROOT, 'docs/features/features.json');
const GAPS_PATH = path.join(ROOT, 'docs/undocumented-gaps.json');
const WRITE = process.argv.includes('--write');

function load(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ${path.relative(ROOT, filePath)} not found`);
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

const catalog = load(CATALOG_PATH, { features: [] });
const gaps = load(GAPS_PATH, { routes: [], rpcs: [], tables: [] });

// Build maps of existing catalog items
const byRoute = new Map();
const byRpc = new Map();
const byTable = new Map();

function indexFeature(f) {
  (f.routes || []).forEach(r => byRoute.set(r, f.id));
  (f.rpc || []).forEach(r => byRpc.set(r, f.id));
  (f.tables || []).forEach(t => byTable.set(t, f.id));
  (f.subFeatures || []).forEach(indexFeature);
}

(catalog.features || []).forEach(indexFeature);

// Heuristics to auto-assign an area
function inferAreaFromPath(p) {
  if (p.startsWith('/workspace')) return 'business';
  if (p.startsWith('/equinestats') || p.startsWith('/equistats')) return 'equinestats';
  if (p.startsWith('/events')) return 'events';
  if (p.startsWith('/marketplace')) return 'discovery';
  if (p.startsWith('/profile')) return 'profile';
  if (p.startsWith('/admin')) return 'admin';
  if (p.startsWith('/crm')) return 'crm';
  if (p.startsWith('/farm')) return 'business';
  if (p.startsWith('/producer')) return 'business';
  if (p.startsWith('/entrant')) return 'events';
  if (p.startsWith('/stallions')) return 'equinestats';
  return 'platform';
}

function inferAreaFromName(name) {
  if (name.startsWith('ai_') || name.startsWith('rocker_')) return 'ai';
  if (name.includes('order') || name.includes('cart') || name.includes('payment')) return 'platform';
  if (name.includes('entry') || name.includes('draw') || name.includes('event')) return 'events';
  if (name.includes('equine') || name.includes('payout') || name.includes('stallion')) return 'equinestats';
  if (name.includes('crm_') || name.includes('contact')) return 'crm';
  if (name.includes('marketplace') || name.includes('listing')) return 'discovery';
  return 'platform';
}

let routesAdded = 0;
let rpcsAdded = 0;
let tablesAdded = 0;

// Process routes - group by area and create one feature per area
const routesByArea = new Map();
for (const route of (gaps.routes || [])) {
  if (byRoute.has(route)) continue; // already documented
  const area = inferAreaFromPath(route);
  if (!routesByArea.has(area)) {
    routesByArea.set(area, []);
  }
  routesByArea.get(area).push(route);
}

for (const [area, routes] of routesByArea) {
  const featureId = `${area}_undocumented`;
  const existing = catalog.features.find(f => f.id === featureId);
  
  if (existing) {
    // Add routes to existing feature
    existing.routes = [...new Set([...(existing.routes || []), ...routes])].sort();
    routesAdded += routes.length;
  } else {
    // Create new stub feature
    catalog.features.push({
      id: featureId,
      title: `${area.charAt(0).toUpperCase() + area.slice(1)} (Auto-Stubbed)`,
      area,
      status: 'pending',
      routes: routes.sort(),
      components: [],
      rpc: [],
      tables: [],
      notes: 'Auto-generated stub from catalog-sync. Fill in components, RPCs, and tables.'
    });
    routesAdded += routes.length;
  }
}

// Process RPCs - add to area-specific features or create new ones
const rpcsByArea = new Map();
for (const rpc of (gaps.rpcs || [])) {
  if (byRpc.has(rpc)) continue; // already documented
  const area = inferAreaFromName(rpc);
  if (!rpcsByArea.has(area)) {
    rpcsByArea.set(area, []);
  }
  rpcsByArea.get(area).push(rpc);
}

for (const [area, rpcs] of rpcsByArea) {
  const featureId = `${area}_undocumented`;
  const existing = catalog.features.find(f => f.id === featureId);
  
  if (existing) {
    existing.rpc = [...new Set([...(existing.rpc || []), ...rpcs])].sort();
    rpcsAdded += rpcs.length;
  } else {
    catalog.features.push({
      id: featureId,
      title: `${area.charAt(0).toUpperCase() + area.slice(1)} (Auto-Stubbed)`,
      area,
      status: 'pending',
      routes: [],
      components: [],
      rpc: rpcs.sort(),
      tables: [],
      notes: 'Auto-generated stub from catalog-sync. Fill in routes, components, and tables.'
    });
    rpcsAdded += rpcs.length;
  }
}

// Process Tables - add to area-specific features or create new ones
const tablesByArea = new Map();
for (const table of (gaps.tables || [])) {
  if (byTable.has(table)) continue; // already documented
  const area = inferAreaFromName(table);
  if (!tablesByArea.has(area)) {
    tablesByArea.set(area, []);
  }
  tablesByArea.get(area).push(table);
}

for (const [area, tables] of tablesByArea) {
  const featureId = `${area}_undocumented`;
  const existing = catalog.features.find(f => f.id === featureId);
  
  if (existing) {
    existing.tables = [...new Set([...(existing.tables || []), ...tables])].sort();
    tablesAdded += tables.length;
  } else {
    catalog.features.push({
      id: featureId,
      title: `${area.charAt(0).toUpperCase() + area.slice(1)} (Auto-Stubbed)`,
      area,
      status: 'pending',
      routes: [],
      components: [],
      rpc: [],
      tables: tables.sort(),
      notes: 'Auto-generated stub from catalog-sync. Fill in routes, components, and RPCs.'
    });
    tablesAdded += tables.length;
  }
}

// Sort features by area for stability
catalog.features.sort((a, b) => {
  const aArea = a.area || '';
  const bArea = b.area || '';
  if (aArea !== bArea) return aArea.localeCompare(bArea);
  return (a.title || '').localeCompare(b.title || '');
});

const totalAdded = routesAdded + rpcsAdded + tablesAdded;

if (totalAdded === 0) {
  console.log('✅ Catalog is up to date! No undocumented items found.');
  process.exit(0);
}

console.log('\n📊 Summary:');
console.log(`  Routes:  ${routesAdded} added`);
console.log(`  RPCs:    ${rpcsAdded} added`);
console.log(`  Tables:  ${tablesAdded} added`);
console.log(`  Total:   ${totalAdded} items stubbed\n`);

if (WRITE) {
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n');
  console.log(`✅ Catalog updated: ${path.relative(ROOT, CATALOG_PATH)}`);
  console.log('   All undocumented items are now cataloged as "pending"');
  console.log('\n   Next steps:');
  console.log('   1. Review the new features in features.json');
  console.log('   2. Fill in missing components and details');
  console.log('   3. Update status from "pending" to "shell", "full-ui", or "wired"');
} else {
  console.log('ℹ️  Dry run. Use --write to persist changes.');
  console.log(`   Run: node scripts/catalog-sync.mjs --write`);
}
