#!/usr/bin/env -S deno run -A
// Telemetry mapper - analyzes log levels in log files
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists, writeJSON, ensureDir, AUDIT_DIR, now } from "./_utils.ts";

await ensureDir(AUDIT_DIR);

const LOGS_DIR = "logs";

if (!(await exists(LOGS_DIR))) {
  console.log("⚠️  No logs directory; skipping.");
  const report = {
    timestamp: now(),
    levels: { error: 0, warn: 0, info: 0, debug: 0 },
    total: 0,
    message: "No logs directory found"
  };
  await writeJSON(`${AUDIT_DIR}/telemetry.json`, report);
  Deno.exit(0);
}

const levels = ["error", "warn", "info", "debug"];
const counts: Record<string, number> = { error: 0, warn: 0, info: 0, debug: 0 };

for await (const entry of walk(LOGS_DIR, { 
  includeDirs: false, 
  exts: [".log", ".json"] 
})) {
  const content = await Deno.readTextFile(entry.path);
  
  for (const level of levels) {
    const matches = content.match(new RegExp(level, "gi"));
    if (matches) {
      counts[level] += matches.length;
    }
  }
}

const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

const report = {
  timestamp: now(),
  levels: counts,
  total
};

await writeJSON(`${AUDIT_DIR}/telemetry.json`, report);

console.log(`📡 Telemetry: ${counts.error} errors, ${counts.warn} warnings, ${counts.info} info, ${counts.debug} debug`);
console.log(`   Total log entries: ${total}`);
console.log(`ℹ️  Telemetry is analysis-only (no auto-fix available)`);
