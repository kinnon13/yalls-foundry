#!/usr/bin/env -S deno run -A
// Structure Guard - ensures all critical audit files are present
import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { header, line } from "../modules/logger.ts";

header("VERIFY STRUCTURE");

const required = [
  "src",
  "supabase/functions",
  "scripts/scan",
  "scripts/audit",
  "scripts/health",
  "scripts/guard",
  "scripts/modules",
  "scripts/master-elon-scan.ts",
];

let missing = 0;

for (const dir of required) {
  const ok = await exists(dir);
  console.log(`${ok ? "✅" : "❌"} ${dir}`);
  if (!ok) missing++;
}

line();

if (missing > 0) {
  console.error(`\n❌ STRUCTURE GUARD FAILED`);
  console.error(`   ${missing} critical path(s) missing`);
  console.error(`   Cannot proceed - architectural integrity compromised`);
  line();
  Deno.exit(1);
} else {
  console.log(`\n✅ STRUCTURE GUARD PASSED`);
  console.log(`   All ${required.length} core paths verified`);
  console.log(`   Architecture integrity intact`);
  line();
  Deno.exit(0);
}
