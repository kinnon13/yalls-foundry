#!/usr/bin/env node
/* Usage:
 * node scripts/spec-gate.cjs
 * node scripts/spec-gate.cjs specs/day1-auth-rbac-profiles.json
 */
const fs = require('fs');
const path = require('path');

const specArg = process.argv[2] || 'specs/day1-auth-rbac-profiles.json';
const specPath = path.resolve(process.cwd(), specArg);

if (!fs.existsSync(specPath)) {
  console.error(`❌ Spec file not found: ${specPath}`);
  process.exit(2);
}

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const expected = Array.isArray(spec.paths) ? spec.paths : spec;

function exists(fp) {
  try { return fs.existsSync(path.resolve(process.cwd(), fp)); } catch { return false; }
}

const missing = expected.filter(p => !exists(p));

if (missing.length) {
  console.error(`\n❌ MISSING FILES (${missing.length}):`);
  missing.forEach(f => console.error(` - ${f}`));
  console.error(`\n💥 Build FAILED: Missing files in spec\n`);
  process.exit(1);
}

console.log(`✅ All ${expected.length} files present`);
console.log(`✨ Spec gate PASSED\n`);
