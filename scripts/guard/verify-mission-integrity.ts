#!/usr/bin/env -S deno run -A
/**
 * 🚀 Mission Integrity Verifier v2
 * ------------------------------------------------------------
 * Runs full verification, logs to both console and history file.
 * - Confirms required folders/files exist
 * - Detects unexpected or orphan scripts
 * - Performs `deno check` for syntax
 * - Saves JSON telemetry to /scripts/audit/integrity-history.json
 * - Prints concise "GO / NO-GO" status to terminal
 */

import { exists } from "https://deno.land/std@0.223.0/fs/mod.ts";
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { green, red, yellow } from "../modules/colors.ts";

const HISTORY_PATH = "scripts/audit/integrity-history.json";

const expected = {
  root: ["scripts/master-elon-scan.ts"],
  guard: [
    "verify-structure.ts",
    "verify-supabase-config.ts",
    "verify-modules.ts",
    "verify-mission-integrity.ts",
  ],
  scan: [
    "deep-duplicate-scan.ts",
    "scan-cross-dependencies-v2.ts",
    "find-dead-code.ts",
    "find-duplicate-docs.ts",
    "find-orphan-assets.ts",
  ],
  audit: [
    "audit-functions.ts",
    "sync-supabase-config.ts",
    "compile-reports.ts",
  ],
  health: ["verify-platform.ts", "ping-functions.ts"],
  ai: ["verify-rocker-integrity.ts", "auto-fix.ts"],
  admin: ["verify-admin-schema.ts"],
  modules: ["logger.ts", "utils.ts", "file-hash.ts", "colors.ts"],
};

async function verifyExpected() {
  const results: { path: string; ok: boolean }[] = [];
  for (const [dir, files] of Object.entries(expected)) {
    for (const f of files) {
      const path = dir === "root" ? f : `scripts/${dir}/${f}`;
      results.push({ path, ok: await exists(path) });
    }
  }
  return results;
}

async function findUnexpected() {
  const known = new Set<string>();
  for (const [dir, files] of Object.entries(expected)) {
    for (const f of files) known.add(dir === "root" ? f : `scripts/${dir}/${f}`);
  }

  const unexpected: string[] = [];
  for await (const e of walk("scripts", { includeDirs: false, exts: [".ts"] })) {
    if (!known.has(e.path)) unexpected.push(e.path);
  }
  return unexpected;
}

async function runTypeCheck() {
  const cmd = new Deno.Command("deno", {
    args: ["check", "scripts"],
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout, stderr } = await cmd.output();
  return {
    out: new TextDecoder().decode(stdout),
    err: new TextDecoder().decode(stderr),
  };
}

async function logHistory(entry: any) {
  let history: any[] = [];
  try {
    const text = await Deno.readTextFile(HISTORY_PATH);
    history = JSON.parse(text);
  } catch {
    // File doesn't exist yet, start fresh
  }
  history.push(entry);
  await Deno.writeTextFile(HISTORY_PATH, JSON.stringify(history, null, 2));
}

console.log("\n🛰️  Running Mission Integrity Verification...\n");

const start = Date.now();
const results = await verifyExpected();
const missing = results.filter(r => !r.ok);
const unexpected = await findUnexpected();
const { err } = await runTypeCheck();
const hasErrors = err.trim().length > 0;

for (const r of results)
  console.log(r.ok ? green(`✅ ${r.path}`) : red(`❌ ${r.path}`));

if (unexpected.length) {
  console.log(yellow("\n⚠️  Unexpected scripts:"));
  for (const u of unexpected) console.log("   •", u);
}
if (hasErrors) {
  console.log(red("\n⚠️  Type check errors:\n"), err);
}

const duration = Date.now() - start;
const summary = {
  timestamp: new Date().toISOString(),
  totals: {
    expected: results.length,
    missing: missing.length,
    unexpected: unexpected.length,
    typeErrors: hasErrors ? "YES" : "NO",
    durationMs: duration,
  },
  missing,
  unexpected,
};

await logHistory(summary);

const allClear =
  missing.length === 0 && unexpected.length === 0 && !hasErrors;

console.log("\n" + "=".repeat(80));
console.log(
  allClear
    ? green(`🚀 MISSION GO — All Systems Nominal [${duration} ms]`)
    : red(`🛑 NO-GO — Issues Detected [${duration} ms]`)
);
console.log(`📁 Logged → ${HISTORY_PATH}`);
console.log("=".repeat(80) + "\n");

Deno.exit(allClear ? 0 : 1);
