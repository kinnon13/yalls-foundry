#!/usr/bin/env tsx
/**
 * Feature Open CLI
 * Usage: npm run feature:open <feature_id>
 * Prints all files, routes, tests, docs for a feature
 */

import fs from 'fs';

interface Feature {
  id: string;
  title: string;
  routes: string[];
  components: string[];
  rpc: string[];
  docs: string;
  tests: {
    unit: string[];
    e2e: string[];
  };
}

const FEATURES_JSON = 'docs/features/features.json';

function main() {
  const featureId = process.argv[2];

  if (!featureId) {
    console.error('Usage: npm run feature:open <feature_id>');
    process.exit(1);
  }

  if (!fs.existsSync(FEATURES_JSON)) {
    console.error(`❌ ${FEATURES_JSON} not found`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(FEATURES_JSON, 'utf-8'));
  const feature: Feature | undefined = data.features.find((f: Feature) => f.id === featureId);

  if (!feature) {
    console.error(`❌ Feature "${featureId}" not found`);
    console.log('\nAvailable features:');
    data.features.forEach((f: Feature) => console.log(`  - ${f.id} (${f.title})`));
    process.exit(1);
  }

  console.log(`\n📦 Feature: ${feature.title} (${feature.id})\n`);

  if (feature.routes.length > 0) {
    console.log('🛣️  Routes:');
    feature.routes.forEach(r => console.log(`   ${r}`));
    console.log('');
  }

  if (feature.components.length > 0) {
    console.log('🧩 Components:');
    feature.components.forEach(c => console.log(`   ${c}`));
    console.log('');
  }

  if (feature.rpc.length > 0) {
    console.log('⚙️  RPC Functions:');
    feature.rpc.forEach(r => console.log(`   ${r}`));
    console.log('');
  }

  if (feature.tests.e2e.length > 0 || feature.tests.unit.length > 0) {
    console.log('🧪 Tests:');
    if (feature.tests.e2e.length > 0) {
      console.log('   E2E:');
      feature.tests.e2e.forEach(t => console.log(`     ${t}`));
    }
    if (feature.tests.unit.length > 0) {
      console.log('   Unit:');
      feature.tests.unit.forEach(t => console.log(`     ${t}`));
    }
    console.log('');
  }

  if (feature.docs) {
    console.log(`📄 Docs: ${feature.docs}\n`);
  }
}

main();
