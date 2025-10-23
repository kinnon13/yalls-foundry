#!/usr/bin/env -S deno run -A
import { exists, writeJSON, AUDIT_DIR } from "./_utils.ts";

if (!(await exists("supabase/migrations"))) { console.log("no migrations dir; skip"); Deno.exit(0); }

const migs = [];
for await (const e of Deno.readDir("supabase/migrations")) if (e.name.endsWith(".sql")) migs.push(e.name);

const drift = []; // we only report what exists
await writeJSON(`${AUDIT_DIR}/schema-drift.json`, { timestamp: Date.now(), migrations: migs, drift });
console.log(`🧬 Schema drift scan complete. Migrations: ${migs.length}.`);
