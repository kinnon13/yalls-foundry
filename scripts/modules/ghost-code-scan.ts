#!/usr/bin/env -S deno run -A
// Ghost code scanner - finds empty/stub files
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists, writeJSON, ensureDir, AUDIT_DIR, QUAR_DIR, getFix, now } from "./_utils.ts";

const FIX = getFix();
await ensureDir(AUDIT_DIR);

const ROOTS = ["supabase/functions", "src"];
const SKIP = ["_shared", "node_modules", ".next", "dist", "build", "coverage"];

const ghosts: { file: string; reason: string }[] = [];

for (const root of ROOTS) {
  if (!(await exists(root))) continue;
  
  try {
    for await (const entry of walk(root, { exts: [".ts", ".js", ".tsx"], skip: SKIP })) {
      if (!entry.isFile) continue;
      
      const content = await Deno.readTextFile(entry.path);
      const trimmed = content.trim();
      
      if (trimmed.length === 0) {
        ghosts.push({ file: entry.path, reason: "empty file" });
      } else if (/^\/\/\s*(stub|todo|placeholder)/i.test(trimmed)) {
        ghosts.push({ file: entry.path, reason: "stub/todo comment" });
      }
    }
  } catch (e) {
    // Skip if can't read
  }
}

const report = {
  timestamp: now(),
  count: ghosts.length,
  ghosts,
  action: FIX && ghosts.length > 0 ? "quarantined" : "scan_only"
};

await writeJSON(`${AUDIT_DIR}/ghost-code.json`, report);

console.log(`👻 ${ghosts.length} ghost file(s)`);

if (!FIX || ghosts.length === 0) {
  if (ghosts.length > 0) {
    console.log(`ℹ️  Run with --fix to quarantine ghost files`);
  }
  Deno.exit(0);
}

await ensureDir(QUAR_DIR);

let moved = 0;
for (const ghost of ghosts) {
  const dest = `${QUAR_DIR}/${ghost.file.replaceAll("/", "__")}`;
  try {
    await Deno.rename(ghost.file, dest);
    moved++;
  } catch (e) {
    console.error(`❌ Failed to move ${ghost.file}:`, e);
  }
}

console.log(`✅ Quarantined ${moved}/${ghosts.length} ghost file(s) → ${QUAR_DIR}/`);
