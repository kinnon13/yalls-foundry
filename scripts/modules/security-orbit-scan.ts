#!/usr/bin/env -S deno run -A
// Security scanner - finds potential leaked secrets
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { writeJSON, ensureDir, AUDIT_DIR, getFix, now } from "./_utils.ts";

const FIX = getFix();
await ensureDir(AUDIT_DIR);

const PATTERNS = [
  /(api[_-]?key)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})["']?/i,
  /(secret)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})["']?/i,
  /(bearer)\s+([A-Za-z0-9\._\-]{10,})/i,
  /(supabase_(url|key))\s*[:=]\s*["']?([^"'\s]+)/i
];

const hits: { file: string; match: string; line: number }[] = [];

for await (const entry of walk(".", {
  includeDirs: false,
  skip: ["node_modules", ".git", "dist", "build", "scripts/audit", "scripts/quarantine"],
  exts: [".env", ".ts", ".tsx", ".js", ".json", ".toml"]
})) {
  const content = await Deno.readTextFile(entry.path);
  const lines = content.split("\n");
  
  lines.forEach((line, idx) => {
    for (const pattern of PATTERNS) {
      const regex = new RegExp(pattern, "gi");
      let match;
      while ((match = regex.exec(line)) !== null) {
        hits.push({ file: entry.path, match: match[0], line: idx + 1 });
      }
    }
  });
}

const report = {
  timestamp: now(),
  count: hits.length,
  hits,
  action: FIX && hits.length > 0 ? "redacted" : "scan_only"
};

await writeJSON(`${AUDIT_DIR}/security-leaks.json`, report);

console.log(`🔒 ${hits.length} potential secret leak(s)`);

if (!FIX || hits.length === 0) {
  if (hits.length > 0) {
    console.log(`⚠️  SECURITY: Review ${hits.length} potential leaks in audit report`);
    console.log(`ℹ️  Run with --fix to redact (use with caution!)`);
  }
  Deno.exit(0);
}

// Redact secrets in-place (dangerous!)
const fileMap = new Map<string, string>();

for (const hit of hits) {
  if (!fileMap.has(hit.file)) {
    fileMap.set(hit.file, await Deno.readTextFile(hit.file));
  }
  
  let content = fileMap.get(hit.file)!;
  const redactedMatch = hit.match.replace(/([A-Za-z0-9\._\-]{6,})/g, "<REDACTED>");
  content = content.replace(hit.match, redactedMatch);
  fileMap.set(hit.file, content);
}

let redacted = 0;
for (const [file, content] of fileMap.entries()) {
  try {
    await Deno.writeTextFile(file, content);
    redacted++;
  } catch (e) {
    console.error(`❌ Failed to redact ${file}:`, e);
  }
}

console.log(`✅ Redacted secrets in ${redacted} file(s)`);
console.log(`⚠️  Review changes carefully before committing!`);
