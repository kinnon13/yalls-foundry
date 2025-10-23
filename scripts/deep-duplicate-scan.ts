#!/usr/bin/env -S deno run -A
// Deep Duplicate Analyzer v3 – Role + Feature Aware

import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

const ROLE_PREFIXES = [
  "super-andy-",
  "andy-",
  "rocker-admin-",
  "admin-rocker-",
  "rocker-",
  "admin-",
  "bootstrap-",
  "ai_",
];

const SUFFIXES = [
  "router",
  "bridge",
  "webhook",
  "worker",
  "cron",
  "tick",
  "repo",
  "site",
  "fetch",
  "system",
  "os",
  "twiml",
];

const SYNONYMS: Record<string, string> = {
  "voice-session": "voice",
  "voice-call": "voice",
  "sms": "messaging",
  "sms-webhook": "messaging",
  "whatsapp-webhook": "messaging",
  "suggest-post": "suggest",
  "suggestion": "suggest",
  "reembed": "embed",
  "reembed-all": "embed",
  "generate-embeddings": "embed",
  "generate-suggestions": "suggest",
  "ingest-upload": "ingest",
  "ingest-paste": "ingest",
  "auto-audit": "audit",
  "audit-system": "audit",
  "nightly-gap-scan": "schedule",
  "daily-tick": "schedule",
  "process-mail-outbox": "mail",
  "process-mail-inbox": "mail",
  "kb-item": "kb",
  "kb-related": "kb",
  "kb-ingest": "kb",
  "feed-api": "feed",
  "ai-rank-search": "search",
  "ai-curate-feed": "feed",
};

function normalizeFeature(raw: string): string {
  let name = raw.toLowerCase().replace(/_/g, "-");

  for (const prefix of ROLE_PREFIXES) {
    if (name.startsWith(prefix)) name = name.replace(prefix, "");
  }

  for (const suf of SUFFIXES) {
    name = name.replace(new RegExp(`-${suf}\\b`, "g"), "");
  }

  // Plural → singular heuristic
  name = name
    .replace(/\btasks\b/g, "task")
    .replace(/\bmemories\b/g, "memory")
    .replace(/\bnotes\b/g, "note")
    .replace(/\bentities\b/g, "entity")
    .replace(/\bmessages\b/g, "message");

  // Apply synonyms
  for (const [k, v] of Object.entries(SYNONYMS)) {
    if (name === k || name.startsWith(k + "-")) {
      name = name.replace(k, v);
    }
  }

  return name.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function detectRole(name: string): string {
  if (name.startsWith("super-andy-")) return "super_andy";
  if (name.startsWith("andy-")) return "andy";
  if (name.startsWith("rocker-admin-") || name.startsWith("admin-rocker-"))
    return "rocker_admin";
  if (name.startsWith("rocker-")) return "rocker_user";
  if (name.startsWith("admin-") || name.startsWith("bootstrap-"))
    return "system_admin";
  return "uncategorized";
}

if (!(await exists(CONFIG_PATH))) {
  console.error("❌ config.toml not found");
  Deno.exit(1);
}

const configText = await Deno.readTextFile(CONFIG_PATH);
const config = parse(configText) as Record<string, any>;

const configFuncs = Object.keys(config)
  .filter((k) => k.startsWith("functions.") && !k.endsWith(".cron"))
  .map((k) => k.replace("functions.", ""));

console.log("🔍 DEEP DUPLICATION & FEATURE OVERLAP SCAN\n");
console.log("=".repeat(80));

const featureMap = new Map<
  string,
  { roles: Set<string>; functions: string[] }
>();

for (const func of configFuncs) {
  const feature = normalizeFeature(func);
  const role = detectRole(func);
  if (!featureMap.has(feature))
    featureMap.set(feature, { roles: new Set(), functions: [] });
  const entry = featureMap.get(feature)!;
  entry.roles.add(role);
  entry.functions.push(func);
}

const duplicates: string[] = [];
const multiRole: string[] = [];

for (const [feature, data] of featureMap.entries()) {
  if (data.functions.length > 1) duplicates.push(feature);
  if (data.roles.size > 1) multiRole.push(feature);
}

console.log(`📦 Total functions analyzed: ${configFuncs.length}`);
console.log(`📋 Unique features detected: ${featureMap.size}`);
console.log(`⚠️  Potential duplicate families: ${duplicates.length}`);
console.log(`🌐 Multi-role overlaps needing routers: ${multiRole.length}\n`);

if (duplicates.length) {
  console.log("🧩 DUPLICATE / VARIANT FAMILIES:\n");
  for (const f of duplicates) {
    const d = featureMap.get(f)!;
    console.log(`• ${f}: ${d.functions.join(", ")}`);
  }
}

if (multiRole.length) {
  console.log("\n🎭 MULTI-ROLE SHARED FEATURES:\n");
  for (const f of multiRole) {
    const d = featureMap.get(f)!;
    console.log(`• ${f}: roles = ${Array.from(d.roles).join(", ")} → ${d.functions.join(", ")}`);
    if (d.roles.size > 1) console.log(`  💡 Recommend: router-${f}`);
  }
}

await Deno.writeTextFile(
  "scripts/deep-duplicate-results.json",
  JSON.stringify(
    {
      timestamp: new Date().toISOString(),
      summary: {
        totalFunctions: configFuncs.length,
        uniqueFeatures: featureMap.size,
        duplicateFamilies: duplicates.length,
        multiRoleFeatures: multiRole.length,
      },
      duplicates,
      multiRole,
      features: Object.fromEntries(
        Array.from(featureMap.entries()).map(([f, d]) => [
          f,
          { roles: Array.from(d.roles), functions: d.functions },
        ])
      ),
    },
    null,
    2
  )
);

console.log("\n💾 Results saved → scripts/deep-duplicate-results.json\n");
