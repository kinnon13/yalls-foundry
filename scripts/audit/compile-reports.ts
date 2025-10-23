#!/usr/bin/env -S deno run -A
// Report Compiler - combines all scan JSONs into unified dashboard data source
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";

console.log("📊 Compiling all audit reports into unified summary...\n");

if (!(await exists(AUDIT_DIR))) {
  console.error("❌ Audit directory not found. Run master-elon-scan.ts first.");
  Deno.exit(1);
}

const reports: Record<string, any> = {};
let totalFiles = 0;
let successFiles = 0;

for await (const entry of walk(AUDIT_DIR, { 
  exts: [".json"], 
  includeDirs: false,
  skip: [/unified-report\.json$/]
})) {
  totalFiles++;
  const reportName = entry.name.replace(".json", "");

  try {
    const content = await Deno.readTextFile(entry.path);
    const json = JSON.parse(content);
    reports[reportName] = json;
    successFiles++;
    console.log(`✅ Loaded: ${reportName}`);
  } catch (e) {
    console.log(`⚠️  Failed to load: ${reportName} (${e.message})`);
    reports[reportName] = { error: e.message };
  }
}

// Generate unified summary
const unifiedReport = {
  generatedAt: new Date().toISOString(),
  meta: {
    totalReports: totalFiles,
    successfullyLoaded: successFiles,
    failedToLoad: totalFiles - successFiles,
  },
  health: {
    overall: successFiles === totalFiles ? "healthy" : "degraded",
    criticalIssues: 0,
    warnings: 0,
  },
  reports,
};

// Calculate health metrics
for (const [name, report] of Object.entries(reports)) {
  if (report.error) {
    unifiedReport.health.criticalIssues++;
  } else if (report.summary) {
    // Check for issues in each report
    const s = report.summary;
    if (s.deadExports > 0 || s.duplicateGroups > 0 || s.ghosts > 0 || s.orphans > 0) {
      unifiedReport.health.warnings++;
    }
    if (s.failed > 0 || s.missing > 0 || s.invalid > 0) {
      unifiedReport.health.criticalIssues++;
    }
  }
}

// Update overall health status
if (unifiedReport.health.criticalIssues > 0) {
  unifiedReport.health.overall = "critical";
} else if (unifiedReport.health.warnings > 0) {
  unifiedReport.health.overall = "warning";
}

const outputPath = `${AUDIT_DIR}/unified-report.json`;
await Deno.writeTextFile(
  outputPath,
  JSON.stringify(unifiedReport, null, 2)
);

console.log(`\n${"=".repeat(80)}`);
console.log(`📊 Unified Report Generated: ${outputPath}`);
console.log(`\nHealth Status: ${unifiedReport.health.overall.toUpperCase()}`);
console.log(`  Critical Issues: ${unifiedReport.health.criticalIssues}`);
console.log(`  Warnings: ${unifiedReport.health.warnings}`);
console.log(`  Reports Compiled: ${successFiles}/${totalFiles}`);
console.log(`${"=".repeat(80)}\n`);
