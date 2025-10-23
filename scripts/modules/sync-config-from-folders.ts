#!/usr/bin/env -S deno run -A
import { parse, stringify } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, writeJSON, writeText, readText, CONFIG_PATH, FUNCS_DIR, AUDIT_DIR } from "./_utils.ts";

const FIX = Deno.args.includes("--fix");

if (!(await exists(CONFIG_PATH)) || !(await exists(FUNCS_DIR))) {
  console.log("config.toml or functions dir missing; skipping.");
  Deno.exit(0);
}

const config = parse(await readText(CONFIG_PATH)) as Record<string, any>;
const keys = Object.keys(config);
const existingFuncKeys = keys.filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));
const inConfig = new Set(existingFuncKeys.map(k => k.replace("functions.", "")));

const folders: string[] = [];
for await (const e of Deno.readDir(FUNCS_DIR)) {
  if (e.isDirectory && !e.name.startsWith(".") && e.name !== "_shared") folders.push(e.name);
}

const add: string[] = [];
for (const f of folders) if (!inConfig.has(f)) add.push(f);

const report = { timestamp: new Date().toISOString(), add };
await writeJSON(`${AUDIT_DIR}/sync-config-report.json`, report);

if (FIX && add.length) {
  for (const name of add) config[`functions.${name}`] = { verify_jwt: false };
  await writeText(CONFIG_PATH, stringify(config));
  console.log(`✅ Added ${add.length} missing function entries to config.toml`);
} else {
  console.log(`ℹ️ Missing entries: ${add.length} (run with --fix to add)`);
}
