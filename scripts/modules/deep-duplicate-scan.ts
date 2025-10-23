#!/usr/bin/env -S deno run -A
import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, readText, writeJSON, ensureDir, FUNCS_DIR, AUDIT_DIR } from "./_utils.ts";

const FIX = Deno.args.includes("--fix");

const ROLE_PREFIXES = ["super-andy-","andy-","rocker-admin-","admin-rocker-","rocker-","admin-","bootstrap-","ai_"];
const SUFFIXES = ["router","bridge","webhook","worker","cron","tick","repo","site","fetch","system","os","twiml"];
const SYNONYMS: Record<string,string> = {
  "voice-session":"voice", "voice-call":"voice", "sms":"messaging", "sms-webhook":"messaging",
  "whatsapp-webhook":"messaging", "suggest-post":"suggest", "suggestion":"suggest",
  "reembed":"embed", "reembed-all":"embed", "generate-embeddings":"embed",
  "generate-suggestions":"suggest", "ingest-upload":"ingest", "ingest-paste":"ingest",
  "auto-audit":"audit", "audit-system":"audit", "nightly-gap-scan":"schedule",
  "daily-tick":"schedule", "process-mail-outbox":"mail", "process-mail-inbox":"mail",
  "kb-item":"kb", "kb-related":"kb", "kb-ingest":"kb", "feed-api":"feed",
  "ai-rank-search":"search", "ai-curate-feed":"feed"
};

function normalizeFeature(raw: string) {
  let name = raw.toLowerCase().replace(/_/g,"-");
  for (const p of ROLE_PREFIXES) if (name.startsWith(p)) name = name.replace(p,"");
  for (const s of SUFFIXES) name = name.replace(new RegExp(`-${s}\\b`,"g"),"");
  name = name.replace(/\btasks\b/g,"task").replace(/\bmemories\b/g,"memory").replace(/\bnotes\b/g,"note")
             .replace(/\bentities\b/g,"entity").replace(/\bmessages\b/g,"message");
  for (const [k,v] of Object.entries(SYNONYMS)) if (name===k || name.startsWith(k+"-")) name = name.replace(k,v);
  return name.replace(/-+/g,"-").replace(/^-|-$/g,"");
}
function detectRole(name: string) {
  if (name.startsWith("super-andy-")) return "super_andy";
  if (name.startsWith("andy-")) return "andy";
  if (name.startsWith("rocker-admin-") || name.startsWith("admin-rocker-")) return "rocker_admin";
  if (name.startsWith("rocker-")) return "rocker_user";
  if (name.startsWith("admin-") || name.startsWith("bootstrap-")) return "system_admin";
  return "uncategorized";
}

const configPath = "supabase/config.toml";
if (!(await exists(configPath))) Deno.exit(0);
const cfg = parse(await readText(configPath)) as Record<string, any>;
const cfgFuncs = Object.keys(cfg).filter(k=>k.startsWith("functions.") && !k.endsWith(".cron")).map(k=>k.replace("functions.",""));

const featureMap = new Map<string,{ roles:Set<string>; functions:string[] }>();
for (const f of cfgFuncs) {
  const feature = normalizeFeature(f);
  const role = detectRole(f);
  if (!featureMap.has(feature)) featureMap.set(feature,{ roles: new Set(), functions: []});
  const e = featureMap.get(feature)!; e.roles.add(role); e.functions.push(f);
}

const duplicates = [...featureMap.entries()].filter(([_,d])=>d.functions.length>1).map(([k])=>k);
const multiRole  = [...featureMap.entries()].filter(([_,d])=>d.roles.size>1).map(([k])=>k);

await ensureDir(AUDIT_DIR);
await writeJSON(`${AUDIT_DIR}/deep-duplicate-results.json`, {
  timestamp: new Date().toISOString(),
  summary: { totalFunctions: cfgFuncs.length, uniqueFeatures: featureMap.size, duplicateFamilies: duplicates.length, multiRoleFeatures: multiRole.length },
  duplicates, multiRole,
  features: Object.fromEntries([...featureMap.entries()].map(([f,d])=>[f,{ roles:[...d.roles], functions:d.functions }]))
});

if (!FIX) {
  console.log(`ℹ️ dup families=${duplicates.length}, multi-role=${multiRole.length} (run with --fix to generate routers)`);
  Deno.exit(0);
}

// Auto-create role routers for multi-role features
const routersToCreate = multiRole.map(f => `router-${f}`);
let created = 0;
for (const name of routersToCreate) {
  const dir = `${FUNCS_DIR}/${name}`;
  const index = `${dir}/index.ts`;
  try {
    await ensureDir(dir);
    if (await exists(index)) continue;
    const feature = name.replace(/^router-/,"");
    const code = `// Auto-generated router for feature "${feature}"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async (req) => {
  if (req.method==='OPTIONS') return new Response(null,{headers:cors});
  const supabase = createClient(Deno.env.get('SUPABASE_URL')??'', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')??'');
  const body = await req.json().catch(()=>({}));
  const auth = req.headers.get('Authorization') ?? '';
  const role  = body.role ?? 'rocker_user';
  const targets: Record<string,string> = {
    super_andy: 'andy-${feature}',
    andy: 'andy-${feature}',
    rocker_admin: 'rocker-admin-${feature}',
    rocker_user: 'rocker-${feature}',
    system_admin: 'admin-${feature}'
  };
  const target = targets[role];
  if (!target) return new Response(JSON.stringify({error:'No role target for '+role}),{headers:{...cors,'Content-Type':'application/json'},status:404});
  const resp = await fetch(\`\${Deno.env.get('SUPABASE_URL')}/functions/v1/\${target}\`,{
    method:'POST', headers:{'Content-Type':'application/json','Authorization':auth||'Bearer '+(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'')}, body: JSON.stringify(body)
  });
  const data = await resp.text();
  return new Response(data,{headers:{...cors,'Content-Type': resp.headers.get('Content-Type') || 'application/json'}, status: resp.status});
});`;
    await Deno.writeTextFile(index, code);
    created++;
  } catch {}
}
console.log(`✅ Routers created: ${created}/${routersToCreate.length}`);
