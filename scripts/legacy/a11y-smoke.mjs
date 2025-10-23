#!/usr/bin/env node
/**
 * A11y Smoke Tests
 * Runs axe-core checks on critical pages
 */

import { spawnSync } from 'node:child_process';

const urls = [
  'http://localhost:4173/',
  'http://localhost:4173/super-andy',
  'http://localhost:4173/?app=yallbrary'
];

console.log('🔍 Running accessibility smoke tests...\n');

for (const url of urls) {
  console.log(`Testing: ${url}`);
  const r = spawnSync('npx', ['axe', url, '--exit', '--tags', 'wcag2a,wcag2aa'], { 
    stdio: 'inherit',
    shell: true 
  });
  
  if (r.status !== 0) {
    console.error(`\n❌ Accessibility violations found at ${url}`);
    process.exit(r.status);
  }
  console.log(`✅ ${url} passed\n`);
}

console.log('✅ All accessibility smoke tests passed!');
