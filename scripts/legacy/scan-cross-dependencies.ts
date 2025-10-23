#!/usr/bin/env -S deno run -A
// 🔍 Scan for cross-category dependencies and duplicates
// Detects when functions call other category functions directly

import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

// Define function categories
const CATEGORIES = {
  andy: /^andy-/,
  rocker: /^rocker-/,
  business: /^(business-|promotion-|entity-|preview-pay)/,
  commerce: /^(stripe|commission|create-checkout)/,
  admin: /^(admin-|bootstrap-super|ai_admin)/,
  ctm: /^ctm_/,
  mdr: /^mdr_/,
  system: /^(health-|ai_health|ai_eventbus|ai_control|watchdog|cron_|metrics_|dlq_)/,
  content: /^(kb-|doc-|moderate-|generate-preview|upload-media|save-post|unsave-post|reshare-post|recall-content|feed-api|auto-pin)/,
  communication: /^(email-|process-inbound|twilio|summarize-thread|chat-store)/,
  consent: /^(consent-|delete-account)/,
  automation: /^(auto-sync|process-mail|generate-embeddings|process-jobs|nightly-)/,
  learning: /^(aggregate-learnings|analyze-|apply-deltas|generate-suggestions|feedback-rate|self_improve|perceive_|verify_output|model_router|red_team)/,
  safety: /^(safety_|circuit_breaker)/,
  super: /^super-andy/,
};

interface CrossDependency {
  caller: string;
  callerCategory: string;
  target: string;
  targetCategory: string;
  file: string;
  line: string;
  type: 'import' | 'fetch';
}

interface Duplicate {
  normalized: string;
  variants: string[];
  hasFolder: boolean[];
}

function categorize(funcName: string): string {
  for (const [category, pattern] of Object.entries(CATEGORIES)) {
    if (pattern.test(funcName)) return category;
  }
  return 'uncategorized';
}

function normalize(name: string): string {
  return name.replace(/_/g, '-');
}

async function scanFunctionForCrossCalls(funcName: string): Promise<CrossDependency[]> {
  const deps: CrossDependency[] = [];
  const funcPath = `${FUNCS_DIR}/${funcName}`;
  
  if (!(await exists(funcPath))) return deps;
  
  const callerCategory = categorize(funcName);
  
  try {
    for await (const entry of walk(funcPath, { exts: [".ts", ".js"] })) {
      if (!entry.isFile) continue;
      
      const content = await Deno.readTextFile(entry.path);
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for imports from other functions
        const importMatch = line.match(/import.*from\s+['"]\.\.\/([^\/'"]+)/);
        if (importMatch) {
          const target = importMatch[1];
          const targetCategory = categorize(target);
          
          if (targetCategory !== callerCategory && targetCategory !== 'uncategorized') {
            deps.push({
              caller: funcName,
              callerCategory,
              target,
              targetCategory,
              file: entry.path,
              line: line.trim(),
              type: 'import'
            });
          }
        }
        
        // Check for fetch calls to other functions
        const fetchMatch = line.match(/functions\/v1\/([a-z0-9_-]+)/);
        if (fetchMatch) {
          const target = fetchMatch[1];
          const targetCategory = categorize(target);
          
          if (target !== funcName && targetCategory !== callerCategory && targetCategory !== 'uncategorized') {
            deps.push({
              caller: funcName,
              callerCategory,
              target,
              targetCategory,
              file: entry.path,
              line: line.trim(),
              type: 'fetch'
            });
          }
        }
      }
    }
  } catch (e) {
    console.error(`  ⚠️  Error scanning ${funcName}: ${e.message}`);
  }
  
  return deps;
}

console.log("🔍 SCANNING FOR CROSS-CATEGORY DEPENDENCIES & DUPLICATES\n");
console.log("=".repeat(80));

// Read config
const configText = await Deno.readTextFile(CONFIG_PATH);
const config = parse(configText) as Record<string, any>;

const configFuncs = Object.keys(config)
  .filter(k => k.startsWith("functions.") && !k.endsWith(".cron"))
  .map(k => k.replace("functions.", ""));

// Get actual folders
const folders: string[] = [];
for await (const entry of Deno.readDir(FUNCS_DIR)) {
  if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "_shared") {
    folders.push(entry.name);
  }
}

// Find duplicates
console.log("\n📋 SCANNING FOR DUPLICATES...\n");

