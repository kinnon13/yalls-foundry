#!/usr/bin/env -S deno run -A
import { parse, stringify } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, readText, writeText, writeJSON, CONFIG_PATH, AUDIT_DIR } from "./_utils.ts";

const FIX = Deno.args.includes("--fix");
if (!(await exists(CONFIG_PATH))) Deno.exit(0);

const cfg = parse(await readText(CONFIG_PATH)) as Record<string, any>;
const entries = Object.keys(cfg).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));

type Row = { key: string; verify_jwt?: boolean; public?: boolean };
const rows: Row[] = entries.map(k => ({ key: k, verify_jwt: cfg[k]?.verify_jwt }));

// Strategy: default to secure (verify_jwt=true) EXCEPT known public webhook/health endpoints
const MAKE_PUBLIC = [
  "stripe-webhook","twilio-webhook","email-inbound","process-inbound-email",
  "health-liveness","health-readiness","ai_health","feed-api","rocker-sms-webhook"
];

const changes: any[] = [];
for (const r of rows) {
  const name = r.key.replace("functions.","");
  const shouldPublic = MAKE_PUBLIC.includes(name);
  const desired = shouldPublic ? false : true;
  if (r.verify_jwt !== desired) {
    changes.push({ name, from: r.verify_jwt, to: desired });
    if (FIX) cfg[r.key].verify_jwt = desired;
  }
}

await writeJSON(`${AUDIT_DIR}/rls-audit.json`, { timestamp: Date.now(), changes });

if (FIX && changes.length) {
  await writeText(CONFIG_PATH, stringify(cfg));
  console.log(`✅ RLS/verify_jwt normalized for ${changes.length} function(s).`);
} else {
  console.log(`ℹ️ RLS/verify_jwt changes needed: ${changes.length} (run with --fix).`);
}
