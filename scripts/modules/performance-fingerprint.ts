#!/usr/bin/env -S deno run -A
// Performance fingerprint - finds large files
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { writeJSON, ensureDir, AUDIT_DIR, now } from "./_utils.ts";

await ensureDir(AUDIT_DIR);

const THRESHOLD_KB = 120;

const large: { file: string; kb: number }[] = [];

for await (const entry of walk("src", { 
  includeDirs: false, 
  exts: [".ts", ".tsx", ".js"] 
})) {
  const stat = await Deno.stat(entry.path);
  const kb = Math.round(stat.size / 1024);
  
  if (kb > THRESHOLD_KB) {
    large.push({ file: entry.path, kb });
  }
}

large.sort((a, b) => b.kb - a.kb);

const report = {
  timestamp: now(),
  thresholdKB: THRESHOLD_KB,
  count: large.length,
  files: large
};

await writeJSON(`${AUDIT_DIR}/performance.json`, report);

console.log(`⚙️  ${large.length} large file(s) over ${THRESHOLD_KB}KB`);
if (large.length > 0) {
  console.log(`   Largest: ${large[0].file} (${large[0].kb}KB)`);
}
console.log(`ℹ️  Performance scan is analysis-only (no auto-fix available)`);
