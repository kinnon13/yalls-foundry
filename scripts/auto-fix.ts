#!/usr/bin/env -S deno run -A
// Auto-Fix System - self-healing script for common issues
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
const DRY_RUN = Deno.args.includes("--dry-run");

console.log(`🔧 Auto-Fix System ${DRY_RUN ? "(DRY RUN)" : "(LIVE MODE)"}\n`);

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
      // Check if dead code report exists
      const reportPath = `${AUDIT_DIR}/dead-code-results.json`;
      if (!(await exists(reportPath))) {
        console.log("  ⚠️  No dead code report found. Run scan first.");
        return false;
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

      // In live mode, this would move files to quarantine
      console.log("  ⚠️  Auto-quarantine not yet implemented");
      return false;
    },
  },
  {
    name: "Remove Duplicate Docs",
    description: "Removes redundant documentation files",
    apply: async () => {
      const reportPath = `${AUDIT_DIR}/duplicate-docs-results.json`;
      if (!(await exists(reportPath))) {
        console.log("  ⚠️  No duplicate docs report found. Run scan first.");
        return false;
      }

      const report = JSON.parse(await Deno.readTextFile(reportPath));
      if (!report.duplicateGroups || report.duplicateGroups.length === 0) {
        console.log("  ✅ No duplicate documents detected");
        return true;
      }

      console.log(`  Found ${report.duplicateGroups.length} duplicate group(s)`);
      if (DRY_RUN) {
        console.log("  [DRY RUN] Would remove duplicates:");
        report.duplicateGroups.forEach((group: string[], idx: number) => {
          console.log(`    Group ${idx + 1}:`);
          group.slice(1).forEach((file: string) => console.log(`      - ${file}`));
        });
        return true;
      }

      console.log("  ⚠️  Auto-removal not yet implemented");
      return false;
    },
  },
];

let successCount = 0;
let failCount = 0;

for (const fix of fixes) {
  console.log(`\n🔧 ${fix.name}`);
  console.log(`   ${fix.description}`);

  try {
    const success = await fix.apply();
    if (success) {
      console.log(`   ✅ FIXED`);
      successCount++;
    } else {
      console.log(`   ⚠️  SKIPPED or FAILED`);
      failCount++;
    }
  } catch (e) {
    console.log(`   ❌ ERROR: ${e.message}`);
    failCount++;
  }
}

console.log(`\n${"=".repeat(80)}`);
console.log(`🔧 Auto-Fix Complete ${DRY_RUN ? "(Dry Run)" : ""}`);
console.log(`   Applied: ${successCount}`);
console.log(`   Skipped/Failed: ${failCount}`);

if (DRY_RUN) {
  console.log(`\n💡 Run without --dry-run to apply fixes`);
}
console.log(`${"=".repeat(80)}\n`);
