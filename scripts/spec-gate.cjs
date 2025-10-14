#!/usr/bin/env node
/**
 * Spec Gate — CI Build Gate
 * 
 * Enforces that all files in the spec exist in the codebase.
 * Exits with non-zero code if any files are missing.
 * 
 * Usage: node scripts/spec-gate.cjs [path/to/spec.json]
 */

const fs = require('fs');
const path = require('path');

const specPath = process.argv[2] || 'specs/day1-auth-rbac-profiles.json';
const specFile = path.resolve(process.cwd(), specPath);

if (!fs.existsSync(specFile)) {
  console.error(`❌ Spec file not found: ${specPath}`);
  process.exit(1);
}

const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const missing = [];
const extra = [];

console.log(`\n🔍 Spec Gate: ${spec.spec} (v${spec.version})`);
console.log(`📋 Checking ${spec.paths.length} files...\n`);

for (const filePath of spec.paths) {
  const fullPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    missing.push(filePath);
  }
}

if (missing.length > 0) {
  console.error(`\n❌ MISSING FILES (${missing.length}):`);
  missing.forEach(f => console.error(`   - ${f}`));
  console.error(`\n💥 Build FAILED: Missing files in spec\n`);
  process.exit(1);
}

console.log(`✅ All ${spec.paths.length} files present`);
console.log(`✨ Spec gate PASSED\n`);
process.exit(0);
