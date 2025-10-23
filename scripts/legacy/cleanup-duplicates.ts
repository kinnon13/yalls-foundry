#!/usr/bin/env -S deno run -A
// 🧹 Auto-cleanup duplicate function entries from config.toml

import { parse, stringify } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const CONFIG_PATH = "supabase/config.toml";
const RESULTS_PATH = "scripts/dependency-scan-results.json";

console.log("🧹 CLEANING UP DUPLICATE FUNCTION ENTRIES\n");

// Check if scan results exist
if (!(await exists(RESULTS_PATH))) {
  console.error("❌ No scan results found. Run first:");
  console.error("   deno run -A scripts/scan-cross-dependencies-v2.ts");
  Deno.exit(1);
}

// Load scan results
const results = JSON.parse(await Deno.readTextFile(RESULTS_PATH));
const duplicates = results.duplicates || [];

if (duplicates.length === 0) {
  console.log("✅ No duplicates found in scan results");
  Deno.exit(0);
}

console.log(`Found ${duplicates.length} duplicate group(s) to clean:\n`);

// Read current config
const configText = await Deno.readTextFile(CONFIG_PATH);
const config = parse(configText) as Record<string, any>;

// Track what we remove
const removedEntries: string[] = [];
const keptEntries: string[] = [];

// Process each duplicate group
for (const dup of duplicates) {
  console.log(`Processing: ${dup.normalized}`);
  
  // Determine which variant to keep
  // Priority: hyphenated > has folder > first alphabetically
  let keepVariant = dup.variants[0];
  
  for (let i = 0; i < dup.variants.length; i++) {
    const variant = dup.variants[i];
    const hasFolder = dup.hasFolder[i];
    const hasHyphen = variant.includes('-');
    const keepHasHyphen = keepVariant.includes('-');
    
    // Prefer hyphenated names
    if (hasHyphen && !keepHasHyphen) {
      keepVariant = variant;
    }
    // If both hyphenated or both underscored, prefer the one with a folder
    else if (hasHyphen === keepHasHyphen && hasFolder && !dup.hasFolder[dup.variants.indexOf(keepVariant)]) {
      keepVariant = variant;
    }
  }
  
  console.log(`  ✅ Keeping: ${keepVariant}`);
  keptEntries.push(keepVariant);
  
  // Remove all other variants
  for (const variant of dup.variants) {
    if (variant !== keepVariant) {
      const configKey = `functions.${variant}`;
      const cronKey = `${configKey}.cron`;
      
      if (config[configKey]) {
        delete config[configKey];
        removedEntries.push(variant);
        console.log(`  ❌ Removed: ${variant}`);
      }
      
      // Also remove associated cron if exists
      if (config[cronKey]) {
        delete config[cronKey];
        console.log(`     (removed cron for ${variant})`);
      }
    }
  }
  
  console.log("\n");
}

// Write back cleaned config
if (removedEntries.length > 0) {
  const newToml = stringify(config);
  await Deno.writeTextFile(CONFIG_PATH, newToml);
  
  console.log("=".repeat(60));
  console.log("\n✅ Cleanup complete!");
  console.log(`   Kept: ${keptEntries.length} function(s)`);
  console.log(`   Removed: ${removedEntries.length} duplicate(s)`);
  console.log("\n📋 Removed entries:");
  for (const entry of removedEntries) {
    console.log(`   - ${entry}`);
  }
  console.log("\n🎯 Next steps:");
  console.log("   1. Review changes: git diff supabase/config.toml");
  console.log("   2. Run audit: deno run -A scripts/audit-functions.ts");
  console.log("   3. Commit: git add -A && git commit -m 'chore: cleanup duplicate functions'");
  console.log("\n");
} else {
  console.log("⚠️  No duplicates were removed (all variants might already be clean)");
}
