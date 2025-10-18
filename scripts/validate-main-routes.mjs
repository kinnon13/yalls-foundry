#!/usr/bin/env node
/**
 * CI Gate: Validate Main Routes Cap
 * Ensures only 10 main routes are registered (excludes sub-routes, admin, preview)
 */

import fs from 'fs/promises';
import path from 'path';

const APP_FILE = 'src/App.tsx';
const MAX_MAIN_ROUTES = 10;

// Routes that don't count toward the cap
const EXCLUDED_PATTERNS = [
  /^\/admin\//,
  /^\/preview\//,
  /\/:\w+/, // Params like /:id
  /^\/health$/,
  /^\/404$/,
  /^\/login$/,
  /^\/\*$/  // Catch-all
];

function isMainRoute(route) {
  return !EXCLUDED_PATTERNS.some(pat => pat.test(route));
}

async function main() {
  console.log('🔍 Validating main routes cap...\n');

  const appContent = await fs.readFile(APP_FILE, 'utf8');
  
  // Extract Route components
  const routeRegex = /<Route\s+path="([^"]+)"/g;
  const routes = [];
  let match;
  
  while ((match = routeRegex.exec(appContent)) !== null) {
    routes.push(match[1]);
  }

  const mainRoutes = routes.filter(isMainRoute);
  
  console.log(`📊 Route Analysis:`);
  console.log(`   Total routes: ${routes.length}`);
  console.log(`   Main routes: ${mainRoutes.length}/${MAX_MAIN_ROUTES}`);
  console.log(`   Admin/system: ${routes.length - mainRoutes.length}\n`);

  if (mainRoutes.length > MAX_MAIN_ROUTES) {
    console.error(`❌ FAIL: ${mainRoutes.length} main routes exceeds cap of ${MAX_MAIN_ROUTES}`);
    console.error(`\nMain routes found:`);
    mainRoutes.forEach(r => console.error(`   - ${r}`));
    console.error(`\n💡 Fix: Move routes to query params or consolidate under /dashboard`);
    process.exit(1);
  }

  console.log('✅ PASS: Main routes within cap');
  console.log('\nMain routes:');
  mainRoutes.forEach(r => console.log(`   ✓ ${r}`));
}

main().catch(err => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});
