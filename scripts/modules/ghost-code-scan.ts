#!/usr/bin/env -S deno run -A
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { ensureDir, exists, writeJSON, AUDIT_DIR } from "./_utils.ts";

const FIX = Deno.args.includes("--fix");
const ROOTS = ["supabase/functions","src"];
const IGNORE = ["_shared","node_modules",".next","dist","build","coverage"];
const ghosts: any[] = [];

for (const root of ROOTS) {
  if (!(await exists(root))) continue;
  for await (const e of walk(root,{ exts:[".ts",".js",".tsx"], skip:IGNORE })) {
    if (!e.isFile) continue;
    const t = await Deno.readTextFile(e.path);
    const isGhost = t.trim().length===0 || /^\/\/\s*(stub|todo|placeholder)/i.test(t);
    if (isGhost) ghosts.push({ file:e.path });
  }
}

await ensureDir(AUDIT_DIR);
await writeJSON(`${AUDIT_DIR}/ghosts.json`, { timestamp: Date.now(), ghosts });

if (!FIX || ghosts.length===0) {
  console.log(`ℹ️ ghost files: ${ghosts.length} (run with --fix to quarantine)`);
  Deno.exit(0);
}

await ensureDir("scripts/quarantine");
let moved=0;
for (const g of ghosts) {
  const dest = `scripts/quarantine/${g.file.replaceAll("/","__")}`;
  try { await Deno.rename(g.file, dest); moved++; } catch {}
}
console.log(`✅ Quarantined ${moved}/${ghosts.length} ghost files → scripts/quarantine/`);
