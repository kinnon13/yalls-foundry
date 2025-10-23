#!/usr/bin/env -S deno run -A
// Admin Dashboard Schema Verifier - ensures dashboard can parse all scan outputs
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../modules/logger.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

header("VERIFY ADMIN SCHEMA");

// Check if admin dashboard exists
const adminPaths = [
  "src/admin/dashboard.tsx",
  "src/pages/admin/Dashboard.tsx",
  "src/components/admin/Dashboard.tsx",
];

let adminFound = false;
for (const path of adminPaths) {
  if (await exists(path)) {
    console.log(`✅ Admin dashboard found: ${path}`);
    const txt = await Deno.readTextFile(path);
    console.log(txt.includes("AuditReport") || txt.includes("audit") 
      ? "✅ Report binding detected" 
      : "⚠️  No AuditReport binding found");
    adminFound = true;
    break;
  }
}

if (!adminFound) {
  console.log("ℹ️  Admin dashboard not yet implemented");
}

// Check required report files
const REQUIRED_REPORTS = [
  "master-scan-summary.json",
  "dead-code-results.json",
  "duplicate-docs-results.json",
  "audit-results.json",
];

console.log(`\nChecking report schemas...`);

const results: Array<{ file: string; exists: boolean; valid: boolean; error?: string }> = [];
let errors = 0;

for (const reportFile of REQUIRED_REPORTS) {
  const filePath = `${AUDIT_DIR}/${reportFile}`;
  const fileExists = await exists(filePath);

  if (!fileExists) {
    results.push({
      file: reportFile,
      exists: false,
      valid: false,
      error: "File not found - run master-elon-scan.ts first",
    });
    console.log(`⚠️  ${reportFile.padEnd(40)} NOT FOUND`);
    errors++;
    continue;
  }

  try {
    const content = await Deno.readTextFile(filePath);
    const json = JSON.parse(content);

    // Validate required schema fields
    const hasTimestamp = "timestamp" in json;
    const hasSummary = "summary" in json;

    if (!hasTimestamp || !hasSummary) {
      results.push({
        file: reportFile,
        exists: true,
        valid: false,
        error: "Missing required fields (timestamp/summary)",
      });
      console.log(`⚠️  ${reportFile.padEnd(40)} INVALID SCHEMA`);
      errors++;
    } else {
      results.push({
        file: reportFile,
        exists: true,
        valid: true,
      });
      console.log(`✅ ${reportFile.padEnd(40)} VALID`);
    }
  } catch (e) {
    results.push({
      file: reportFile,
      exists: true,
      valid: false,
      error: `Parse error: ${e.message}`,
    });
    console.log(`❌ ${reportFile.padEnd(40)} PARSE ERROR`);
    errors++;
  }
}

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalReports: REQUIRED_REPORTS.length,
    valid: REQUIRED_REPORTS.length - errors,
    invalid: errors,
    adminDashboard: adminFound,
  },
  reports: results,
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/admin-schema-results.json`,
  JSON.stringify(report, null, 2)
);

line();

if (errors > 0) {
  console.log(`\n⚠️  ${errors} report(s) missing or invalid`);
  console.log(`    Run: deno run -A scripts/master-elon-scan.ts to generate reports`);
  line();
  Deno.exit(1);
} else {
  console.log(`\n✅ All admin dashboard schemas verified`);
  line();
  Deno.exit(0);
}
