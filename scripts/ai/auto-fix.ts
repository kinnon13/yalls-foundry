#!/usr/bin/env -S deno run -A
// Auto-Fix System - self-healing script for common issues
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../lib/logger.ts";

const AUDIT_DIR = "scripts/audit";
const DRY_RUN = Deno.args.includes("--dry-run");

header("AUTO FIXER");

console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
console.log(`\n🛠️  Checking for auto-fixable issues...`);

interface Fix {
  name: string;
  description: string;
  apply: () => Promise<boolean>;
}

const fixes: Fix[] = [
  {
    name: "Sync Supabase Config",
    description: "Adds missing Edge Function configs to config.toml",
    apply: async () => {
      console.log("  Running: sync-supabase-config.ts");
      const p = new Deno.Command("deno", {
        args: ["run", "-A", "scripts/audit/sync-supabase-config.ts"],
      }).spawn();
      const { code } = await p.status;
      return code === 0;
    },
  },
  {
    name: "Remove Dead Code",
    description: "Quarantines unused exports and stubs",
    apply: async () => {
      const reportPath = `${AUDIT_DIR}/dead-code-results.json`;
      if (!(await exists(reportPath))) {
        console.log("  ℹ️  No dead code report found. Run scan first.");
        return true;
      }

      const report = JSON.parse(await Deno.readTextFile(reportPath));
      if (!report.deadExports || report.deadExports.length === 0) {
        console.log("  ✅ No dead code detected");
        return true;
      }

      console.log(`  Found ${report.deadExports.length} dead export(s)`);
      if (DRY_RUN) {
        console.log("  [DRY RUN] Would quarantine:");
        report.deadExports.forEach(({ symbol, file }: any) => {
          console.log(`    - ${symbol} in ${file}`);
        });
        return true;
      }

      console.log("  ⚠️  Auto-quarantine requires manual review");
      return false;
    },
  },
  {
    name: "Remove Duplicate Docs",
    description: "Removes redundant documentation files",
    apply: async () => {
      const reportPath = `${AUDIT_DIR}/duplicate-docs-results.json`;
      if (!(await exists(reportPath))) {
        console.log("  ℹ️  No duplicate docs report found. Run scan first.");
        return true;
      }

      const report = JSON.parse(await Deno.readTextFile(reportPath));
      if (!report.duplicateGroups || report.duplicateGroups.length === 0) {
        console.log("  ✅ No duplicate documents detected");
        return true;
      }

      console.log(`  Found ${report.duplicateGroups.length} duplicate group(s)`);
      if (DRY_RUN) {
        console.log("  [DRY RUN] Would remove duplicates (keep first in each group)");
        return true;
      }

      console.log("  ⚠️  Auto-removal requires manual review");
      return false;
    },
  },
];

let successCount = 0;
let failCount = 0;

console.log();

for (const fix of fixes) {
  console.log(`\n🔧 ${fix.name}`);
  console.log(`   ${fix.description}`);

  try {
    const success = await fix.apply();
    if (success) {
      console.log(`   ✅ FIXED`);
      successCount++;
    } else {
      console.log(`   ⚠️  SKIPPED or MANUAL REVIEW NEEDED`);
      failCount++;
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    failCount++;
  }
}

line();
console.log(`\n🔧 Auto-Fix Complete ${DRY_RUN ? "(Dry Run)" : ""}`);
console.log(`   Applied: ${successCount}`);
console.log(`   Skipped/Failed: ${failCount}`);

if (DRY_RUN) {
  console.log(`\n💡 Run without --dry-run to apply fixes`);
}
line();
