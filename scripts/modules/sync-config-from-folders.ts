#!/usr/bin/env -S deno run -A
// Sync config.toml with actual function folders
import { parse, stringify } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, writeJSON, writeText, readText, CONFIG_PATH, FUNCS_DIR, AUDIT_DIR, getFix, now, ensureDir } from "./_utils.ts";

const FIX = getFix();
await ensureDir(AUDIT_DIR);

if (!(await exists(CONFIG_PATH)) || !(await exists(FUNCS_DIR))) {
  console.log("⚠️  config.toml or functions dir missing; skipping.");
  Deno.exit(0);
}

const config = parse(await readText(CONFIG_PATH)) as Record<string, any>;
const existingKeys = Object.keys(config).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));
const inConfig = new Set(existingKeys.map(k => k.replace("functions.", "")));

const folders: string[] = [];
for await (const e of Deno.readDir(FUNCS_DIR)) {
  if (e.isDirectory && !e.name.startsWith(".") && e.name !== "_shared") {
    folders.push(e.name);
  }
}

const missing = folders.filter(f => !inConfig.has(f));

const report = {
  timestamp: now(),
  missing,
  totalFolders: folders.length,
  configured: inConfig.size,
  action: FIX && missing.length > 0 ? "added" : "scan_only"
};

await writeJSON(`${AUDIT_DIR}/sync-config.json`, report);

if (FIX && missing.length > 0) {
  for (const name of missing) {
    config[`functions.${name}`] = { verify_jwt: false };
  }
  await writeText(CONFIG_PATH, stringify(config));
  console.log(`✅ Added ${missing.length} missing function(s) to config.toml`);
} else if (missing.length > 0) {
  console.log(`ℹ️  Found ${missing.length} unconfigured function(s) (run with --fix to add)`);
} else {
  console.log(`✅ All ${folders.length} functions are configured`);
}
