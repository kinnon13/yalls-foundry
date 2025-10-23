#!/usr/bin/env -S deno run -A
// Dead Code Scanner - detects unused exports and orphaned modules
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const SRC_DIR = "src";
const FUNCS_DIR = "supabase/functions";
const AUDIT_DIR = "scripts/audit";
const IGNORES = ["node_modules", "test", "mock", ".test.", ".spec."];

await ensureDir(AUDIT_DIR);

async function collectUsedSymbols(): Promise<Set<string>> {
  const used = new Set<string>();
  
  if (!(await exists(SRC_DIR))) {
    console.log("⚠️  src directory not found");
    return used;
  }
  
  for await (const entry of walk(SRC_DIR, { exts: [".ts", ".tsx", ".js", ".jsx"], includeDirs: false })) {
    if (IGNORES.some((ignore) => entry.path.includes(ignore))) continue;
    
    try {
      const content = await Deno.readTextFile(entry.path);
      
      // Match function/class names being used
      for (const match of content.matchAll(/\b([A-Z][A-Za-z0-9_]+)\b/g)) {
        used.add(match[1]);
      }
      
      // Match function calls
      for (const match of content.matchAll(/\b([a-z][A-Za-z0-9_]+)\s*\(/g)) {
        used.add(match[1]);
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }
  
  return used;
}

async function collectDefinedSymbols(): Promise<Map<string, string>> {
  const definitions = new Map<string, string>();
  
  if (!(await exists(FUNCS_DIR))) {
    console.log("⚠️  functions directory not found");
    return definitions;
  }
  
  for await (const entry of walk(FUNCS_DIR, { exts: [".ts", ".js"], includeDirs: false })) {
    if (entry.name.includes("_shared")) continue;
    
    try {
      const content = await Deno.readTextFile(entry.path);
      
      // Match exported functions
      for (const match of content.matchAll(/export\s+(?:async\s+)?function\s+([a-zA-Z0-9_]+)/g)) {
        definitions.set(match[1], entry.path);
      }
      
      // Match exported constants/classes
      for (const match of content.matchAll(/export\s+(?:const|class)\s+([a-zA-Z0-9_]+)/g)) {
        definitions.set(match[1], entry.path);
      }
    } catch (e) {
      // Skip files that can't be read
    }
  }
  
  return definitions;
}

console.log("🧠 Scanning for unused exports and dead code...\n");

const usedSymbols = await collectUsedSymbols();
const definedSymbols = await collectDefinedSymbols();

console.log(`Found ${usedSymbols.size} used symbols`);
console.log(`Found ${definedSymbols.size} defined exports`);

const deadExports: Array<{ symbol: string; file: string }> = [];
for (const [symbol, file] of definedSymbols.entries()) {
  if (!usedSymbols.has(symbol)) {
    deadExports.push({ symbol, file });
  }
}

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalUsed: usedSymbols.size,
    totalDefined: definedSymbols.size,
    deadExports: deadExports.length
  },
  deadExports
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/dead-code-results.json`,
  JSON.stringify(report, null, 2)
);

console.log(`\n${"=".repeat(80)}`);
if (deadExports.length > 0) {
  console.log(`⚠️  Found ${deadExports.length} potentially unused export(s):`);
  deadExports.forEach(({ symbol, file }) => {
    console.log(`   • ${symbol} in ${file}`);
  });
  console.log(`\nℹ️  Review these exports - they may be legitimately unused or need cleanup`);
} else {
  console.log(`✅ No unused exports detected`);
}
console.log(`${"=".repeat(80)}\n`);
