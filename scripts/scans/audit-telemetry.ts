#!/usr/bin/env -S deno run -A
// Telemetry mapper - analyzes log levels in log files
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { ensureDir, exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
const LOGS_DIR = "logs";

await ensureDir(AUDIT_DIR);

if (!(await exists(LOGS_DIR))) {
  console.log("⚠️  No logs directory; skipping.");
  const report = {
    timestamp: new Date().toISOString(),
    levels: { error: 0, warn: 0, info: 0, debug: 0 },
    message: "No logs directory found"
  };
  await Deno.writeTextFile(`${AUDIT_DIR}/telemetry.json`, JSON.stringify(report, null, 2));
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

const report = {
  timestamp: new Date().toISOString(),
  levels: counts,
  total: Object.values(counts).reduce((sum, n) => sum + n, 0)
};

await Deno.writeTextFile(`${AUDIT_DIR}/telemetry.json`, JSON.stringify(report, null, 2));

console.log(`📡 Telemetry analysis:`, counts);
console.log(`   Total log entries: ${report.total}`);
