#!/usr/bin/env -S deno run -A
// Document deduplicator - finds duplicate docs by content hash
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { crypto } from "https://deno.land/std@0.223.0/crypto/mod.ts";
import { exists, writeJSON, ensureDir, AUDIT_DIR, getFix, now } from "./_utils.ts";

const FIX = getFix();
await ensureDir(AUDIT_DIR);

const DOCS_ROOT = "docs";
const QUAR_DIR = "scripts/quarantine/docs";

if (!(await exists(DOCS_ROOT))) {
  console.log("⚠️  No docs directory; skipping.");
  await writeJSON(`${AUDIT_DIR}/document-duplicates.json`, {
    timestamp: now(),
    duplicateGroups: 0,
    totalDuplicates: 0,
    groups: [],
    message: "No docs directory found"
  });
  Deno.exit(0);
}

const hashMap = new Map<string, string[]>();

for await (const entry of walk(DOCS_ROOT, { 
  includeDirs: false, 
  exts: [".md", ".txt", ".json"] 
})) {
  const content = await Deno.readTextFile(entry.path);
  const hash = Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(content)))
  ).map(b => b.toString(16).padStart(2, "0")).join("");
  
  if (!hashMap.has(hash)) {
    hashMap.set(hash, []);
  }
  hashMap.get(hash)!.push(entry.path);
}

const duplicateGroups = [...hashMap.values()].filter(group => group.length > 1);

const report = {
  timestamp: now(),
  duplicateGroups: duplicateGroups.length,
  totalDuplicates: duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0),
  groups: duplicateGroups,
  action: FIX && duplicateGroups.length > 0 ? "quarantined" : "scan_only"
};

await writeJSON(`${AUDIT_DIR}/document-duplicates.json`, report);

console.log(`📄 ${duplicateGroups.length} duplicate document group(s)`);

if (!FIX || duplicateGroups.length === 0) {
  if (duplicateGroups.length > 0) {
    console.log(`ℹ️  Run with --fix to quarantine duplicates (keeps first copy)`);
  }
  Deno.exit(0);
}

await ensureDir(QUAR_DIR);

let moved = 0;
for (const group of duplicateGroups) {
  // Keep first, move rest
  for (let i = 1; i < group.length; i++) {
    const src = group[i];
    const dest = `${QUAR_DIR}/${src.replaceAll("/", "__")}`;
    
    try {
      await Deno.rename(src, dest);
      moved++;
    } catch (e) {
      console.error(`❌ Failed to move ${src}:`, e);
    }
  }
}

console.log(`✅ Quarantined ${moved} duplicate document(s) → ${QUAR_DIR}/`);
