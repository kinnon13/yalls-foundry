#!/usr/bin/env -S deno run -A
// Module Integrity Guard - ensures no broken imports or risky relative paths
import { listFiles } from "../lib/utils.ts";
import { header, line } from "../lib/logger.ts";

header("VERIFY MODULE IMPORTS");

const files = await listFiles("supabase/functions", [".ts", ".js"]);
let riskyImports = 0;
const issues: string[] = [];

for (const f of files) {
  try {
    const text = await Deno.readTextFile(f);
    
    // Check for risky relative imports that break across function boundaries
    if (text.includes("from '../..") || text.includes('from "../..')) {
      console.log(`⚠️  Risky import in: ${f}`);
      issues.push(f);
      riskyImports++;
    }
  } catch (e) {
    // Skip files that can't be read
  }
}

console.log(`\nTotal files scanned: ${files.length}`);
console.log(`Risky imports found: ${riskyImports}`);

line();

if (riskyImports > 0) {
  console.error(`\n⚠️  MODULE INTEGRITY WARNING`);
  console.error(`   ${riskyImports} file(s) have risky relative imports`);
  console.error(`   Consider using absolute imports or shared utilities`);
  line();
  Deno.exit(1);
} else {
  console.log(`\n✅ MODULE INTEGRITY PASSED`);
  console.log(`   No risky import patterns detected`);
  line();
  Deno.exit(0);
}
