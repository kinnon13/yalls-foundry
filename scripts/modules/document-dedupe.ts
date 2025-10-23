#!/usr/bin/env -S deno run -A
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { crypto } from "https://deno.land/std@0.223.0/crypto/mod.ts";
import { ensureDir, writeJSON, AUDIT_DIR } from "./_utils.ts";

const FIX = Deno.args.includes("--fix");
const ROOT = "docs";
const map = new Map<string,string[]>();

for await (const e of walk(ROOT,{ includeDirs:false, exts:[".md",".txt",".json"] })) {
  const data = await Deno.readTextFile(e.path);
  const h = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(data)))).map(b=>b.toString(16).padStart(2,"0")).join("");
  if (!map.has(h)) map.set(h,[]);
  map.get(h)!.push(e.path);
}

const groups = [...map.values()].filter(v=>v.length>1);
await ensureDir(AUDIT_DIR);
await writeJSON(`${AUDIT_DIR}/document-dupes.json`, { timestamp: Date.now(), groups });

if (!FIX || groups.length===0) {
  console.log(`ℹ️ document dup groups: ${groups.length} (run with --fix to quarantine duplicates)`);
  Deno.exit(0);
}

// move all but first copy
await ensureDir("scripts/quarantine/docs");
let moved=0;
for (const g of groups) {
  for (let i=1; i<g.length; i++) {
    const src = g[i];
    const dest = `scripts/quarantine/docs/${src.replaceAll("/","__")}`;
    try { await Deno.rename(src,dest); moved++; } catch {}
  }
}
console.log(`✅ Quarantined ${moved} duplicate doc(s).`);
