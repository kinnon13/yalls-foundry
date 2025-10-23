#!/usr/bin/env -S deno run -A
// Audit and normalize verify_jwt settings
import { parse, stringify } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, readText, writeText, writeJSON, CONFIG_PATH, AUDIT_DIR, getFix, now, ensureDir } from "./_utils.ts";

const FIX = getFix();
await ensureDir(AUDIT_DIR);

if (!(await exists(CONFIG_PATH))) {
  console.log("⚠️  config.toml missing; skipping.");
  Deno.exit(0);
}

const cfg = parse(await readText(CONFIG_PATH)) as Record<string, any>;
const entries = Object.keys(cfg).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"));

// Known public endpoints (verify_jwt should be false)
const PUBLIC_ENDPOINTS = [
  "stripe-webhook", "twilio-webhook", "email-inbound", "process-inbound-email",
  "health-liveness", "health-readiness", "ai_health", "feed-api", "rocker-sms-webhook"
];

const changes: any[] = [];
for (const key of entries) {
  const name = key.replace("functions.", "");
  const shouldBePublic = PUBLIC_ENDPOINTS.includes(name);
  const desiredValue = !shouldBePublic; // true for private, false for public
  const currentValue = cfg[key]?.verify_jwt;
  
  if (currentValue !== desiredValue) {
    changes.push({
      function: name,
      from: currentValue,
      to: desiredValue,
      reason: shouldBePublic ? "public endpoint" : "secure by default"
    });
    
    if (FIX) {
      if (!cfg[key]) cfg[key] = {};
      cfg[key].verify_jwt = desiredValue;
    }
  }
}

const report = {
  timestamp: now(),
  changes,
  totalFunctions: entries.length,
  action: FIX && changes.length > 0 ? "normalized" : "scan_only"
};

await writeJSON(`${AUDIT_DIR}/rls-policies.json`, report);

if (FIX && changes.length > 0) {
  await writeText(CONFIG_PATH, stringify(cfg));
  console.log(`✅ Normalized verify_jwt for ${changes.length} function(s)`);
} else if (changes.length > 0) {
  console.log(`ℹ️  Found ${changes.length} function(s) with incorrect verify_jwt (run with --fix)`);
} else {
  console.log(`✅ All ${entries.length} functions have correct verify_jwt settings`);
}
