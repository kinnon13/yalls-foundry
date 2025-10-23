#!/usr/bin/env -S deno run -A
// Schema drift analyzer - catalogs migrations
import { ensureDir, exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
const MIGRATIONS_DIR = "supabase/migrations";

await ensureDir(AUDIT_DIR);

if (!(await exists(MIGRATIONS_DIR))) {
  console.log("⚠️  No migrations directory found; skipping.");
  Deno.exit(0);
}

const migrations: string[] = [];
for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
  if (entry.name.endsWith(".sql")) {
    migrations.push(entry.name);
  }
}

const report = {
  timestamp: new Date().toISOString(),
  count: migrations.length,
  migrations: migrations.sort()
};

await Deno.writeTextFile(`${AUDIT_DIR}/schema-drift.json`, JSON.stringify(report, null, 2));

console.log(`🧬 Found ${migrations.length} migration(s)`);
console.log(`ℹ️  Schema drift report saved (analysis only, no auto-fix)`);
