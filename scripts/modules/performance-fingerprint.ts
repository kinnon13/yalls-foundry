#!/usr/bin/env -S deno run -A
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { writeJSON, ensureDir, AUDIT_DIR } from "./_utils.ts";

const LARGE_KB = 120; // flag files > 120KB
const heavy: any[] = [];
for await (const e of walk("src",{ includeDirs:false, exts:[".ts",".tsx",".js"] })) {
  const st = await Deno.stat(e.path);
  const kb = Math.round(st.size/1024);
  if (kb > LARGE_KB) heavy.push({ file:e.path, kb });
}
await ensureDir(AUDIT_DIR);
await writeJSON(`${AUDIT_DIR}/performance-heavy.json`, { timestamp: Date.now(), thresholdKB: LARGE_KB, heavy });
console.log(`⚙️ Large files flagged: ${heavy.length}.`);