const normalizedMap = new Map<string, string[]>();
for (const name of configFuncs) {
  const norm = normalize(name);
  if (!normalizedMap.has(norm)) {
    normalizedMap.set(norm, []);
  }
  normalizedMap.get(norm)!.push(name);
}

const duplicates: Duplicate[] = [];
for (const [norm, variants] of normalizedMap.entries()) {
  if (variants.length > 1) {
    duplicates.push({
      normalized: norm,
      variants,
      hasFolder: variants.map(v => folders.includes(v))
    });
  }
}

if (duplicates.length > 0) {
  console.log("⚠️  DUPLICATE FUNCTION ENTRIES DETECTED:\n");
  for (const dup of duplicates) {
    console.log(`  ${dup.normalized}:`);
    for (let i = 0; i < dup.variants.length; i++) {
      const variant = dup.variants[i];
      const hasFolder = dup.hasFolder[i] ? "✅ has folder" : "👻 ghost";
      console.log(`    - ${variant} (${hasFolder})`);
    }
    console.log("");
  }
  console.log(`Total duplicates: ${duplicates.length}\n`);
} else {
  console.log("✅ No duplicates found\n");
}

// Scan for cross-category dependencies
console.log("=".repeat(80));
console.log("\n🔗 SCANNING FOR CROSS-CATEGORY DEPENDENCIES...\n");

const allDeps: CrossDependency[] = [];
let scanned = 0;

for (const funcName of folders) {
  const deps = await scanFunctionForCrossCalls(funcName);
  allDeps.push(...deps);
  scanned++;
  
  if (scanned % 20 === 0) {
    console.log(`  Scanned ${scanned}/${folders.length} functions...`);
  }
}

console.log(`\n✅ Scanned all ${folders.length} function folders\n`);

if (allDeps.length > 0) {
  console.log("⚠️  CROSS-CATEGORY DEPENDENCIES DETECTED:\n");
  
  // Group by caller
  const grouped = new Map<string, CrossDependency[]>();
  for (const dep of allDeps) {
    if (!grouped.has(dep.caller)) {
      grouped.set(dep.caller, []);
    }
    grouped.get(dep.caller)!.push(dep);
  }
  
  for (const [caller, deps] of grouped.entries()) {
    const category = deps[0].callerCategory;
    console.log(`  ${caller} (${category}):`);
    for (const dep of deps) {
      console.log(`    → calls ${dep.target} (${dep.targetCategory}) via ${dep.type}`);
      console.log(`      ${dep.file.replace(FUNCS_DIR + '/', '')}`);
    }
    console.log("");
  }
  
  console.log(`Total cross-category calls: ${allDeps.length}\n`);
} else {
  console.log("✅ No cross-category dependencies detected\n");
}

// Generate bridge recommendations
if (allDeps.length > 0) {
  console.log("=".repeat(80));
  console.log("\n💡 RECOMMENDED BRIDGE FUNCTIONS:\n");
  
  const bridges = new Set<string>();
  for (const dep of allDeps) {
    const bridge = `bridge-${dep.callerCategory}-${dep.targetCategory}`;
    bridges.add(bridge);
  }
  
  for (const bridge of Array.from(bridges).sort()) {
    console.log(`  - ${bridge}`);
  }
  
  console.log(`\nTotal bridges needed: ${bridges.size}\n`);
}

// Save results
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFunctions: folders.length,
    duplicates: duplicates.length,
    crossDependencies: allDeps.length,
    bridgesNeeded: allDeps.length > 0 ? new Set(allDeps.map(d => `bridge-${d.callerCategory}-${d.targetCategory}`)).size : 0
  },
  duplicates,
  crossDependencies: allDeps,
  bridgeRecommendations: allDeps.length > 0 ? Array.from(new Set(allDeps.map(d => `bridge-${d.callerCategory}-${d.targetCategory}`))) : []
};

await Deno.writeTextFile(
  "scripts/dependency-scan-results.json",
  JSON.stringify(results, null, 2)
);

console.log("=".repeat(80));
console.log("\n💾 Saved detailed results to: scripts/dependency-scan-results.json");
console.log("\n📊 SUMMARY:");
console.log(`  Total functions scanned: ${folders.length}`);
console.log(`  Duplicates found: ${duplicates.length}`);
console.log(`  Cross-category calls: ${allDeps.length}`);
console.log(`  Bridges recommended: ${results.summary.bridgesNeeded}`);
console.log("");
