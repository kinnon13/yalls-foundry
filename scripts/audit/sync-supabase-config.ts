#!/usr/bin/env -S deno run -A
// 🔄 Sync local Supabase Edge Function folders with config.toml
// Behavior: Additive only - preserves existing configs, adds missing folders

import { parse, stringify } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

if (!(await exists(CONFIG_PATH))) {
  console.error("❌ config.toml not found");
  Deno.exit(1);
}
if (!(await exists(FUNCS_DIR))) {
  console.error("❌ functions directory not found");
  Deno.exit(1);
}

console.log("🔄 Syncing Supabase config with actual function folders...\n");

const configText = await Deno.readTextFile(CONFIG_PATH);
const config = parse(configText) as Record<string, any>;
const existing = new Set(
  Object.keys(config)
    .filter(k => k.startsWith("functions.") && !k.endsWith(".cron"))
    .map(k => k.replace("functions.", ""))
);

const folders: string[] = [];
for await (const e of Deno.readDir(FUNCS_DIR)) {
  if (e.isDirectory && !e.name.startsWith(".") && e.name !== "_shared") {
    folders.push(e.name);
  }
}

let added = 0;
const addedNames: string[] = [];

for (const name of folders) {
  if (!existing.has(name)) {
    const key = `functions.${name}`;
    config[key] = { verify_jwt: false }; // Default to public, user can tighten
    added++;
    addedNames.push(name);
  }
}

if (added > 0) {
  const newToml = stringify(config);
  await Deno.writeTextFile(CONFIG_PATH, newToml);
  console.log(`✅ Added ${added} new function(s) to config.toml:`);
  for (const name of addedNames) {
    console.log(`   + ${name} (verify_jwt = false)`);
  }
  console.log("\n💡 Review settings and adjust verify_jwt as needed");
} else {
  console.log("✅ All function folders already have config entries");
}

console.log("\n📋 Summary:");
console.log(`   Existing configs: ${existing.size}`);
console.log(`   Total folders: ${folders.length}`);
console.log(`   Newly added: ${added}`);
console.log("\n🎯 Next: Run 'deno run -A scripts/audit-functions.ts' to verify\n");
