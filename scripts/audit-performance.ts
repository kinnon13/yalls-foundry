#!/usr/bin/env -S deno run -A
// Performance fingerprint - finds large files
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
const THRESHOLD_KB = 120;

await ensureDir(AUDIT_DIR);

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
  timestamp: new Date().toISOString(),
  thresholdKB: THRESHOLD_KB,
  count: large.length,
  files: large
};

await Deno.writeTextFile(`${AUDIT_DIR}/performance.json`, JSON.stringify(report, null, 2));

console.log(`⚙️  Found ${large.length} large file(s) over ${THRESHOLD_KB}KB`);
if (large.length > 0) {
  console.log(`ℹ️  Largest: ${large[0].file} (${large[0].kb}KB)`);
}
