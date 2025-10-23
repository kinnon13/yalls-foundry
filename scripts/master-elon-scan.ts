#!/usr/bin/env -S deno run -A
// Master Elon-Class Audit Orchestrator v11.5
// Drives all modular audits and writes full summary

import { join } from "https://deno.land/std@0.223.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const FIX = Deno.args.includes("--fix");
const MODULE_DIR = "scripts/modules";
const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

const MODULES = [
  "sync-config-from-folders.ts",
  "rls-policy-audit.ts",
  "deep-duplicate-scan.ts",
  "cross-dependency-scan.ts",
  "ghost-code-scan.ts",
  "security-orbit-scan.ts",
  "schema-drift-scan.ts",
  "performance-fingerprint.ts",
  "document-dedupe.ts",
  "telemetry-map.ts",
];

console.log(`\n🚀 Elon-Class Master Scan ${FIX ? "(AUTO-FIX MODE)" : "(SCAN-ONLY)"}\n`);
console.log(`Running ${MODULES.length} independent audit modules...\n`);

const summary: Record<string, any> = {};
let failures = 0;

for (const mod of MODULES) {
  const path = join(MODULE_DIR, mod);
  console.log(`▶ ${mod}`);
  
  const p = new Deno.Command("deno", {
    args: ["run", "-A", path, ...(FIX ? ["--fix"] : [])],
  }).spawn();
  
  const { code, stdout, stderr } = await p.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  
  summary[mod] = {
    ok: code === 0,
    timestamp: new Date().toISOString(),
    out,
    err,
  };
  
  if (code === 0) {
    console.log(`✅ ${mod} completed`);
  } else {
    console.log(`❌ ${mod} FAILED`);
    failures++;
  }
  console.log(out);
  if (err) console.error(err);
  console.log("");
}

// Write master summary
const summaryPath = join(AUDIT_DIR, "master-summary.json");
await Deno.writeTextFile(summaryPath, JSON.stringify({
  timestamp: new Date().toISOString(),
  mode: FIX ? "fix" : "scan",
  totalModules: MODULES.length,
  failures,
  modules: summary
}, null, 2));

console.log(`\n${"=".repeat(80)}`);
console.log(`💾 Full summary → ${summaryPath}`);
console.log(`✅ ${MODULES.length - failures}/${MODULES.length} modules succeeded`);
if (failures > 0) console.log(`❌ ${failures} module(s) failed`);
console.log(`${FIX ? "🛠️  Auto-fixes applied" : "ℹ️  Run with --fix to apply fixes"}`);
console.log(`${"=".repeat(80)}\n`);

Deno.exit(failures > 0 ? 1 : 0);
