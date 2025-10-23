#!/usr/bin/env -S deno run -A
import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, readText, writeJSON, ensureDir, FUNCS_DIR, AUDIT_DIR } from "./_utils.ts";
import { walk } from "https://deno.land/std@0.223.0/fs/walk.ts";

const FIX = Deno.args.includes("--fix");

const CATS: Record<string,RegExp> = {
  andy:/^andy-/, rocker:/^rocker-/, admin:/^(admin-|bootstrap-)/, system:/^(health-|ai_|watchdog|cron_|metrics_|dlq_)/, other:/.*/
};
function cat(n:string){ for (const [k,r] of Object.entries(CATS)) if (r.test(n)) return k; return "other"; }

const cfg = parse(await readText("supabase/config.toml")) as Record<string,any>;
const cfgFuncs = Object.keys(cfg).filter(k=>k.startsWith("functions.") && !k.endsWith(".cron")).map(k=>k.replace("functions.",""));

const folders: string[] = [];
for await (const e of Deno.readDir(FUNCS_DIR)) if (e.isDirectory && !e.name.startsWith(".") && e.name!=="_shared") folders.push(e.name);

type Dep = { caller:string; callerCat:string; target:string; targetCat:string; file:string; line:number; type:"import"|"fetch" };
const deps: Dep[] = [];

for (const fn of folders) {
  const callerCat = cat(fn);
  for await (const entry of walk(`${FUNCS_DIR}/${fn}`, { exts:[".ts",".js"], includeDirs:false })) {
    const txt = await Deno.readTextFile(entry.path);
    const lines = txt.split("\n");
    lines.forEach((ln, i) => {
      const f1 = ln.match(/functions\/v1\/([a-z0-9_-]+)/)?.[1];
      if (f1) {
        const targetCat = cat(f1);
        if (targetCat!==callerCat) deps.push({ caller: fn, callerCat, target: f1, targetCat, file: entry.path, line: i+1, type:"fetch" });
      }
    });
  }
}

await ensureDir(AUDIT_DIR);
await writeJSON(`${AUDIT_DIR}/cross-deps.json`, { timestamp: Date.now(), count: deps.length, deps });

if (!FIX || deps.length===0) {
  console.log(`ℹ️ cross deps: ${deps.length} (run with --fix to add bridges)`);
  Deno.exit(0);
}

// Auto-create bridges by pair
const pairs = new Set<string>();
for (const d of deps) pairs.add(`${d.callerCat}->${d.targetCat}`);
let created = 0;
for (const p of pairs) {
  const name = `bridge-${p.replace("->","-")}`;
  const dir = `${FUNCS_DIR}/${name}`;
  const index = `${dir}/index.ts`;
  if (await exists(index)) continue;
  await ensureDir(dir);
  const code = `// Auto bridge ${p}
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type'};
Deno.serve(async (req)=>{
  if (req.method==='OPTIONS') return new Response(null,{headers:cors});
  const body = await req.json().catch(()=>({}));
  const target = body.target;
  if (!target) return new Response(JSON.stringify({error:"missing target"}),{headers:{...cors,'Content-Type':'application/json'},status:400});
  const resp = await fetch(\`\${Deno.env.get('SUPABASE_URL')}/functions/v1/\${target}\`,{
    method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'')}, body: JSON.stringify(body.payload ?? {})
  });
  const txt = await resp.text();
  return new Response(txt,{headers:{...cors,'Content-Type': resp.headers.get('Content-Type') || 'application/json'}, status: resp.status});
});`;
  await Deno.writeTextFile(index, code);
  created++;
}
console.log(`✅ Bridges created: ${created}/${pairs.size}`);
