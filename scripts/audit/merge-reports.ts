#!/usr/bin/env -S deno run -A
/**
 * 📊 Report Merger
 * Combines all scan JSONs into a unified dashboard-ready report
 */

import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../lib/logger.ts";
import { green, yellow } from "../lib/colors.ts";

const AUDIT_DIR = "scripts/audit";

header("MERGE REPORTS");

if (!(await exists(AUDIT_DIR))) {
  console.error("❌ Audit directory not found. Run master-elon-scan.ts first.");
  line();
  Deno.exit(1);
}

const reports: Record<string, any> = {};
const skipped = ["combined-report.json", "unified-report.json", "merged-report.json"];
let totalReports = 0;
let successReports = 0;

console.log("📊 Scanning for audit reports...\n");

for await (const entry of walk(AUDIT_DIR, { exts: [".json"], includeDirs: false })) {
  if (skipped.includes(entry.name)) continue;
  
  totalReports++;
  const reportName = entry.name.replace(".json", "");
  
  try {
    const content = await Deno.readTextFile(entry.path);
    const json = JSON.parse(content);
    reports[reportName] = json;
    successReports++;
    console.log(green(`✅ Loaded: ${reportName}`));
  } catch (e) {
    console.log(yellow(`⚠️  Failed to load: ${reportName} (${e.message})`));
    reports[reportName] = { error: e.message };
  }
}

console.log(`\nTotal reports: ${totalReports}`);
console.log(`Successfully loaded: ${successReports}\n`);

// Generate unified summary with health scoring
const healthScore = {
  dead_code: 0,
  duplicates: 0,
  orphans: 0,
  config_sync: 0,
  function_health: 0
};

if (reports["dead-code-results"]?.summary) {
  const dead = reports["dead-code-results"].summary.deadExports || 0;
  healthScore.dead_code = dead === 0 ? 100 : Math.max(0, 100 - (dead * 5));
}

if (reports["duplicate-docs-results"]?.summary) {
  const dups = reports["duplicate-docs-results"].summary.duplicateGroups || 0;
  healthScore.duplicates = dups === 0 ? 100 : Math.max(0, 100 - (dups * 10));
}

if (reports["orphan-assets-results"]?.summary) {
  const orphans = reports["orphan-assets-results"].summary.orphanAssets || 0;
  healthScore.orphans = orphans === 0 ? 100 : Math.max(0, 100 - (orphans * 2));
}

if (reports["audit-results"]?.summary) {
  const ghosts = reports["audit-results"].summary.ghosts || 0;
  const orphaned = reports["audit-results"].summary.orphans || 0;
  healthScore.config_sync = ghosts === 0 && orphaned === 0 ? 100 : Math.max(0, 100 - ((ghosts + orphaned) * 10));
}

if (reports["ping-results"]?.summary) {
  const total = reports["ping-results"].summary.total || 1;
  const successful = reports["ping-results"].summary.successful || 0;
  healthScore.function_health = Math.round((successful / total) * 100);
}

const avgHealth = Math.round(Object.values(healthScore).reduce((a, b) => a + b, 0) / Object.keys(healthScore).length);

const healthStatus = avgHealth >= 90 ? "healthy" : avgHealth >= 70 ? "degraded" : avgHealth >= 50 ? "warning" : "critical";

// Create unified report
const unifiedReport = {
  generated_at: new Date().toISOString(),
  meta: {
    total_reports: totalReports,
    successfully_loaded: successReports,
    failed_to_load: totalReports - successReports
  },
  health: {
    overall: healthStatus,
    score: avgHealth,
    scores: healthScore,
    critical_issues: Object.values(reports).filter((r: any) => r.summary?.errors > 0).length,
    warnings: Object.values(reports).filter((r: any) => r.summary?.warnings > 0).length
  },
  reports
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/combined-report.json`,
  JSON.stringify(unifiedReport, null, 2)
);

line();
console.log(green(`\n✅ Combined report generated: ${AUDIT_DIR}/combined-report.json`));
console.log(`\n📊 System Health: ${healthStatus.toUpperCase()} (${avgHealth}%)\n`);

if (healthStatus === "healthy" || healthStatus === "degraded") {
  console.log(green("✅ Report merge complete\n"));
  Deno.exit(0);
} else {
  console.log(yellow("⚠️  Report merge complete with warnings\n"));
  Deno.exit(0);
}