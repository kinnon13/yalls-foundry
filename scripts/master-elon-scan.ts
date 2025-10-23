#!/usr/bin/env -S deno run -A
// Y'ALL MASTER SCAN - UNIFIED COMMAND CENTER
// Orchestrates complete stack audit across all layers

import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🚀 Y'ALL MASTER SCAN v∞                                 ║
║                 FULL STACK AUDIT - ALL SYSTEMS                             ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

type ScanResult = {
  layer: string;
  script: string;
  success: boolean;
  output: string;
  error?: string;
  duration: number;
};

const results: ScanResult[] = [];

async function runScript(layer: string, script: string): Promise<ScanResult> {
  const startTime = Date.now();
  console.log(`\n▶ [${layer.toUpperCase()}] Running ${script}...`);
  console.log(`${"─".repeat(80)}`);
  
  try {
    const process = new Deno.Command("deno", {
      args: ["run", "-A", `scripts/${layer}/${script}`],
      stdout: "piped",
      stderr: "piped"
    });
    
    const { code, stdout, stderr } = await process.output();
    const output = new TextDecoder().decode(stdout);
    const error = new TextDecoder().decode(stderr);
    
    console.log(output);
    if (error && code !== 0) console.error(error);
    
    const duration = Date.now() - startTime;
    const success = code === 0;
    
    console.log(`${success ? "✅" : "❌"} ${script} (${duration}ms)`);
    
    return { layer, script, success, output, error: error || undefined, duration };
  } catch (e) {
    const duration = Date.now() - startTime;
    console.error(`❌ Failed to run ${script}: ${e.message}`);
    return { layer, script, success: false, output: "", error: e.message, duration };
  }
}

// LAYER 1: GUARD (Pre-Flight Checks)
console.log(`\n╔════════════════ LAYER 1: GUARD ════════════════╗`);
results.push(await runScript("guard", "verify-structure.ts"));
results.push(await runScript("guard", "verify-supabase-config.ts"));
results.push(await runScript("guard", "verify-modules.ts"));

// LAYER 2: SCAN (Analytics & Detection)
console.log(`\n╔════════════════ LAYER 2: SCAN ═════════════════╗`);
results.push(await runScript("scan", "find-dead-code.ts"));
results.push(await runScript("scan", "find-duplicate-docs.ts"));

// Only run if files exist
try {
  await Deno.stat("scripts/scan/deep-duplicate-scan.ts");
  results.push(await runScript("scan", "deep-duplicate-scan.ts"));
} catch {
  console.log(`ℹ️  Skipping deep-duplicate-scan.ts (not found)`);
}

try {
  await Deno.stat("scripts/scan/scan-cross-dependencies-v2.ts");
  results.push(await runScript("scan", "scan-cross-dependencies-v2.ts"));
} catch {
  console.log(`ℹ️  Skipping scan-cross-dependencies-v2.ts (not found)`);
}

// LAYER 3: AUDIT (Integrity Checks)
console.log(`\n╔════════════════ LAYER 3: AUDIT ════════════════╗`);
results.push(await runScript("audit", "audit-functions.ts"));
results.push(await runScript("audit", "sync-supabase-config.ts"));

// LAYER 4: HEALTH (Live System)
console.log(`\n╔════════════════ LAYER 4: HEALTH ═══════════════╗`);
results.push(await runScript("health", "verify-platform.ts"));

// Only run ping if SUPABASE_URL is set
if (Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL")) {
  results.push(await runScript("health", "ping-functions.ts"));
} else {
  console.log(`ℹ️  Skipping ping-functions.ts (SUPABASE_URL not set)`);
}

// LAYER 5: AI (Rocker Verification)
console.log(`\n╔════════════════ LAYER 5: AI ═══════════════════╗`);
try {
  await Deno.stat("scripts/ai/verify-rocker-integrity.ts");
  results.push(await runScript("ai", "verify-rocker-integrity.ts"));
} catch {
  console.log(`ℹ️  Skipping verify-rocker-integrity.ts (Rocker AI not configured)`);
}

// LAYER 6: ADMIN (Dashboard Validation)
console.log(`\n╔════════════════ LAYER 6: ADMIN ════════════════╗`);
results.push(await runScript("admin", "verify-admin-schema.ts"));

// LAYER 7: LIB VALIDATION (Utility Integrity)
console.log(`\n╔════════════════ LAYER 7: LIB ══════════════════╗`);
results.push(await runScript("lib", "verify-lib-integrity.ts"));

// LAYER 8: COMPILE REPORTS (Unified Dashboard Data)
console.log(`\n╔════════════════ LAYER 8: COMPILE ══════════════╗`);
results.push(await runScript("audit", "compile-reports.ts"));
results.push(await runScript("audit", "merge-reports.ts"));

// FINAL SUMMARY
const successful = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;
const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

const summary = {
  timestamp: new Date().toISOString(),
  summary: {
    total: results.length,
    successful,
    failed,
    totalDuration,
    avgDuration: Math.round(totalDuration / results.length)
  },
  results: results.map(({ layer, script, success, duration }) => ({
    layer,
    script,
    success,
    duration
  }))
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/master-scan-summary.json`,
  JSON.stringify(summary, null, 2)
);

console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║                         MASTER SCAN COMPLETE                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║  Total Scripts: ${results.length.toString().padEnd(60)}║
║  ✅ Successful: ${successful.toString().padEnd(60)}║
║  ❌ Failed:     ${failed.toString().padEnd(60)}║
║  ⏱️  Duration:   ${totalDuration}ms (avg ${Math.round(totalDuration/results.length)}ms per script)${' '.padEnd(32)}║
╠═══════════════════════════════════════════════════════════════════════════╣
║  📊 Report:    scripts/audit/master-scan-summary.json                     ║
╚═══════════════════════════════════════════════════════════════════════════╝
`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} scan(s) failed. Review output above for details.\n`);
  Deno.exit(1);
} else {
  console.log(`\n✅ All systems operational. Architecture integrity verified.\n`);
  Deno.exit(0);
}
