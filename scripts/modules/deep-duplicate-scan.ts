#!/usr/bin/env -S deno run -A
// Deep duplicate function analyzer with auto-router generation
import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, readText, writeJSON, ensureDir, FUNCS_DIR, AUDIT_DIR, CONFIG_PATH, getFix, now } from "./_utils.ts";

const FIX = getFix();
await ensureDir(AUDIT_DIR);

const ROLE_PREFIXES = ["super-andy-", "andy-", "rocker-admin-", "admin-rocker-", "rocker-", "admin-", "bootstrap-", "ai_"];
const SUFFIXES = ["router", "bridge", "webhook", "worker", "cron", "tick", "repo", "site", "fetch", "system", "os", "twiml"];
const SYNONYMS: Record<string, string> = {
  "voice-session": "voice", "voice-call": "voice", "sms": "messaging", "sms-webhook": "messaging",
  "whatsapp-webhook": "messaging", "suggest-post": "suggest", "suggestion": "suggest",
  "reembed": "embed", "reembed-all": "embed", "generate-embeddings": "embed",
  "generate-suggestions": "suggest", "ingest-upload": "ingest", "ingest-paste": "ingest",
  "auto-audit": "audit", "audit-system": "audit", "nightly-gap-scan": "schedule",
  "daily-tick": "schedule", "process-mail-outbox": "mail", "process-mail-inbox": "mail",
  "kb-item": "kb", "kb-related": "kb", "kb-ingest": "kb", "feed-api": "feed",
  "ai-rank-search": "search", "ai-curate-feed": "feed"
};

function normalizeFeature(raw: string): string {
  let name = raw.toLowerCase().replace(/_/g, "-");
  for (const p of ROLE_PREFIXES) if (name.startsWith(p)) name = name.replace(p, "");
  for (const s of SUFFIXES) name = name.replace(new RegExp(`-${s}\\b`, "g"), "");
  name = name.replace(/\btasks\b/g, "task").replace(/\bmemories\b/g, "memory")
    .replace(/\bnotes\b/g, "note").replace(/\bentities\b/g, "entity").replace(/\bmessages\b/g, "message");
  for (const [k, v] of Object.entries(SYNONYMS)) {
    if (name === k || name.startsWith(k + "-")) name = name.replace(k, v);
  }
  return name.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function detectRole(name: string): string {
  if (name.startsWith("super-andy-")) return "super_andy";
  if (name.startsWith("andy-")) return "andy";
  if (name.startsWith("rocker-admin-") || name.startsWith("admin-rocker-")) return "rocker_admin";
  if (name.startsWith("rocker-")) return "rocker_user";
  if (name.startsWith("admin-") || name.startsWith("bootstrap-")) return "system_admin";
  return "uncategorized";
}

if (!(await exists(CONFIG_PATH))) {
  console.log("⚠️  config.toml missing; skipping.");
  Deno.exit(0);
}

const cfg = parse(await readText(CONFIG_PATH)) as Record<string, any>;
const functions = Object.keys(cfg).filter(k => k.startsWith("functions.") && !k.endsWith(".cron"))
  .map(k => k.replace("functions.", ""));

const featureMap = new Map<string, { roles: Set<string>; functions: string[] }>();
for (const fn of functions) {
  const feature = normalizeFeature(fn);
  const role = detectRole(fn);
  if (!featureMap.has(feature)) {
    featureMap.set(feature, { roles: new Set(), functions: [] });
  }
  const entry = featureMap.get(feature)!;
  entry.roles.add(role);
  entry.functions.push(fn);
}

const duplicateFamilies = [...featureMap.entries()].filter(([_, d]) => d.functions.length > 1).map(([k]) => k);
const multiRoleFeatures = [...featureMap.entries()].filter(([_, d]) => d.roles.size > 1).map(([k]) => k);

const report = {
  timestamp: now(),
  summary: {
    totalFunctions: functions.length,
    uniqueFeatures: featureMap.size,
    duplicateFamilies: duplicateFamilies.length,
    multiRoleFeatures: multiRoleFeatures.length
  },
  duplicateFamilies,
  multiRoleFeatures,
  features: Object.fromEntries([...featureMap.entries()].map(([f, d]) => 
    [f, { roles: [...d.roles], functions: d.functions }]
  )),
  action: FIX && multiRoleFeatures.length > 0 ? "routers_created" : "scan_only"
};

await writeJSON(`${AUDIT_DIR}/deep-duplicates.json`, report);

console.log(`📊 ${duplicateFamilies.length} duplicate families, ${multiRoleFeatures.length} multi-role features`);

if (!FIX || multiRoleFeatures.length === 0) {
  if (multiRoleFeatures.length > 0) {
    console.log(`ℹ️  Run with --fix to auto-generate ${multiRoleFeatures.length} router(s)`);
  }
  Deno.exit(0);
}

// Auto-generate routers
let created = 0;
for (const feature of multiRoleFeatures) {
  const routerName = `router-${feature}`;
  const dir = `${FUNCS_DIR}/${routerName}`;
  const indexPath = `${dir}/index.ts`;
  
  try {
    await ensureDir(dir);
    if (await exists(indexPath)) continue;
    
    const code = `// Auto-generated router for feature "${feature}"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  
  const body = await req.json().catch(() => ({}));
  const role = body.role ?? 'rocker_user';
  
  const targets: Record<string, string> = {
    super_andy: 'andy-${feature}',
    andy: 'andy-${feature}',
    rocker_admin: 'rocker-admin-${feature}',
    rocker_user: 'rocker-${feature}',
    system_admin: 'admin-${feature}'
  };
  
  const target = targets[role];
  if (!target) {
    return new Response(
      JSON.stringify({ error: 'No target for role: ' + role }), 
      { headers: { ...cors, 'Content-Type': 'application/json' }, status: 404 }
    );
  }
  
  const url = \`\${Deno.env.get('SUPABASE_URL')}/functions/v1/\${target}\`;
  const auth = req.headers.get('Authorization') || 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': auth },
    body: JSON.stringify(body)
  });
  
  const data = await resp.text();
  return new Response(data, {
    headers: { ...cors, 'Content-Type': resp.headers.get('Content-Type') || 'application/json' },
    status: resp.status
  });
});`;
    
    await Deno.writeTextFile(indexPath, code);
    created++;
  } catch (e) {
    console.error(`❌ Failed to create router ${routerName}:`, e);
  }
}

console.log(`✅ Created ${created}/${multiRoleFeatures.length} router(s)`);
