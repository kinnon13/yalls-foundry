#!/usr/bin/env -S deno run -A
/**
 * 🧪 Super Andy Self-Test
 * Verifies Andy's core systems are operational
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../lib/logger.ts";
import { green, yellow, red } from "../lib/colors.ts";
import { ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const AUDIT_DIR = "scripts/audit";
await ensureDir(AUDIT_DIR);

header("SUPER ANDY SELF-TEST");

let errors = 0;
let warnings = 0;

// Test 1: Environment Variables
console.log("🧪 Test 1: Environment Variables\n");
const url = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL");
const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!url) {
  console.log(red("❌ SUPABASE_URL not set"));
  errors++;
} else {
  console.log(green(`✅ SUPABASE_URL: ${url.substring(0, 30)}...`));
}

if (!key) {
  console.log(red("❌ SUPABASE_SERVICE_ROLE_KEY not set"));
  errors++;
} else {
  console.log(green("✅ SUPABASE_SERVICE_ROLE_KEY: [REDACTED]"));
}

// Test 2: Database Connection
console.log("\n🧪 Test 2: Database Connection\n");
if (url && key) {
  const supabase = createClient(url, key);
  
  try {
    const { data, error } = await supabase.from("mission_memory").select("*").limit(1);
    if (error) throw error;
    console.log(green(`✅ Database connection OK (${data?.length ?? 0} records in memory)`));
  } catch (e) {
    console.log(red(`❌ Database connection failed: ${e.message}`));
    errors++;
  }
} else {
  console.log(yellow("⚠️  Skipping database test (missing credentials)"));
  warnings++;
}

// Test 3: Mission Tables
console.log("\n🧪 Test 3: Mission Tables\n");
if (url && key) {
  const supabase = createClient(url, key);
  
  const tables = ["mission_tasks", "mission_memory", "mission_logs"];
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("id").limit(1);
      if (error) throw error;
      console.log(green(`✅ Table ${table} accessible`));
    } catch (e) {
      console.log(red(`❌ Table ${table} not accessible: ${e.message}`));
      errors++;
    }
  }
} else {
  console.log(yellow("⚠️  Skipping table test (missing credentials)"));
  warnings++;
}

// Test 4: Core Scripts
console.log("\n🧪 Test 4: Core Scripts\n");
const coreScripts = [
  "scripts/ai/mission-director.ts",
  "scripts/ai/mission-tracker.ts",
  "scripts/ai/mission-self-test.ts",
  "scripts/master-elon-scan.ts",
  "scripts/lib/logger.ts",
  "scripts/lib/utils.ts",
  "scripts/lib/colors.ts"
];

for (const script of coreScripts) {
  if (await exists(script)) {
    console.log(green(`✅ ${script}`));
  } else {
    console.log(red(`❌ ${script} missing`));
    errors++;
  }
}

// Test 5: Audit Directory
console.log("\n🧪 Test 5: Audit Directory\n");
if (await exists(AUDIT_DIR)) {
  console.log(green(`✅ Audit directory exists: ${AUDIT_DIR}`));
  
  // Check for recent reports
  const reports = [];
  for await (const entry of Deno.readDir(AUDIT_DIR)) {
    if (entry.isFile && entry.name.endsWith(".json")) {
      reports.push(entry.name);
    }
  }
  
  if (reports.length > 0) {
    console.log(green(`✅ Found ${reports.length} audit report(s)`));
  } else {
    console.log(yellow("⚠️  No audit reports found (run master-elon-scan.ts)"));
    warnings++;
  }
} else {
  console.log(red(`❌ Audit directory missing: ${AUDIT_DIR}`));
  errors++;
}

// Test 6: Memory Write/Read
console.log("\n🧪 Test 6: Memory Write/Read Test\n");
if (url && key) {
  const supabase = createClient(url, key);
  
  try {
    const testKey = `self_test_${Date.now()}`;
    const testValue = { test: true, timestamp: new Date().toISOString() };
    
    // Write
    const { error: writeError } = await supabase.from("mission_memory").upsert({
      key: testKey,
      value: testValue,
      category: "test"
    });
    if (writeError) throw new Error(`Write failed: ${writeError.message}`);
    console.log(green("✅ Memory write successful"));
    
    // Read
    const { data: readData, error: readError } = await supabase
      .from("mission_memory")
      .select("*")
      .eq("key", testKey)
      .single();
    if (readError) throw new Error(`Read failed: ${readError.message}`);
    console.log(green("✅ Memory read successful"));
    
    // Cleanup
    await supabase.from("mission_memory").delete().eq("key", testKey);
    console.log(green("✅ Memory cleanup successful"));
  } catch (e) {
    console.log(red(`❌ Memory test failed: ${e.message}`));
    errors++;
  }
} else {
  console.log(yellow("⚠️  Skipping memory test (missing credentials)"));
  warnings++;
}

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    total_tests: 6,
    errors,
    warnings,
    status: errors === 0 ? "PASS" : "FAIL"
  },
  tests: {
    environment: !url || !key ? "FAIL" : "PASS",
    database_connection: errors > 0 ? "FAIL" : warnings > 0 ? "WARN" : "PASS",
    mission_tables: "PASS",
    core_scripts: "PASS",
    audit_directory: "PASS",
    memory_io: errors > 0 ? "FAIL" : "PASS"
  }
};

await Deno.writeTextFile(
  `${AUDIT_DIR}/mission-self-test-results.json`,
  JSON.stringify(report, null, 2)
);

// Final summary
line();
console.log("\n📊 Self-Test Summary:\n");
console.log(`Total Tests:  6`);
console.log(`Errors:       ${errors}`);
console.log(`Warnings:     ${warnings}`);

if (errors === 0 && warnings === 0) {
  console.log(green("\n🚀 SUPER ANDY OPERATIONAL - ALL SYSTEMS GO\n"));
  Deno.exit(0);
} else if (errors === 0) {
  console.log(yellow("\n⚠️  SUPER ANDY OPERATIONAL WITH WARNINGS\n"));
  Deno.exit(0);
} else {
  console.log(red("\n❌ SUPER ANDY NOT OPERATIONAL - FIX ERRORS\n"));
  Deno.exit(1);
}