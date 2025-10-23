#!/usr/bin/env -S deno run -A
// Structure verification - ensures all critical audit files are present
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

console.log("🔍 Verifying audit system structure...\n");

let missing = 0;
for (const path of REQUIRED_FILES) {
  if (!(await exists(path))) {
    console.error(`❌ Missing: ${path}`);
    missing++;
  } else {
    console.log(`✅ ${path}`);
  }
}

console.log(`\n${"=".repeat(80)}`);
if (missing > 0) {
  console.error(`❌ STRUCTURE INVALID: ${missing} required file(s) missing`);
  console.error("   Cannot run audit system safely");
  Deno.exit(1);
} else {
  console.log("✅ Structure verified. All ${REQUIRED_FILES.length} core audit files present.");
  console.log("   Safe to run: deno run -A scripts/master-elon-scan.ts");
}
console.log(`${"=".repeat(80)}\n`);
