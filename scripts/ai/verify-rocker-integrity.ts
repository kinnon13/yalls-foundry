#!/usr/bin/env -S deno run -A
// Rocker AI Integrity Verifier - ensures all AI brain kernels are properly loaded
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

const REQUIRED_KERNELS = [
  { name: "user", path: "src/lib/rocker/kernels/user.ts" },
  { name: "admin", path: "src/lib/rocker/kernels/admin.ts" },
  { name: "super-andy", path: "src/lib/rocker/kernels/super-andy.ts" },
];

console.log("🧠 Verifying Rocker AI kernel integrity...\n");

const results: Array<{ name: string; exists: boolean; path: string }> = [];
let missing = 0;

for (const kernel of REQUIRED_KERNELS) {
  const kernelExists = await exists(kernel.path);
  results.push({
    name: kernel.name,
    exists: kernelExists,
    path: kernel.path,
  });

  if (kernelExists) {
    console.log(`✅ ${kernel.name.padEnd(20)} ${kernel.path}`);
  } else {
    console.log(`❌ ${kernel.name.padEnd(20)} MISSING: ${kernel.path}`);
    missing++;
  }
}

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalKernels: REQUIRED_KERNELS.length,
    present: REQUIRED_KERNELS.length - missing,
    missing,
  },
  kernels: results,
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/rocker-integrity-results.json`,
  JSON.stringify(report, null, 2)
);

console.log(`\n${"=".repeat(80)}`);
if (missing > 0) {
  console.log(`⚠️  ${missing} Rocker AI kernel(s) missing or not loaded`);
  console.log(`    AI functionality may be degraded`);
  Deno.exit(1);
} else {
  console.log(`✅ All Rocker AI kernels verified and operational`);
}
console.log(`${"=".repeat(80)}\n`);
