// deno run -A scripts/audit-functions.ts
// Complete audit of Supabase functions vs config.toml

import { parse as parseToml } from "https://deno.land/std@0.224.0/toml/mod.ts";
import { exists } from "https://deno.land/std@0.224.0/fs/exists.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

console.log("🔍 COMPLETE SUPABASE FUNCTIONS AUDIT\n");
console.log("=".repeat(80) + "\n");

// Read config
const configRaw = await Deno.readTextFile(CONFIG_PATH);
const config = parseToml(configRaw) as any;

// Extract all function entries from config
const configFunctions = new Map<string, { verify_jwt: boolean; hasCron: boolean }>();
for (const key of Object.keys(config)) {
  if (key.startsWith("functions.") && !key.endsWith(".cron")) {
    const name = key.replace("functions.", "");
    const hasCron = config[`${key}.cron`] !== undefined;
    configFunctions.set(name, {
      verify_jwt: config[key]?.verify_jwt ?? true,
      hasCron
    });
  }
}

// List all actual function folders
const actualFolders: string[] = [];
for await (const entry of Deno.readDir(FUNCS_DIR)) {
  if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "_shared") {
    actualFolders.push(entry.name);
  }
}
actualFolders.sort();

// Check for subfolders (invalid structure)
const withSubfolders: string[] = [];
for (const folder of actualFolders) {
  for await (const entry of Deno.readDir(`${FUNCS_DIR}/${folder}`)) {
    if (entry.isDirectory) {
      withSubfolders.push(`${folder}/${entry.name}`);
    }
  }
}

// Categorize functions
const categories = {
  both: [] as string[],           // In config AND has folder
  ghostInConfig: [] as string[],   // In config but NO folder
  orphanFolders: [] as string[],   // Has folder but NOT in config
  duplicates: [] as { normalized: string; variants: string[] }[]
};

// Find duplicates
const normalized = new Map<string, string[]>();
for (const name of configFunctions.keys()) {
  const norm = name.replace(/_/g, "-");
  if (!normalized.has(norm)) {
    normalized.set(norm, []);
  }
  normalized.get(norm)!.push(name);
}

for (const [norm, variants] of normalized.entries()) {
  if (variants.length > 1) {
    categories.duplicates.push({ normalized: norm, variants });
  }
}

// Categorize each function
const allNames = new Set([...configFunctions.keys(), ...actualFolders]);
for (const name of allNames) {
  const inConfig = configFunctions.has(name);
  const hasFolder = actualFolders.includes(name);
  
  if (inConfig && hasFolder) {
    categories.both.push(name);
  } else if (inConfig && !hasFolder) {
    categories.ghostInConfig.push(name);
  } else if (!inConfig && hasFolder) {
    categories.orphanFolders.push(name);
  }
}

// Sort all categories
categories.both.sort();
categories.ghostInConfig.sort();
categories.orphanFolders.sort();

// PRINT COMPLETE AUDIT REPORT
console.log("📊 SUMMARY STATISTICS");
console.log("-".repeat(80));
console.log(`Total in config.toml:     ${configFunctions.size}`);
console.log(`Total actual folders:     ${actualFolders.length}`);
console.log(`Both (healthy):           ${categories.both.length}`);
console.log(`👻 GHOSTS (config only):  ${categories.ghostInConfig.length}`);
console.log(`🔧 ORPHANS (folder only): ${categories.orphanFolders.length}`);
console.log(`⚠️  DUPLICATES:           ${categories.duplicates.length}`);
console.log(`📁 Invalid subfolders:    ${withSubfolders.length}`);
console.log("\n" + "=".repeat(80) + "\n");

// 1. ALL FUNCTIONS (BOTH CONFIG + FOLDER)
console.log("✅ HEALTHY FUNCTIONS (Both config + folder)");
console.log("-".repeat(80));
for (const name of categories.both) {
  const conf = configFunctions.get(name)!;
  const cron = conf.hasCron ? " [CRON]" : "";
  const jwt = conf.verify_jwt ? "JWT✓" : "PUBLIC";
  console.log(`  ${name.padEnd(40)} ${jwt}${cron}`);
}
console.log(`\nTotal: ${categories.both.length}\n`);

// 2. GHOST FUNCTIONS (IN CONFIG, NO FOLDER)
console.log("👻 GHOST FUNCTIONS (In config.toml but NO folder)");
console.log("-".repeat(80));
console.log("These will be RESTORED as stubs:\n");
for (const name of categories.ghostInConfig) {
  const conf = configFunctions.get(name)!;
  const cron = conf.hasCron ? " [CRON]" : "";
  const jwt = conf.verify_jwt ? "JWT✓" : "PUBLIC";
  console.log(`  ${name.padEnd(40)} ${jwt}${cron}`);
}
console.log(`\nTotal: ${categories.ghostInConfig.length}\n`);

