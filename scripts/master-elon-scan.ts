#!/usr/bin/env -S deno run -A
// Master Elon-Class Scan v11 (with Auto-Fix fanout)
// Runs all modules; passes --fix to each if provided.

import { join } from "https://deno.land/std@0.223.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const FIX = Deno.args.includes("--fix");
const MODULE_DIR = "scripts/modules";
const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

const MODULES = [
  "deep-duplicate-scan.ts",     // feature families + routers (auto-fix add routers)
  "cross-dependency-scan.ts",   // cross-category calls + bridges (auto-fix add bridges)
  "ghost-code-scan.ts",         // stubs/empties (auto-fix remove/quarantine)
  "security-orbit-scan.ts",     // secrets (auto-fix redact/quarantine)
  "schema-drift-scan.ts",       // migration drift (report only)
  "rls-policy-audit.ts",        // verify_jwt + public flags (auto-fix config.toml)
  "performance-fingerprint.ts", // large files (report only)
  "document-dedupe.ts",         // duplicate docs (auto-fix dedupe/move)
  "telemetry-map.ts",           // log density map (report only)
  "sync-config-from-folders.ts" // ensure every function has a config entry (auto-fix add)
];

console.log(`\n🚀 Master Scan v11 starting… ${FIX ? "(AUTO-FIX ENABLED)" : "(SCAN ONLY)"}\n`);

const results: Record<string, any> = {};
for (const mod of MODULES) {
  const path = join(MODULE_DIR, mod);
  console.log(`▶ ${mod}`);
  const p = new Deno.Command("deno", { args: ["run", "-A", path, ...(FIX ? ["--fix"] : [])] }).spawn();
  const { code, stdout, stderr } = await p.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  results[mod] = { ok: code === 0, out, err };
  console.log(code === 0 ? `✅ ${mod} done` : `❌ ${mod} failed`);
}

const summaryPath = join(AUDIT_DIR, "master-summary.json");
await Deno.writeTextFile(summaryPath, JSON.stringify(results, null, 2));
console.log(`\n💾 Saved full summary → ${summaryPath}`);
console.log("✅ All modules finished.\n");
