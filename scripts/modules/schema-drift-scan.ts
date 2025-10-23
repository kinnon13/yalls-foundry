#!/usr/bin/env -S deno run -A
// Schema drift analyzer - catalogs migrations
import { exists, writeJSON, ensureDir, AUDIT_DIR, now } from "./_utils.ts";

await ensureDir(AUDIT_DIR);

const MIGRATIONS_DIR = "supabase/migrations";

if (!(await exists(MIGRATIONS_DIR))) {
  console.log("⚠️  No migrations directory; skipping.");
  await writeJSON(`${AUDIT_DIR}/schema-drift.json`, {
    timestamp: now(),
    count: 0,
    migrations: [],
    message: "No migrations directory found"
  });
  Deno.exit(0);
}

const migrations: string[] = [];
for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
  if (entry.name.endsWith(".sql")) {
    migrations.push(entry.name);
  }
}

const report = {
  timestamp: now(),
  count: migrations.length,
  migrations: migrations.sort()
};

await writeJSON(`${AUDIT_DIR}/schema-drift.json`, report);

console.log(`🧬 ${migrations.length} migration(s) cataloged`);
console.log(`ℹ️  Schema drift is analysis-only (no auto-fix available)`);