// 3. ORPHAN FOLDERS (HAS FOLDER, NOT IN CONFIG)
console.log("🔧 ORPHAN FUNCTIONS (Folder exists but NOT in config)");
console.log("-".repeat(80));
console.log("These need config entries added:\n");
for (const name of categories.orphanFolders) {
  const hasIndex = await exists(`${FUNCS_DIR}/${name}/index.ts`);
  console.log(`  ${name.padEnd(40)} ${hasIndex ? "has index.ts" : "⚠️ missing index.ts"}`);
}
console.log(`\nTotal: ${categories.orphanFolders.length}\n`);

// 4. DUPLICATE ENTRIES
console.log("⚠️  DUPLICATE FUNCTION ENTRIES");
console.log("-".repeat(80));
if (categories.duplicates.length > 0) {
  for (const dup of categories.duplicates) {
    console.log(`  ${dup.normalized}:`);
    for (const variant of dup.variants) {
      const hasFolder = actualFolders.includes(variant);
      console.log(`    - ${variant} ${hasFolder ? "(has folder)" : "(ghost)"}`);
    }
    console.log("");
  }
} else {
  console.log("  None found\n");
}

// 5. INVALID SUBFOLDERS
console.log("📁 INVALID SUBFOLDERS (Functions should be flat)");
console.log("-".repeat(80));
if (withSubfolders.length > 0) {
  for (const path of withSubfolders) {
    console.log(`  ${path}`);
  }
  console.log(`\nTotal: ${withSubfolders.length}\n`);
} else {
  console.log("  None found - all functions are properly flat ✓\n");
}

// 6. DETAILED CONFIG BREAKDOWN
console.log("=".repeat(80));
console.log("📋 COMPLETE CONFIG.TOML FUNCTION LIST");
console.log("-".repeat(80));
const configByStatus = {
  healthy: [] as string[],
  ghost: [] as string[],
  duplicate: [] as string[]
};

for (const [name, conf] of configFunctions.entries()) {
  const hasFolder = actualFolders.includes(name);
  const isDup = categories.duplicates.some(d => d.variants.includes(name));
  
  if (isDup) {
    configByStatus.duplicate.push(name);
  } else if (hasFolder) {
    configByStatus.healthy.push(name);
  } else {
    configByStatus.ghost.push(name);
  }
}

console.log("\n✅ Healthy (has folder):");
configByStatus.healthy.sort().forEach(n => console.log(`  - ${n}`));

console.log("\n👻 Ghost (no folder):");
configByStatus.ghost.sort().forEach(n => console.log(`  - ${n}`));

console.log("\n⚠️  Duplicate entries:");
configByStatus.duplicate.sort().forEach(n => console.log(`  - ${n}`));

console.log("\n" + "=".repeat(80));
console.log("📋 COMPLETE FUNCTION FOLDER LIST");
console.log("-".repeat(80));

const foldersByStatus = {
  healthy: [] as string[],
  orphan: [] as string[]
};

for (const name of actualFolders) {
  const inConfig = configFunctions.has(name);
  if (inConfig) {
    foldersByStatus.healthy.push(name);
  } else {
    foldersByStatus.orphan.push(name);
  }
}

console.log("\n✅ Has config:");
foldersByStatus.healthy.sort().forEach(n => console.log(`  - ${n}`));

console.log("\n🔧 Missing config:");
foldersByStatus.orphan.sort().forEach(n => console.log(`  - ${n}`));

console.log("\n" + "=".repeat(80));
console.log("\n🎯 RECOMMENDED ACTIONS:");
console.log("-".repeat(80));
console.log(`1. RESTORE ${categories.ghostInConfig.length} ghost functions as stubs`);
console.log(`2. ADD ${categories.orphanFolders.length} missing config entries`);
console.log(`3. RESOLVE ${categories.duplicates.length} duplicate entries`);
console.log(`4. CLEAN ${withSubfolders.length} invalid subfolders`);
console.log("\n");

// Export JSON for scripting
const auditData = {
  summary: {
    totalConfig: configFunctions.size,
    totalFolders: actualFolders.length,
    healthy: categories.both.length,
    ghosts: categories.ghostInConfig.length,
    orphans: categories.orphanFolders.length,
    duplicates: categories.duplicates.length,
    invalidSubfolders: withSubfolders.length
  },
  categories,
  withSubfolders,
  configFunctions: Object.fromEntries(configFunctions),
  actualFolders
};

await Deno.writeTextFile(
  "scripts/audit-results.json",
  JSON.stringify(auditData, null, 2)
);

console.log("💾 Detailed audit saved to: scripts/audit-results.json\n");
