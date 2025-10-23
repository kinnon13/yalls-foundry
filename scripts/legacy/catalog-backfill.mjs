#!/usr/bin/env node
/**
 * Auto-Stub Backfill Script
 * Generates stub catalog entries for all undocumented routes/RPCs/tables
 * Zeros out the "undocumented" counter
 */

import fs from 'fs/promises';
import path from 'path';

const UNDOC_FILE = 'docs/undocumented-gaps.json';
const OUTPUT_FILE = 'catalog/autogen.backfill.json';
const AREA_CONFIG = 'configs/area-discovery.json';

// Area inference rules
const AREA_PATTERNS = {
  dashboard: ['/workspace', '/producer', '/dashboard', '/crm', '/orders', '/programs', '/listings', '/farm', '/growth'],
  discovery: ['/search', '/discover', '/feed', '/people', '/horses'],
  events: ['/events', '/entrant', '/entries', '/draws', '/results'],
  equinestats: ['/equinestats', '/earnings', '/performance', '/pedigree'],
  admin: ['/admin', '/control-room', '/features', '/audit'],
  ai: ['/ai', '/rocker', '/nba'],
  platform: ['/login', '/signup', '/auth', '/cart', '/checkout', '/messages'],
  profile: ['/profile', '/entities', '/claim']
};

const RPC_PATTERNS = {
  dashboard: ['workspace_', 'producer_', 'crm_', 'order_', 'listing_', 'farm_'],
  discovery: ['search_', 'discover_', 'feed_', 'post_'],
  events: ['event_', 'entry_', 'draw_', 'result_', 'payout_'],
  equinestats: ['earnings_', 'performance_', 'stats_', 'pedigree_'],
  admin: ['admin_', 'audit_', 'claim_'],
  ai: ['ai_', 'rocker_', 'nba_'],
  platform: ['auth_', 'cart_', 'checkout_', 'dm_', 'notification_'],
  profile: ['entity_', 'profile_', 'favorite_', 'repost_']
};

const TABLE_PATTERNS = {
  dashboard: ['businesses', 'crm_', 'orders', 'listings', 'farm_', 'boarders', 'affiliates'],
  discovery: ['posts', 'feed_', 'follows'],
  events: ['events', 'event_', 'entries', 'draws', 'results', 'payouts'],
  equinestats: ['earnings', 'performance_', 'stats_', 'horse_'],
  admin: ['admin_', 'audit_', 'entity_claims'],
  ai: ['ai_', 'rocker_', 'nba_'],
  platform: ['profiles', 'messages', 'notifications', 'shopping_carts', 'idempotency_keys'],
  profile: ['entities', 'entity_', 'favorites', 'reposts']
};

function inferArea(item, type) {
  const patterns = type === 'routes' ? AREA_PATTERNS : 
                  type === 'rpcs' ? RPC_PATTERNS : TABLE_PATTERNS;
  
  for (const [area, pats] of Object.entries(patterns)) {
    if (pats.some(p => item.toLowerCase().includes(p.toLowerCase()))) {
      return area;
    }
  }
  return 'platform'; // default
}

function generateStubId(area, item, type) {
  const cleaned = item
    .replace(/^\//, '')
    .replace(/\/:[^/]+/g, '') // Remove :id params
    .replace(/\//g, '_')
    .replace(/_+$/, '')
    .toLowerCase();
  return `stub.${area}.${cleaned || type}`;
}

async function main() {
  console.log('🔄 Loading undocumented gaps...');
  const gaps = JSON.parse(await fs.readFile(UNDOC_FILE, 'utf8'));
  const areaConfig = JSON.parse(await fs.readFile(AREA_CONFIG, 'utf8'));
  
  const stubs = [];
  let idCounter = 0;

  // Process routes
  for (const route of gaps.routes || []) {
    const area = inferArea(route, 'routes');
    const id = generateStubId(area, route, 'route') + `_${idCounter++}`;
    stubs.push({
      id,
      area,
      title: route.split('/').filter(Boolean).map(s => 
        s.startsWith(':') ? s.slice(1) : s
      ).join(' ').replace(/\b\w/g, l => l.toUpperCase()),
      status: 'stub',
      routes: [route],
      components: [],
      rpc: [],
      tables: [],
      flags: [id.replace('stub.', '')],
      docs: '',
      tests: { unit: [], e2e: [] },
      owner: 'TBD',
      severity: 'p2',
      notes: 'Auto-generated stub - needs owner assignment',
      visibility: areaConfig.routeCategories?.[route.split('/')[1]] || 'private',
      flag: 'off'
    });
  }

  // Process RPCs
  for (const rpc of gaps.rpcs || []) {
    const area = inferArea(rpc, 'rpcs');
    const id = generateStubId(area, rpc, 'rpc') + `_${idCounter++}`;
    stubs.push({
      id,
      area,
      title: rpc.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      status: 'stub',
      routes: [],
      components: [],
      rpc: [rpc],
      tables: [],
      flags: [id.replace('stub.', '')],
      docs: '',
      tests: { unit: [], e2e: [] },
      owner: 'TBD',
      severity: 'p2',
      notes: 'Auto-generated stub - needs owner assignment',
      visibility: 'private',
      flag: 'off'
    });
  }

  // Process tables
  for (const table of gaps.tables || []) {
    const area = inferArea(table, 'tables');
    const id = generateStubId(area, table, 'table') + `_${idCounter++}`;
    stubs.push({
      id,
      area,
      title: table.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
      status: 'stub',
      routes: [],
      components: [],
      rpc: [],
      tables: [table],
      flags: [id.replace('stub.', '')],
      docs: '',
      tests: { unit: [], e2e: [] },
      owner: 'TBD',
      severity: 'p2',
      notes: 'Auto-generated stub - needs owner assignment',
      visibility: 'private',
      flag: 'off'
    });
  }

  // Output
  const output = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    note: 'Auto-generated stubs - all flags default to OFF',
    features: stubs
  };

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));

  console.log(`✅ Generated ${stubs.length} stubs:`);
  console.log(`   - Routes: ${gaps.routes?.length || 0}`);
  console.log(`   - RPCs: ${gaps.rpcs?.length || 0}`);
  console.log(`   - Tables: ${gaps.tables?.length || 0}`);
  console.log(`📄 Saved to: ${OUTPUT_FILE}`);
  console.log('\n💡 Next: Merge into area-discovery.json and update scanner');
}

main().catch(err => {
  console.error('❌ Backfill failed:', err);
  process.exit(1);
});
