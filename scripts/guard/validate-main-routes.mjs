#!/usr/bin/env node
/**
 * CI Gate: Validate Main Routes Cap
 * Ensures only 10 main routes using collapsedHeads from config
 */

import fs from 'fs/promises';

const APP_FILE = 'src/App.tsx';
const CONFIG_FILE = 'configs/area-discovery.json';

async function main() {
  console.log('🔍 Validating main routes cap (using collapsedHeads)...\n');

  // Load config to get collapsedHeads
  const configContent = await fs.readFile(CONFIG_FILE, 'utf8');
  const config = JSON.parse(configContent);
  const collapsedHeads = config.collapsedHeads || [];
  const MAX_SECTIONS = 10;

  if (collapsedHeads.length > MAX_SECTIONS) {
    console.error(`❌ FAIL: ${collapsedHeads.length} sections in collapsedHeads exceeds limit of ${MAX_SECTIONS}`);
    console.error(`\nSections found:`);
    collapsedHeads.forEach(h => console.error(`   - ${h}`));
    process.exit(1);
  }

  // Verify App.tsx routes match collapsedHeads
  const appContent = await fs.readFile(APP_FILE, 'utf8');
  const routeRegex = /<Route\s+path="([^"]+)"/g;
  const routes = new Set();
  let match;
  
  while ((match = routeRegex.exec(appContent)) !== null) {
    const route = match[1];
    // Extract head (first path segment)
    const head = '/' + route.split('/')[1];
    if (!head.includes(':') && head !== '/*' && head !== '/404' && head !== '/login' && head !== '/admin' && head !== '/preview') {
      routes.add(head);
    }
  }

  console.log(`📊 Route Analysis:`);
  console.log(`   Configured sections (collapsedHeads): ${collapsedHeads.length}/${MAX_SECTIONS}`);
  console.log(`   Unique route heads in App.tsx: ${routes.size}\n`);

  // Check coverage
  const missing = collapsedHeads.filter(h => !routes.has(h) && !['/feed', '/cart'].includes(h)); // feed/cart may be subpaths
  const extra = Array.from(routes).filter(r => !collapsedHeads.includes(r));

  if (missing.length > 0) {
    console.warn(`⚠️  Warning: collapsedHeads not wired in App.tsx: ${missing.join(', ')}`);
  }

  if (extra.length > 0) {
    console.warn(`⚠️  Warning: Routes in App.tsx not in collapsedHeads: ${extra.join(', ')}`);
  }

  console.log('✅ PASS: Sections within 10-head cap');
  console.log('\nConfigured sections:');
  collapsedHeads.forEach(h => console.log(`   ✓ ${h}`));
}

main().catch(err => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});
