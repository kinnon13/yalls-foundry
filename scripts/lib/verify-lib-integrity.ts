#!/usr/bin/env -S deno run -A
/**
 * 🔍 Library Integrity Verifier
 * Ensures no broken imports or orphaned utility modules
 */

import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "./logger.ts";
import { green, yellow, red } from "./colors.ts";

header("VERIFY LIB INTEGRITY");

const used = new Set<string>();
const defined = new Set<string>();

console.log("🔍 Scanning for lib/ imports in scripts...\n");

// Scan all scripts for lib imports
for await (const entry of walk("scripts", { exts: [".ts", ".mjs"] })) {
  try {
    const content = await Deno.readTextFile(entry.path);
    
    // Match imports from ../lib/
    for (const match of content.matchAll(/from\s+['"]\.\.\/lib\/([^'"]+)['"]/g)) {
      const imported = match[1].replace(/\.ts$/, "");
      used.add(imported);
    }
  } catch (e) {
    // Skip files that can't be read
  }
}

console.log(`Found ${used.size} unique lib imports\n`);

// Scan lib/ directory for defined modules
if (await exists("scripts/lib")) {
  for await (const entry of walk("scripts/lib", { exts: [".ts", ".js"], includeDirs: false })) {
    if (entry.name === "README.md") continue;
    const moduleName = entry.name.replace(/\.(ts|js)$/, "");
    defined.add(moduleName);
  }
  
  console.log(`Found ${defined.size} defined modules in lib/\n`);
} else {
  console.log(red("❌ scripts/lib/ directory not found\n"));
  Deno.exit(1);
}

// Find missing and orphaned modules
const missing = [...used].filter(x => !defined.has(x));
const orphaned = [...defined].filter(x => !used.has(x) && !["verify-lib-integrity", "README"].includes(x));

line();

if (missing.length > 0) {
  console.log(red("\n❌ Missing lib modules (imported but not defined):\n"));
  for (const m of missing) {
    console.log(`   • ${m}`);
  }
  console.log("");
}

if (orphaned.length > 0) {
  console.log(yellow("\n⚠️  Orphaned lib modules (defined but never imported):\n"));
  for (const m of orphaned) {
    console.log(`   • ${m}`);
  }
  console.log("");
}

// Check for circular dependencies
console.log("\n🔄 Checking for circular dependencies...\n");
let circularIssues = 0;

for await (const entry of walk("scripts/lib", { exts: [".ts", ".js"], includeDirs: false })) {
  const content = await Deno.readTextFile(entry.path);
  
  // Check if lib modules import other lib modules
  for (const match of content.matchAll(/from\s+['"]\.\/([^'"]+)['"]/g)) {
    console.log(yellow(`⚠️  ${entry.name} imports ./${match[1]} (potential circular dependency)`));
    circularIssues++;
  }
}

if (circularIssues === 0) {
  console.log(green("✅ No circular dependencies detected\n"));
}

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total_imports: used.size,
    total_modules: defined.size,
    missing: missing.length,
    orphaned: orphaned.length,
    circular_issues: circularIssues,
    status: missing.length === 0 && circularIssues === 0 ? "PASS" : "FAIL"
  },
  missing,
  orphaned,
  used: [...used],
  defined: [...defined]
};

await Deno.writeTextFile(
  "scripts/audit/lib-integrity-results.json",
  JSON.stringify(report, null, 2)
);

console.log("💾 Report saved to scripts/audit/lib-integrity-results.json\n");

line();

if (missing.length === 0 && circularIssues === 0) {
  console.log(green("\n✅ LIB INTEGRITY VERIFIED - ALL SYSTEMS NOMINAL\n"));
  Deno.exit(0);
} else {
  console.log(red("\n❌ LIB INTEGRITY FAILED - FIX ISSUES ABOVE\n"));
  Deno.exit(1);
}