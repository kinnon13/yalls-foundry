#!/usr/bin/env -S deno run -A
// 📊 Audit Supabase function config vs. actual folders

import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

if (!(await exists(CONFIG_PATH)) || !(await exists(FUNCS_DIR))) {
  console.error("❌ CRITICAL: Missing supabase/config.toml or functions folder");
  Deno.exit(1);
}

const configText = await Deno.readTextFile(CONFIG_PATH);
const config = parse(configText) as Record<string, any>;

const configFuncs = Object.keys(config).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));
const folders: string[] = [];

for await (const entry of Deno.readDir(FUNCS_DIR)) {
  if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "_shared") {
    folders.push(entry.name);
  }
}

const configFuncNames = configFuncs.map(c => c.replace("functions.", ""));
const active = folders.filter(f => configFuncNames.includes(f));
const ghosts = configFuncNames.filter(c => !folders.includes(c));
const orphans = folders.filter(f => !configFuncNames.includes(f));

console.log("\n📊 SUPABASE FUNCTION AUDIT");
console.log("=".repeat(80));
console.log(`Config entries: ${configFuncs.length}`);
console.log(`Function folders: ${folders.length}`);
console.log(`✅ Active (both): ${active.length}`);
console.log(`👻 Ghosts (config only): ${ghosts.length}`);
console.log(`🔧 Orphans (folder only): ${orphans.length}`);

if (ghosts.length > 0) {
  console.log("\n👻 GHOST FUNCTIONS (in config, no folder):");
  for (const name of ghosts) console.log(`  ⚠️  ${name}`);
}

if (orphans.length > 0) {
  console.log("\n🔧 ORPHAN FOLDERS (folder exists, not in config):");
  for (const name of orphans) console.log(`  ⚠️  ${name}`);
}

const auditResults = {
  timestamp: new Date().toISOString(),
  summary: {
    totalConfig: configFuncs.length,
    totalFolders: folders.length,
    active: active.length,
    ghosts: ghosts.length,
    orphans: orphans.length
  },
  active,
  ghosts,
  orphans
};

await Deno.writeTextFile(
  "scripts/audit-results.json",
  JSON.stringify(auditResults, null, 2),
);

console.log("\n💾 Saved detailed report to scripts/audit-results.json");

// Exit code logic
if (ghosts.length > 0 || orphans.length > 0) {
  console.log("\n⚠️  WARNING: Mismatches detected but not blocking deployment");
  console.log("    Run 'deno run -A scripts/sync-supabase-config.ts' to auto-fix");
  Deno.exit(0); // Warn only, don't block
} else {
  console.log("\n✅ All functions synced perfectly");
  Deno.exit(0);
}
