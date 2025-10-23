#!/usr/bin/env -S deno run -A
// Cross-category dependency scanner with bridge generation
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { exists, writeJSON, ensureDir, FUNCS_DIR, AUDIT_DIR, getFix, now } from "./_utils.ts";

const FIX = getFix();
await ensureDir(AUDIT_DIR);

const CATEGORIES: Record<string, RegExp> = {
  andy: /^andy-/,
  rocker: /^rocker-/,
  admin: /^(admin-|bootstrap-)/,
  system: /^(health-|ai_|watchdog|cron_|metrics_|dlq_)/,
  other: /.*/
};

function categorize(name: string): string {
  for (const [cat, regex] of Object.entries(CATEGORIES)) {
    if (regex.test(name)) return cat;
  }
  return "other";
}

const folders: string[] = [];
for await (const e of Deno.readDir(FUNCS_DIR)) {
  if (e.isDirectory && !e.name.startsWith(".") && e.name !== "_shared") {
    folders.push(e.name);
  }
}

type Dependency = {
  caller: string;
  callerCat: string;
  target: string;
  targetCat: string;
  file: string;
  line: number;
};

const dependencies: Dependency[] = [];

for (const fn of folders) {
  const callerCat = categorize(fn);
  const fnPath = `${FUNCS_DIR}/${fn}`;
  
  try {
    for await (const entry of walk(fnPath, { exts: [".ts", ".js"], includeDirs: false })) {
      const content = await Deno.readTextFile(entry.path);
      const lines = content.split("\n");
      
      lines.forEach((line, idx) => {
        const match = line.match(/functions\/v1\/([a-z0-9_-]+)/);
        if (match) {
          const target = match[1];
          const targetCat = categorize(target);
          if (targetCat !== callerCat) {
            dependencies.push({
              caller: fn,
              callerCat,
              target,
              targetCat,
              file: entry.path,
              line: idx + 1
            });
          }
        }
      });
    }
  } catch (e) {
    // Skip if directory can't be read
  }
}

const pairs = new Set<string>();
for (const dep of dependencies) {
  pairs.add(`${dep.callerCat}->${dep.targetCat}`);
}

const report = {
  timestamp: now(),
  count: dependencies.length,
  uniquePairs: pairs.size,
  dependencies,
  action: FIX && pairs.size > 0 ? "bridges_created" : "scan_only"
};

await writeJSON(`${AUDIT_DIR}/cross-dependencies.json`, report);

console.log(`📊 ${dependencies.length} cross-category dependencies across ${pairs.size} pair(s)`);

if (!FIX || pairs.size === 0) {
  if (pairs.size > 0) {
    console.log(`ℹ️  Run with --fix to auto-generate ${pairs.size} bridge(s)`);
  }
  Deno.exit(0);
}

// Auto-generate bridges
let created = 0;
for (const pair of pairs) {
  const bridgeName = `bridge-${pair.replace("->", "-")}`;
  const dir = `${FUNCS_DIR}/${bridgeName}`;
  const indexPath = `${dir}/index.ts`;
  
  if (await exists(indexPath)) continue;
  
  try {
    await ensureDir(dir);
    
    const code = `// Auto-generated bridge for ${pair}
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  
  const body = await req.json().catch(() => ({}));
  const target = body.target;
  
  if (!target) {
    return new Response(
      JSON.stringify({ error: "missing target function name" }),
      { headers: { ...cors, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
  
  const url = \`\${Deno.env.get('SUPABASE_URL')}/functions/v1/\${target}\`;
  const auth = 'Bearer ' + Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': auth },
    body: JSON.stringify(body.payload ?? {})
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
    console.error(`❌ Failed to create bridge ${bridgeName}:`, e);
  }
}

console.log(`✅ Created ${created}/${pairs.size} bridge(s)`);
