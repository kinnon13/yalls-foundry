#!/usr/bin/env -S deno run -A
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { writeJSON, ensureDir, AUDIT_DIR } from "./_utils.ts";

const FIX = Deno.args.includes("--fix");
const patterns = [
  /(api[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})["']?/i,
  /(secret)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})["']?/i,
  /(bearer)\s+([A-Za-z0-9\._\-]{10,})/i,
  /(supabase_(url|key))\s*[:=]\s*["']?([^"'\s]+)/i
];

const hits: any[] = [];
for await (const e of walk(".", { includeDirs:false, skip:["node_modules",".git","dist","build"], exts:[".env",".ts",".tsx",".js",".json",".toml"] })) {
  const t = await Deno.readTextFile(e.path);
  patterns.forEach((re) => {
    let m;
    const rx = new RegExp(re, "gi");
    while ((m = rx.exec(t)) !== null) {
      hits.push({ file:e.path, match:m[0] });
    }
  });
}

await ensureDir(AUDIT_DIR);
await writeJSON(`${AUDIT_DIR}/security-leaks.json`, { timestamp: Date.now(), count: hits.length, hits });

if (!FIX || hits.length===0) {
  console.log(`ℹ️ possible secrets: ${hits.length} (run with --fix to redact placeholders)`);
  Deno.exit(0);
}

// redact (in-place)
let redacted = 0;
for (const h of hits) {
  const content = await Deno.readTextFile(h.file);
  const red = content.replace(h.match, h.match.replace(/([A-Za-z0-9\._\-]{6,})/g,"<REDACTED>"));
  if (red !== content) { await Deno.writeTextFile(h.file, red); redacted++; }
}
console.log(`✅ Redacted ${redacted}/${hits.length} occurrences (placeholders inserted).`);
