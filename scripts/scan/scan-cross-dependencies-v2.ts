#!/usr/bin/env -S deno run -A
// 🔍 Cross-Dependency Scanner v2 - Role-Aware Edition
// Detects: duplicates, cross-category calls, AND multi-role feature overlap

import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

// Define role prefixes (hierarchical order)
const ROLE_PREFIXES = {
  super_andy: /^(super-andy|andy-)/,
  rocker_admin: /^(admin-rocker|rocker-admin|rocker-audit|rocker-lifecycle|rocker-monitor)/,
  rocker_user: /^rocker-/,
  system_admin: /^(bootstrap-|ai_admin|ai_control)/,
};

// Define function categories (technical grouping)
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

interface SharedFeature {
  feature: string;
  roles: { [role: string]: string[] };
  totalFunctions: number;
  needsRouter: boolean;
}

function assignRole(funcName: string): string[] {
  const roles: string[] = [];
  
  for (const [role, pattern] of Object.entries(ROLE_PREFIXES)) {
    if (pattern.test(funcName)) {
      roles.push(role);
    }
  }
  
  return roles.length > 0 ? roles : ['uncategorized'];
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

function normalizeFeature(name: string): string {
  return name
    .replace(/^(super-andy-|andy-|admin-rocker-|rocker-admin-|rocker-|admin-|bootstrap-|ai_)/, '')
    .replace(/[-_]/g, '-')
    .toLowerCase()
    .trim();
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

console.log("🔍 CROSS-DEPENDENCY SCANNER v2 - ROLE-AWARE EDITION\n");
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

// ==================== PART 1: DUPLICATES ====================
console.log("\n📋 PART 1: SCANNING FOR DUPLICATES...\n");

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

// ==================== PART 2: CROSS-CATEGORY DEPENDENCIES ====================
console.log("=".repeat(80));
console.log("\n🔗 PART 2: SCANNING FOR CROSS-CATEGORY DEPENDENCIES...\n");

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
    }
    console.log("");
  }
  
  console.log(`Total cross-category calls: ${allDeps.length}\n`);
} else {
  console.log("✅ No cross-category dependencies detected\n");
}

// ==================== PART 3: MULTI-ROLE FEATURE OVERLAP ====================
console.log("=".repeat(80));
console.log("\n🧩 PART 3: ANALYZING MULTI-ROLE FEATURE OVERLAP...\n");

const featureMap = new Map<string, { roles: Map<string, string[]>, functions: string[] }>();

for (const funcName of folders) {
  const feature = normalizeFeature(funcName);
  const roles = assignRole(funcName);
  
  if (!featureMap.has(feature)) {
    featureMap.set(feature, { roles: new Map(), functions: [] });
  }
  
  const entry = featureMap.get(feature)!;
  entry.functions.push(funcName);
  
  for (const role of roles) {
    if (!entry.roles.has(role)) {
      entry.roles.set(role, []);
    }
    entry.roles.get(role)!.push(funcName);
  }
}

// Find features used by multiple roles
const sharedFeatures: SharedFeature[] = [];

for (const [feature, data] of featureMap.entries()) {
  if (data.roles.size > 1 && feature.length > 2) { // Ignore single-char features
    const roleData: { [role: string]: string[] } = {};
    for (const [role, funcs] of data.roles.entries()) {
      roleData[role] = funcs;
    }
    
    sharedFeatures.push({
      feature,
      roles: roleData,
      totalFunctions: data.functions.length,
      needsRouter: data.roles.size >= 2
    });
  }
}

sharedFeatures.sort((a, b) => b.totalFunctions - a.totalFunctions);

if (sharedFeatures.length > 0) {
  console.log("🌟 SHARED FEATURES ACROSS ROLES DETECTED:\n");
  
  for (const sf of sharedFeatures) {
    console.log(`  Feature: "${sf.feature}" (${sf.totalFunctions} functions across ${Object.keys(sf.roles).length} roles)`);
    for (const [role, funcs] of Object.entries(sf.roles)) {
      console.log(`    ${role}:`);
      for (const func of funcs) {
        console.log(`      - ${func}`);
      }
    }
    if (sf.needsRouter) {
      console.log(`    💡 RECOMMEND: Create router-${sf.feature}`);
    }
    console.log("");
  }
  
  console.log(`Total shared features: ${sharedFeatures.length}\n`);
} else {
  console.log("✅ No multi-role feature overlap detected\n");
}

// ==================== RECOMMENDATIONS ====================
console.log("=".repeat(80));
console.log("\n💡 RECOMMENDATIONS:\n");

// Category bridges
if (allDeps.length > 0) {
  console.log("🌉 Category Bridges Needed:\n");
  const bridges = new Set<string>();
  for (const dep of allDeps) {
    const bridge = `bridge-${dep.callerCategory}-${dep.targetCategory}`;
    bridges.add(bridge);
  }
  
  for (const bridge of Array.from(bridges).sort()) {
    console.log(`  - ${bridge}`);
  }
  console.log("");
}

// Feature routers
if (sharedFeatures.length > 0) {
  console.log("🎯 Feature Routers Needed:\n");
  for (const sf of sharedFeatures.filter(f => f.needsRouter)) {
    console.log(`  - router-${sf.feature} (handles ${Object.keys(sf.roles).length} roles)`);
  }
  console.log("");
}

// Duplicate cleanup
if (duplicates.length > 0) {
  console.log("🧹 Duplicate Cleanup Required:\n");
  for (const dup of duplicates) {
    console.log(`  - Resolve: ${dup.variants.join(' vs ')}`);
  }
  console.log("");
}

// Save results
const results = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFunctions: folders.length,
    duplicates: duplicates.length,
    crossDependencies: allDeps.length,
    sharedFeatures: sharedFeatures.length,
    categoryBridgesNeeded: allDeps.length > 0 ? new Set(allDeps.map(d => `bridge-${d.callerCategory}-${d.targetCategory}`)).size : 0,
    featureRoutersNeeded: sharedFeatures.filter(f => f.needsRouter).length
  },
  duplicates,
  crossDependencies: allDeps,
  sharedFeatures,
  recommendations: {
    categoryBridges: allDeps.length > 0 ? Array.from(new Set(allDeps.map(d => `bridge-${d.callerCategory}-${d.targetCategory}`))) : [],
    featureRouters: sharedFeatures.filter(f => f.needsRouter).map(f => `router-${f.feature}`)
  }
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
console.log(`  Shared features detected: ${sharedFeatures.length}`);
console.log(`  Category bridges needed: ${results.summary.categoryBridgesNeeded}`);
console.log(`  Feature routers needed: ${results.summary.featureRoutersNeeded}`);
console.log("\n🎯 Next steps:");
console.log("  1. Review: cat scripts/dependency-scan-results.json");
console.log("  2. Generate: deno run -A scripts/generate-bridges.ts");
console.log("  3. Sync: deno run -A scripts/sync-supabase-config.ts");
console.log("");
