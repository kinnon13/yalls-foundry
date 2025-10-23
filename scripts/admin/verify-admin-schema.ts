#!/usr/bin/env -S deno run -A
// Admin Dashboard Schema Verifier - ensures dashboard can parse all scan outputs
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

const REQUIRED_REPORTS = [
  "master-scan-summary.json",
  "dead-code-results.json",
  "duplicate-docs-results.json",
  "dependency-scan-results.json",
  "deep-duplicate-results.json",
  "audit-results.json",
  "ping-results.json",
];

console.log("🧭 Verifying admin dashboard schema compatibility...\n");

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
      error: "File not found",
    });
    console.log(`❌ ${reportFile.padEnd(40)} NOT FOUND`);
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
  },
  reports: results,
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/admin-schema-results.json`,
  JSON.stringify(report, null, 2)
);

console.log(`\n${"=".repeat(80)}`);
if (errors > 0) {
  console.log(`⚠️  ${errors} report(s) missing or invalid`);
  console.log(`    Admin dashboard may not render correctly`);
  console.log(`    Run: deno run -A scripts/master-elon-scan.ts to generate reports`);
  Deno.exit(1);
} else {
  console.log(`✅ All admin dashboard schemas verified`);
}
console.log(`${"=".repeat(80)}\n`);
