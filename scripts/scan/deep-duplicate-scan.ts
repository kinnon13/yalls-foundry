#!/usr/bin/env -S deno run -A
// Deep Duplicate Analyzer v4 – Kernel-Aware

import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, walk } from "https://deno.land/std@0.223.0/fs/mod.ts";

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

async function scanFunctionImports(funcName: string): Promise<{
  sharedImports: string[];
  functionCalls: string[];
}> {
  const funcPath = `${FUNCS_DIR}/${funcName}`;
  if (!(await exists(funcPath))) {
    return { sharedImports: [], functionCalls: [] };
  }

  const sharedImports = new Set<string>();
  const functionCalls = new Set<string>();

  try {
    for await (const entry of walk(funcPath, { exts: [".ts", ".js", ".tsx", ".jsx"] })) {
      if (entry.isFile) {
        const content = await Deno.readTextFile(entry.path);
        
        // Find _shared imports
        const sharedMatches = content.matchAll(/from\s+['"](\.\.\/)*_shared\/([^'"]+)['"]/g);
        for (const match of sharedMatches) {
          sharedImports.add(match[2]);
        }
        
        // Find cross-function imports
        const funcMatches = content.matchAll(/from\s+['"](\.\.\/)+([^_][^'"\/]+)['"]/g);
        for (const match of funcMatches) {
          const importedFunc = match[2];
          if (importedFunc !== funcName) {
            sharedImports.add(`func:${importedFunc}`);
          }
        }
        
        // Find function invocations
        const invokeMatches = content.matchAll(/supabase\.functions\.invoke\s*\(\s*['"]([^'"]+)['"]/g);
        for (const match of invokeMatches) {
          functionCalls.add(match[1]);
        }
        
        // Find direct fetch calls
        const fetchMatches = content.matchAll(/fetch\s*\([^)]*\/functions\/v1\/([^'"\s)]+)/g);
        for (const match of fetchMatches) {
          functionCalls.add(match[1]);
        }
      }
    }
  } catch (e) {
    // Skip errors for inaccessible functions
  }

  return {
    sharedImports: Array.from(sharedImports),
    functionCalls: Array.from(functionCalls)
  };
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

console.log("🔍 KERNEL-AWARE DEEP DUPLICATION SCAN\n");
console.log("=".repeat(80));

const featureMap = new Map<
  string,
  { roles: Set<string>; functions: string[] }
>();

const kernelMap = new Map<string, Set<string>>();
const functionDeps = new Map<string, { sharedImports: string[]; functionCalls: string[] }>();

// Phase 1: Build feature map
for (const func of configFuncs) {
  const feature = normalizeFeature(func);
  const role = detectRole(func);
  if (!featureMap.has(feature))
    featureMap.set(feature, { roles: new Set(), functions: [] });
  const entry = featureMap.get(feature)!;
  entry.roles.add(role);
  entry.functions.push(func);
}

// Phase 2: Scan for kernel dependencies
console.log("\n🔬 Scanning kernel dependencies...");
for (const func of configFuncs) {
  const deps = await scanFunctionImports(func);
  functionDeps.set(func, deps);
  
  for (const kernel of deps.sharedImports) {
    if (!kernelMap.has(kernel)) kernelMap.set(kernel, new Set());
    kernelMap.get(kernel)!.add(func);
  }
}

const duplicates: string[] = [];
const multiRole: string[] = [];

for (const [feature, data] of featureMap.entries()) {
  if (data.functions.length > 1) duplicates.push(feature);
  if (data.roles.size > 1) multiRole.push(feature);
}

const sharedKernels = Array.from(kernelMap.entries())
  .filter(([_, funcs]) => funcs.size > 1)
  .sort((a, b) => b[1].size - a[1].size);

console.log(`📦 Total functions analyzed: ${configFuncs.length}`);
console.log(`📋 Unique features detected: ${featureMap.size}`);
console.log(`⚠️  Potential duplicate families: ${duplicates.length}`);
console.log(`🌐 Multi-role overlaps needing routers: ${multiRole.length}`);
console.log(`🧠 Shared kernels detected: ${sharedKernels.length}\n`);

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

if (sharedKernels.length) {
  console.log("\n🧠 SHARED KERNEL GROUPS:\n");
  for (const [kernel, funcs] of sharedKernels.slice(0, 20)) {
    console.log(`• ${kernel}: used by ${funcs.size} functions`);
    console.log(`  → ${Array.from(funcs).slice(0, 5).join(", ")}${funcs.size > 5 ? ` + ${funcs.size - 5} more` : ""}`);
  }
  if (sharedKernels.length > 20) {
    console.log(`\n  ... and ${sharedKernels.length - 20} more shared kernels`);
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
        sharedKernels: sharedKernels.length,
      },
      duplicates,
      multiRole,
      sharedKernels: sharedKernels.map(([kernel, funcs]) => ({
        kernel,
        functionCount: funcs.size,
        functions: Array.from(funcs),
      })),
      features: Object.fromEntries(
        Array.from(featureMap.entries()).map(([f, d]) => [
          f,
          { roles: Array.from(d.roles), functions: d.functions },
        ])
      ),
      dependencies: Object.fromEntries(
        Array.from(functionDeps.entries()).map(([func, deps]) => [
          func,
          {
            sharedImports: deps.sharedImports,
            functionCalls: deps.functionCalls,
          },
        ])
      ),
    },
    null,
    2
  )
);

console.log("\n💾 Results saved → scripts/deep-duplicate-results.json\n");
