#!/usr/bin/env -S deno run -A
// Master Elon-Class Scan v11 - Orchestrator
// Runs all audit scripts sequentially

import { join } from "https://deno.land/std@0.223.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const FIX = Deno.args.includes("--fix");
const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

const SCRIPTS = [
  "audit-deep-duplicates.ts",
  "audit-cross-dependencies.ts",
  "audit-ghost-code.ts",
  "audit-security-leaks.ts",
  "audit-schema-drift.ts",
  "audit-rls-policies.ts",
  "audit-performance.ts",
  "audit-document-duplicates.ts",
  "audit-telemetry.ts",
  "audit-sync-config.ts"
];

console.log(`\n🚀 Master Elon Scan v11 ${FIX ? "(AUTO-FIX MODE)" : "(SCAN ONLY)"}\n`);

const results: Record<string, any> = {};
for (const script of SCRIPTS) {
  const path = join("scripts/scans", script);
  console.log(`\n▶ Running ${script}...`);
  const p = new Deno.Command("deno", { 
    args: ["run", "-A", path, ...(FIX ? ["--fix"] : [])] 
  }).spawn();
  const { code, stdout, stderr } = await p.output();
  const out = new TextDecoder().decode(stdout);
  const err = new TextDecoder().decode(stderr);
  results[script] = { ok: code === 0, out, err };
  console.log(out);
  if (err) console.error(err);
  console.log(code === 0 ? `✅ ${script} completed` : `❌ ${script} failed`);
}

const summaryPath = join(AUDIT_DIR, "master-summary.json");
await Deno.writeTextFile(summaryPath, JSON.stringify(results, null, 2));
console.log(`\n💾 Full summary saved → ${summaryPath}`);
console.log(`\n✅ Master scan complete. ${FIX ? "Auto-fixes applied." : "Run with --fix to apply fixes."}\n`);
