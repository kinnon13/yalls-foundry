#!/usr/bin/env -S deno run -A
// Cross-category dependency scanner with bridge generation
import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";
import { ensureDir, exists } from "https://deno.land/std@0.223.0/fs/mod.ts";

const FIX = Deno.args.includes("--fix");
const FUNCS_DIR = "supabase/functions";
const AUDIT_DIR = "scripts/audit";

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
  type: "fetch";
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
              line: idx + 1,
              type: "fetch"
            });
          }
        }
      });
    }
  } catch (e) {
    // Skip if directory can't be read
  }
}

const report = {
  timestamp: new Date().toISOString(),
  count: dependencies.length,
  dependencies
};

await Deno.writeTextFile(`${AUDIT_DIR}/cross-dependencies.json`, JSON.stringify(report, null, 2));

console.log(`📊 Found ${dependencies.length} cross-category dependencies`);

if (!FIX || dependencies.length === 0) {
  if (dependencies.length > 0) {
    console.log(`ℹ️  Run with --fix to auto-generate bridge functions`);
  }
  Deno.exit(0);
}

// Auto-generate bridges for cross-category calls
const pairs = new Set<string>();
for (const dep of dependencies) {
  pairs.add(`${dep.callerCat}->${dep.targetCat}`);
}

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
