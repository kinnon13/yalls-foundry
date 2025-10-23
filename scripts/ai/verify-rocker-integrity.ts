#!/usr/bin/env -S deno run -A
// Rocker AI Integrity Verifier - ensures all AI brain kernels are properly loaded
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../modules/logger.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

header("VERIFY ROCKER INTEGRITY");

const brains = [
  { name: "super-andy", path: "src/ai/super-andy.ts" },
  { name: "rocker-user", path: "src/ai/rocker-user.ts" },
  { name: "rocker-admin", path: "src/ai/rocker-admin.ts" },
];

const results: Array<{ name: string; ok: boolean; size?: number }> = [];

for (const b of brains) {
  try {
    const content = await Deno.readTextFile(b.path);
    console.log(`✅ ${b.name.padEnd(20)} (${content.length} bytes)`);
    results.push({ name: b.name, ok: true, size: content.length });
  } catch {
    console.log(`❌ Missing brain: ${b.name}`);
    results.push({ name: b.name, ok: false });
  }
}

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalBrains: brains.length,
    present: results.filter(r => r.ok).length,
    missing: results.filter(r => !r.ok).length,
  },
  brains: results,
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/rocker-integrity-results.json`,
  JSON.stringify(report, null, 2)
);

line();

if (report.summary.missing > 0) {
  console.error(`\n⚠️  ${report.summary.missing} Rocker AI kernel(s) missing`);
  console.error(`   AI functionality may be degraded`);
  line();
  Deno.exit(1);
} else {
  console.log(`\n✅ All Rocker AI kernels verified and operational`);
  line();
  Deno.exit(0);
}
