#!/usr/bin/env tsx
/**
 * Platform Verification Script
 * Runs all checks required for production readiness
 */

import fs from 'fs';
import { validateGoldPath, getFeatureStats, GOLD_PATH_FEATURES } from '../src/lib/featureGuards';

interface VerificationResult {
  check: string;
  passed: boolean;
  message: string;
  blocking: boolean;
}

const results: VerificationResult[] = [];

console.log('🔍 Running platform verification...\n');

// 1. Verify features.json exists and has all 87 features
const FEATURES_JSON = 'docs/features/features.json';
if (!fs.existsSync(FEATURES_JSON)) {
  results.push({
    check: 'Features JSON Exists',
    passed: false,
    message: `${FEATURES_JSON} not found`,
    blocking: true
  });
  console.error(`❌ ${FEATURES_JSON} not found`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(FEATURES_JSON, 'utf-8'));
const featureCount = data.features.length;
const expectedCount = 87;

results.push({
  check: 'Feature Count',
  passed: featureCount === expectedCount,
  message: `Found ${featureCount}/${expectedCount} features`,
  blocking: featureCount < expectedCount
});

if (featureCount < expectedCount) {
  console.error(`❌ Expected ${expectedCount} features, found ${featureCount}`);
} else {
  console.log(`✅ Feature count correct: ${featureCount}`);
}

// 2. Verify gold-path features are ready
const goldPath = validateGoldPath();
results.push({
  check: 'Gold-Path Ready',
  passed: goldPath.ready,
  message: goldPath.ready 
    ? 'All gold-path features are Full UI or Wired'
    : `${goldPath.blocking.length} gold-path features still shell: ${goldPath.blocking.join(', ')}`,
  blocking: !goldPath.ready
});

if (!goldPath.ready) {
  console.error(`❌ Gold-path not ready. Blocking features:\n${goldPath.blocking.map(id => `   - ${id}`).join('\n')}`);
} else {
  console.log(`✅ All ${GOLD_PATH_FEATURES.length} gold-path features ready`);
}

// 3. Verify no shell features have unguarded routes
const shellFeatures = data.features.filter((f: any) => f.status === 'shell');
const unguardedShells = shellFeatures.filter((f: any) => f.routes.length > 0);

results.push({
  check: 'Shell Routes Protected',
  passed: unguardedShells.length === 0,
  message: unguardedShells.length > 0
    ? `${unguardedShells.length} shell features have routes without guards`
    : 'All shell features are protected',
  blocking: false // Warning, not blocking
});

if (unguardedShells.length > 0) {
  console.warn(`⚠️  Shell features with routes (should have dev guards):\n${unguardedShells.map((f: any) => `   - ${f.id}: ${f.routes.join(', ')}`).join('\n')}`);
} else {
  console.log(`✅ No unguarded shell routes`);
}

// 4. Verify test coverage
const stats = getFeatureStats();
const withTests = data.features.filter((f: any) => f.tests.e2e.length > 0 || f.tests.unit.length > 0).length;
const coveragePct = (withTests / featureCount) * 100;

results.push({
  check: 'Test Coverage',
  passed: coveragePct >= 80,
  message: `${coveragePct.toFixed(1)}% of features have tests`,
  blocking: false
});

if (coveragePct < 80) {
  console.warn(`⚠️  Test coverage is ${coveragePct.toFixed(1)}% (target: 80%)`);
} else {
  console.log(`✅ Test coverage: ${coveragePct.toFixed(1)}%`);
}

// 5. Verify documentation coverage
const withDocs = data.features.filter((f: any) => f.docs && f.docs.length > 0).length;
const docsPct = (withDocs / featureCount) * 100;

results.push({
  check: 'Documentation Coverage',
  passed: docsPct >= 80,
  message: `${docsPct.toFixed(1)}% of features have docs`,
  blocking: false
});

if (docsPct < 80) {
  console.warn(`⚠️  Documentation coverage is ${docsPct.toFixed(1)}% (target: 80%)`);
} else {
  console.log(`✅ Documentation coverage: ${docsPct.toFixed(1)}%`);
}

// 6. Check for features missing owners
const withoutOwner = data.features.filter((f: any) => !f.owner || f.owner.length === 0);
results.push({
  check: 'Owner Assignment',
  passed: withoutOwner.length === 0,
  message: withoutOwner.length === 0 
    ? 'All features have owners'
    : `${withoutOwner.length} features missing owners`,
  blocking: false
});

if (withoutOwner.length > 0) {
  console.warn(`⚠️  Features without owners:\n${withoutOwner.map((f: any) => `   - ${f.id}`).join('\n')}`);
} else {
  console.log(`✅ All features have owners`);
}

// Summary
console.log('\n📊 Verification Summary:');
console.log(`   Total checks: ${results.length}`);
console.log(`   Passed: ${results.filter(r => r.passed).length}`);
console.log(`   Failed: ${results.filter(r => !r.passed).length}`);
console.log(`   Blocking: ${results.filter(r => !r.passed && r.blocking).length}`);

const blockingFailures = results.filter(r => !r.passed && r.blocking);
if (blockingFailures.length > 0) {
  console.error('\n❌ Platform verification FAILED');
  console.error('Blocking issues:');
  blockingFailures.forEach(r => console.error(`   - ${r.check}: ${r.message}`));
  process.exit(1);
}

const warnings = results.filter(r => !r.passed && !r.blocking);
if (warnings.length > 0) {
  console.warn('\n⚠️  Platform verification PASSED with warnings');
  warnings.forEach(r => console.warn(`   - ${r.check}: ${r.message}`));
  process.exit(0);
}

console.log('\n✅ Platform verification PASSED');
process.exit(0);
