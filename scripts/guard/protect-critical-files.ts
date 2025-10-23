#!/usr/bin/env -S deno run -A
/**
 * 🛡️ Critical File Protection Guardrail
 * Verifies that Super Andy's brain and mission control scripts are intact
 */

import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../lib/logger.ts";
import { green, red } from "../lib/colors.ts";

header("PROTECT CRITICAL FILES");

const PROTECTED_PATHS = [
  // Andy's Brain
  "scripts/ai/",
  "scripts/ai/mission-director.ts",
  "scripts/ai/mission-tracker.ts",
  "scripts/ai/mission-self-test.ts",
  "scripts/ai/verify-rocker-integrity.ts",
  "scripts/ai/auto-fix.ts",
  
  // Guard Layer
  "scripts/guard/",
  "scripts/guard/verify-structure.ts",
  "scripts/guard/verify-supabase-config.ts",
  "scripts/guard/verify-modules.ts",
  "scripts/guard/verify-mission-integrity.ts",
  "scripts/guard/protect-critical-files.ts",
  
  // Audit Layer
  "scripts/audit/",
  "scripts/audit/audit-functions.ts",
  "scripts/audit/sync-supabase-config.ts",
  "scripts/audit/compile-reports.ts",
  "scripts/audit/merge-reports.ts",
  "scripts/audit/verify-edge-functions.ts",
  
  // Core Orchestrator
  "scripts/master-elon-scan.ts",
  
  // Shared Utilities
  "scripts/lib/",
  "scripts/lib/logger.ts",
  "scripts/lib/utils.ts",
  "scripts/lib/colors.ts",
  "scripts/lib/file-hash.ts"
];

let missing = 0;

console.log("🛡️  Verifying protected files...\n");

for (const p of PROTECTED_PATHS) {
  try {
    await Deno.stat(p);
    console.log(green(`✅ Protected: ${p}`));
  } catch {
    console.log(red(`❌ CRITICAL: Missing ${p}`));
    missing++;
  }
}

line();

if (missing === 0) {
  console.log(green("\n✅ ALL CRITICAL FILES PROTECTED\n"));
  console.log("🛡️  Super Andy's core systems are intact\n");
  Deno.exit(0);
} else {
  console.log(red(`\n❌ ${missing} CRITICAL FILE(S) MISSING\n`));
  console.log("🚨 Super Andy's core systems compromised!\n");
  console.log("Action required:");
  console.log("  1. Restore missing files from git");
  console.log("  2. Run: git checkout HEAD -- scripts/");
  console.log("  3. Verify: deno run -A scripts/guard/protect-critical-files.ts\n");
  Deno.exit(1);
}