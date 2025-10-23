// deno run -A scripts/sync-supabase-config.ts
// Purpose: Normalize supabase/config.toml
// - Preserves ALL existing functions and their verify_jwt values
// - Adds missing folders with default verify_jwt = true
// - Removes duplicate entries ONLY (e.g., stripe_webhook vs stripe-webhook)

import { parse as parseToml, stringify as stringifyToml } from "https://deno.land/std@0.224.0/toml/mod.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

type FnBlock = { verify_jwt?: boolean; [k: string]: unknown };
type TomlRoot = {
  project_id?: string;
  functions?: { verify_jwt?: boolean };
  [k: string]: unknown;
};

function isFnKey(k: string): boolean {
  return k.startsWith("functions.") && !k.includes(".cron");
}

function fnNameFromKey(k: string): string {
  return k.replace(/^functions\./, "");
}

// Normalize name preference: prefer hyphens over underscores
function normalizeName(name: string): string {
  if (name === "stripe_webhook") return "stripe-webhook";
  if (name === "twilio_webhook") return "twilio-webhook";
  return name;
}

function keyFor(name: string) {
  return `functions.${name}`;
}

console.log("📊 Analyzing supabase/config.toml vs actual function folders...\n");

const configRaw = await Deno.readTextFile(CONFIG_PATH);
const config = parseToml(configRaw) as TomlRoot;

// Collect existing fn entries + verify flags
const existingFnEntries = new Map<string, FnBlock>();
const duplicates = new Map<string, string[]>();

for (const k of Object.keys(config)) {
  if (!isFnKey(k)) continue;
  const rawName = fnNameFromKey(k);
  const normName = normalizeName(rawName);
  const blk = (config as any)[k] as FnBlock;

  if (!duplicates.has(normName)) {
    duplicates.set(normName, []);
  }
  duplicates.get(normName)!.push(rawName);

  // Keep the last normalized occurrence
  existingFnEntries.set(normName, { verify_jwt: blk?.verify_jwt ?? true });
}

// List actual function folders
const actual: string[] = [];
for await (const e of Deno.readDir(FUNCS_DIR)) {
  if (e.isDirectory) actual.push(e.name);
}
actual.sort();

// Detect orphans (on disk, not in config)
const configNames = [...existingFnEntries.keys()].sort();
const orphans = actual.filter(n => !configNames.includes(n));

// Find real duplicates (multiple entries for same normalized name)
const realDuplicates = Array.from(duplicates.entries())
  .filter(([_, variants]) => variants.length > 1)
  .map(([normName, variants]) => ({ normName, variants }));

// Prepare new TOML object: copy non-function keys as-is
const next: Record<string, unknown> = {};
for (const [k, v] of Object.entries(config)) {
  if (!k.startsWith("functions.") || k.endsWith(".cron")) {
    next[k] = v;
  }
}

// Rebuild function tables - KEEP ALL EXISTING + ADD NEW FOLDERS
const kept: string[] = [];
const added: string[] = [];
const allFunctions = new Set([...configNames, ...actual]);

for (const name of Array.from(allFunctions).sort()) {
  const prev = existingFnEntries.get(name);
  
  if (prev) {
    kept.push(name);
  } else {
    added.push(name);
  }
  
  const verify = prev?.verify_jwt ?? true;
  next[keyFor(name)] = { verify_jwt: verify };
}

// Keep ALL cron schedules intact (even for functions without folders)
for (const [k, v] of Object.entries(config)) {
  if (k.startsWith("functions.") && k.endsWith(".cron")) {
    const baseName = fnNameFromKey(k.replace(/\.cron$/, ""));
    const normBase = normalizeName(baseName);
    // Keep cron if the function is in our preserved list
    if (allFunctions.has(normBase)) {
      next[k] = v;
    }
  }
}

// Print report
console.log("=== 📁 PRESERVED (all existing functions kept) ===");
console.log(kept.length ? kept.join("\n") : "(none)");
console.log(`\nTotal: ${kept.length}\n`);

console.log("=== ➕ ADDED (new folders added to config) ===");
console.log(added.length ? added.join("\n") : "(none)");
console.log(`\nTotal: ${added.length}\n`);

console.log("=== 🔄 NORMALIZED DUPLICATES ===");
if (realDuplicates.length) {
  realDuplicates.forEach(({ normName, variants }) => {
    console.log(`${variants.join(", ")} → ${normName}`);
  });
} else {
  console.log("(none)");
}
console.log(`\nTotal: ${realDuplicates.length}\n`);

// Write back
const outToml = stringifyToml(next as any);
await Deno.writeTextFile(CONFIG_PATH, outToml);

console.log("✅ supabase/config.toml normalized to match folders.");
console.log("\nNext steps:");
console.log("  1. Review changes: git diff supabase/config.toml");
console.log("  2. Commit: git add -A && git commit -m 'chore: normalize supabase functions'");
console.log("  3. Deploy: supabase functions deploy --all");
