#!/usr/bin/env -S deno run -A
// 🔍 Verify Installation - Check all audit scripts are in place

import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const requiredScripts = [
  "scripts/audit-functions.ts",
  "scripts/restore-ghost-functions.ts",
  "scripts/sync-supabase-config.ts",
  "scripts/verify-platform.ts",
  "scripts/ai_audit.sh",
];

const configPath = "supabase/config.toml";
const resultsPath = "scripts/audit-results.json";

console.log("🔍 Verifying Lovable Cloud audit installation...\n");

let allPresent = true;

console.log("📦 Required Scripts:");
for (const script of requiredScripts) {
  if (await exists(script)) {
    console.log(`  ✅ ${script}`);
  } else {
    console.error(`  ❌ Missing ${script}`);
    allPresent = false;
  }
}

console.log("\n📦 Required Files:");
if (await exists(configPath)) {
  console.log(`  ✅ ${configPath}`);
} else {
  console.error(`  ❌ Missing ${configPath}`);
  allPresent = false;
}

console.log("\n📊 Audit Results:");
if (await exists(resultsPath)) {
  console.log(`  ✅ Found ${resultsPath}`);
  try {
    const data = JSON.parse(await Deno.readTextFile(resultsPath));
    console.log(`  📅 Last audit: ${data.timestamp || 'unknown'}`);
    console.log(`  📁 Total folders: ${data.summary?.totalFolders || data.folders || 'unknown'}`);
    console.log(`  📋 Config entries: ${data.summary?.totalConfig || data.config || 'unknown'}`);
    console.log(`  ✅ Active: ${data.summary?.active || 'unknown'}`);
    console.log(`  👻 Ghosts: ${data.summary?.ghosts || 'unknown'}`);
    console.log(`  🔧 Orphans: ${data.summary?.orphans || 'unknown'}`);
  } catch (e) {
    console.error(`  ⚠️  Could not parse audit results: ${e.message}`);
  }
} else {
  console.log(`  ⚠️  Audit results not yet generated`);
  console.log(`     Run: deno run -A scripts/audit-functions.ts`);
}

console.log("\n" + "=".repeat(60));

if (allPresent) {
  console.log("✅ Installation verified - all scripts present");
  console.log("\n💡 To run full audit:");
  console.log("   bash scripts/ai_audit.sh");
} else {
  console.error("❌ Installation incomplete - missing files detected");
  Deno.exit(1);
}

console.log("\n🧩 Run this before each deployment to verify system health");
