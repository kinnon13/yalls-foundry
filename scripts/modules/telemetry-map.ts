#!/usr/bin/env -S deno run -A
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { ensureDir, writeJSON, AUDIT_DIR } from "./_utils.ts";

const levels = ["error","warn","info","debug"];
const acc: Record<string,number> = { error:0, warn:0, info:0, debug:0 };

for await (const e of walk("logs",{ includeDirs:false, exts:[".log",".json"] })) {
  const t = await Deno.readTextFile(e.path);
  for (const l of levels) acc[l] += (t.match(new RegExp(l,"gi")) || []).length;
}
await ensureDir(AUDIT_DIR);
await writeJSON(`${AUDIT_DIR}/telemetry-map.json`, { timestamp: Date.now(), levels: acc });
console.log(`📡 Telemetry summary:`, acc);
