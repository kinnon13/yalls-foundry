#!/usr/bin/env -S deno run -A
// 👻 Restore ghost functions (stubs missing locally but listed in config)

import { parse } from "https://deno.land/std@0.223.0/toml/mod.ts";
import { exists, ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

console.log("👻 Restoring ghost functions (in config but missing folders)...\n");

if (!(await exists(CONFIG_PATH))) {
  console.error("❌ config.toml not found");
  Deno.exit(1);
}

const configText = await Deno.readTextFile(CONFIG_PATH);
const config = parse(configText) as Record<string, any>;

const configFuncNames = Object.keys(config)
  .filter(k => k.startsWith("functions.") && !k.endsWith(".cron"))
  .map(k => k.replace("functions.", ""));

const ghosts: string[] = [];
for (const name of configFuncNames) {
  const funcPath = `${FUNCS_DIR}/${name}`;
  if (!(await exists(funcPath))) {
    ghosts.push(name);
  }
}

if (ghosts.length === 0) {
  console.log("✅ No ghost functions found - all configs have folders");
  Deno.exit(0);
}

console.log(`Found ${ghosts.length} ghost function(s) to restore:\n`);

let restored = 0;
for (const name of ghosts) {
  const dir = `${FUNCS_DIR}/${name}`;
  const indexPath = `${dir}/index.ts`;
  
  await ensureDir(dir);
  
  const stubCode = `// Stub function for ${name}
// TODO: Implement actual logic

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // TODO: Implement ${name} logic here
    
    return new Response(
      JSON.stringify({ 
        status: 'stub',
        message: 'Function ${name} is not yet implemented',
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in ${name}:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        function: '${name}'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
`;
  
  await Deno.writeTextFile(indexPath, stubCode);
  console.log(`  ✅ ${name}`);
  restored++;
}

console.log(`\n✅ Restored ${restored}/${ghosts.length} ghost functions as stubs`);
console.log("🎯 Next: Implement actual logic in each function\n");
