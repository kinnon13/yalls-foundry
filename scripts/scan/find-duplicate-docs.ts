#!/usr/bin/env -S deno run -A
// Duplicate Document Scanner - finds redundant or stale docs by content hash
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { crypto } from "https://deno.land/std@0.223.0/crypto/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const TARGETS = ["supabase", "docs", "scripts"];
const AUDIT_DIR = "scripts/audit";

await ensureDir(AUDIT_DIR);

const hashToFiles = new Map<string, string[]>();

console.log("🔍 Scanning for duplicate documents...\n");

for (const dir of TARGETS) {
  if (!(await exists(dir))) {
    console.log(`⚠️  Skipping ${dir} (not found)`);
    continue;
  }
  
  try {
    for await (const entry of walk(dir, { 
      exts: [".json", ".md", ".sql", ".txt"], 
      includeDirs: false 
    })) {
      try {
        const content = await Deno.readTextFile(entry.path);
        
        // Generate SHA-1 hash of content
        const hash = Array.from(
          new Uint8Array(
            await crypto.subtle.digest("SHA-1", new TextEncoder().encode(content))
          )
        ).map(b => b.toString(16).padStart(2, "0")).join("");
        
        if (!hashToFiles.has(hash)) {
          hashToFiles.set(hash, []);
        }
        hashToFiles.get(hash)!.push(entry.path);
      } catch (e) {
        // Skip files that can't be read
      }
    }
  } catch (e) {
    console.log(`⚠️  Error scanning ${dir}: ${e.message}`);
  }
}

// Find groups with duplicates
const duplicateGroups = [...hashToFiles.values()].filter(files => files.length > 1);

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFiles: [...hashToFiles.values()].reduce((sum, files) => sum + files.length, 0),
    uniqueFiles: hashToFiles.size,
    duplicateGroups: duplicateGroups.length,
    totalDuplicates: duplicateGroups.reduce((sum, group) => sum + group.length - 1, 0)
  },
  duplicateGroups
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/duplicate-docs-results.json`,
  JSON.stringify(report, null, 2)
);

console.log(`${"=".repeat(80)}`);
if (duplicateGroups.length > 0) {
  console.log(`⚠️  Found ${duplicateGroups.length} duplicate document group(s):`);
  duplicateGroups.forEach((group, idx) => {
    console.log(`\n   Group ${idx + 1} (${group.length} copies):`);
    group.forEach(file => console.log(`      • ${file}`));
  });
  console.log(`\nℹ️  Consider removing ${report.summary.totalDuplicates} duplicate file(s)`);
} else {
  console.log(`✅ No duplicate documents detected`);
}
console.log(`${"=".repeat(80)}\n`);
