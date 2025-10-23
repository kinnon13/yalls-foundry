#!/usr/bin/env -S deno run -A
// ✅ Verify platform readiness before deploy

import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const criticalPaths = [
  "supabase/config.toml",
  "supabase/functions",
  "src",
];

const optionalPaths = [
  ".env", // Lovable Cloud auto-generates this
  "scripts",
];

console.log("🔍 Verifying platform readiness...\n");

let allCritical = true;
let warnings = 0;

// Check critical paths
console.log("📦 Critical Files:");
for (const p of criticalPaths) {
  if (!(await exists(p))) {
    console.error(`  ❌ CRITICAL: Missing ${p}`);
    allCritical = false;
  } else {
    console.log(`  ✅ ${p}`);
  }
}

// Check optional paths (warn only)
console.log("\n📦 Optional Files:");
for (const p of optionalPaths) {
  if (!(await exists(p))) {
    if (p === ".env") {
      console.log(`  ⚠️  ${p} (auto-managed by Lovable Cloud - OK)`);
    } else {
      console.log(`  ⚠️  ${p} missing (optional)`);
      warnings++;
    }
  } else {
    console.log(`  ✅ ${p}`);
  }
}

console.log("\n" + "=".repeat(60));

if (!allCritical) {
  console.error("❌ CRITICAL FAILURE: Cannot proceed with deployment");
  console.error("   Fix missing critical files before deploying");
  Deno.exit(1);
} else if (warnings > 0) {
  console.log("⚠️  Platform verified with warnings");
  console.log("   Non-critical issues detected but safe to proceed");
  Deno.exit(0);
} else {
  console.log("✅ Platform verified: All systems ready for deployment");
  Deno.exit(0);
}
