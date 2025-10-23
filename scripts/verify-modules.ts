#!/usr/bin/env -S deno run -A
// Module Integrity Guard - ensures audit modules haven't been merged or deleted
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const MODULES_DIR = "scripts/modules";
const EXPECTED_MODULES = [
  "_utils.ts",
  "sync-config-from-folders.ts",
  "rls-policy-audit.ts",
  "deep-duplicate-scan.ts",
  "cross-dependency-scan.ts",
  "ghost-code-scan.ts",
  "security-orbit-scan.ts",
  "schema-drift-scan.ts",
  "performance-fingerprint.ts",
  "document-dedupe.ts",
  "telemetry-map.ts"
];

console.log("🔍 Guard Flow: Checking module integrity...\n");

if (!(await exists(MODULES_DIR))) {
  console.error("❌ CRITICAL: modules directory not found");
  Deno.exit(1);
}

const foundModules: string[] = [];
for await (const entry of walk(MODULES_DIR, { maxDepth: 1, exts: [".ts"], includeDirs: false })) {
  const name = entry.name;
  foundModules.push(name);
}

const missing = EXPECTED_MODULES.filter(m => !foundModules.includes(m));
const unexpected = foundModules.filter(m => !EXPECTED_MODULES.includes(m));

console.log(`Expected modules: ${EXPECTED_MODULES.length}`);
console.log(`Found modules: ${foundModules.length}`);
console.log(`Missing: ${missing.length}`);
console.log(`Unexpected: ${unexpected.length}`);

if (missing.length > 0) {
  console.log(`\n⚠️  Missing modules:`);
  missing.forEach(m => console.log(`   - ${m}`));
}

if (unexpected.length > 0) {
  console.log(`\n⚠️  Unexpected files in modules/:`);
  unexpected.forEach(m => console.log(`   - ${m}`));
}

// Check for suspiciously large files (possible merge)
console.log(`\n📦 Module sizes:`);
for (const mod of foundModules) {
  const stat = await Deno.stat(`${MODULES_DIR}/${mod}`);
  const kb = Math.round(stat.size / 1024);
  const flag = kb > 50 ? "⚠️ " : "  ";
  console.log(`${flag} ${mod.padEnd(35)} ${kb}KB`);
  
  if (kb > 50 && mod !== "_utils.ts") {
    console.error(`\n❌ WARNING: ${mod} is ${kb}KB (possible merge/bloat)`);
  }
}

console.log(`\n${"=".repeat(80)}`);

if (missing.length > 0) {
  console.error(`\n❌ MODULE INTEGRITY GUARD FAILED`);
  console.error(`   ${missing.length} module(s) missing - possible deletion`);
  console.log(`${"=".repeat(80)}\n`);
  Deno.exit(1);
} else if (foundModules.length < EXPECTED_MODULES.length) {
  console.error(`\n❌ MODULE INTEGRITY GUARD FAILED`);
  console.error(`   Module count mismatch - possible merge or consolidation`);
  console.log(`${"=".repeat(80)}\n`);
  Deno.exit(1);
} else {
  console.log(`\n✅ MODULE INTEGRITY GUARD PASSED`);
  console.log(`   All ${EXPECTED_MODULES.length} modules intact and independent`);
  console.log(`${"=".repeat(80)}\n`);
  Deno.exit(0);
}
