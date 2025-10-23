#!/usr/bin/env -S deno run -A
// Structure Guard - ensures all critical audit files are present
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const REQUIRED_FILES = [
  "scripts/master-elon-scan.ts",
  "scripts/modules/_utils.ts",
  "scripts/modules/sync-config-from-folders.ts",
  "scripts/modules/rls-policy-audit.ts",
  "scripts/modules/deep-duplicate-scan.ts",
  "scripts/modules/cross-dependency-scan.ts",
  "scripts/modules/ghost-code-scan.ts",
  "scripts/modules/security-orbit-scan.ts",
  "scripts/modules/schema-drift-scan.ts",
  "scripts/modules/performance-fingerprint.ts",
  "scripts/modules/document-dedupe.ts",
  "scripts/modules/telemetry-map.ts",
];

console.log("🔍 Guard Flow: Checking critical file structure...\n");

const missing: string[] = [];
const present: string[] = [];

for (const path of REQUIRED_FILES) {
  if (!(await exists(path))) {
    missing.push(path);
    console.error(`❌ MISSING: ${path}`);
  } else {
    present.push(path);
    console.log(`✅ ${path}`);
  }
}

console.log(`\n${"=".repeat(80)}`);
console.log(`Present: ${present.length}/${REQUIRED_FILES.length}`);
console.log(`Missing: ${missing.length}/${REQUIRED_FILES.length}`);

if (missing.length > 0) {
  console.error(`\n❌ STRUCTURE GUARD FAILED`);
  console.error(`   ${missing.length} critical file(s) missing`);
  console.error(`   Cannot proceed - architectural integrity compromised`);
  console.log(`${"=".repeat(80)}\n`);
  Deno.exit(1);
} else {
  console.log(`\n✅ STRUCTURE GUARD PASSED`);
  console.log(`   All ${REQUIRED_FILES.length} core files verified`);
  console.log(`   Architecture integrity intact`);
  console.log(`${"=".repeat(80)}\n`);
  Deno.exit(0);
}
