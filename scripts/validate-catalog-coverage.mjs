#!/usr/bin/env node
/**
 * CI Gate: Validate Catalog Coverage
 * Fails if discovered items > documented items
 */

import fs from 'fs/promises';

const UNDOC_FILE = 'docs/undocumented-gaps.json';
const FEATURES_FILE = 'docs/features/features.json';
const BACKFILL_FILE = 'catalog/autogen.backfill.json';

async function main() {
  console.log('🔍 Validating catalog coverage...\n');

  const gaps = JSON.parse(await fs.readFile(UNDOC_FILE, 'utf8'));
  const features = JSON.parse(await fs.readFile(FEATURES_FILE, 'utf8'));
  
  let backfill = { features: [] };
  try {
    backfill = JSON.parse(await fs.readFile(BACKFILL_FILE, 'utf8'));
  } catch {
    console.log('⚠️  No backfill file found - run catalog-backfill.mjs first');
  }

  const totalDiscovered = 
    (gaps.routes?.length || 0) + 
    (gaps.rpcs?.length || 0) + 
    (gaps.tables?.length || 0);
  
  const totalDocumented = 
    features.features.length + 
    backfill.features.length;

  console.log(`📊 Coverage Report:`);
  console.log(`   Total discovered: ${totalDiscovered}`);
  console.log(`   Manual features: ${features.features.length}`);
  console.log(`   Auto-stubs: ${backfill.features.length}`);
  console.log(`   Total documented: ${totalDocumented}`);
  console.log(`   Undocumented: ${totalDiscovered - totalDocumented}\n`);

  if (totalDiscovered > totalDocumented) {
    console.error(`❌ FAIL: ${totalDiscovered - totalDocumented} items not in catalog`);
    console.error(`\n💡 Fix: Run 'node scripts/catalog-backfill.mjs' to generate stubs`);
    process.exit(1);
  }

  console.log('✅ PASS: All discovered items are cataloged');
}

main().catch(err => {
  console.error('❌ Validation failed:', err);
  process.exit(1);
});
