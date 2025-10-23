// deno run -A scripts/restore-ghost-functions.ts
// Restore ALL ghost functions as working stubs

import { parse as parseToml } from "https://deno.land/std@0.224.0/toml/mod.ts";
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

const CONFIG_PATH = "supabase/config.toml";
const FUNCS_DIR = "supabase/functions";

console.log("🔧 RESTORING ALL GHOST FUNCTIONS AS STUBS\n");

// Read config
const configRaw = await Deno.readTextFile(CONFIG_PATH);
const config = parseToml(configRaw) as any;

// Extract all function entries
const configFunctions = new Set<string>();
for (const key of Object.keys(config)) {
  if (key.startsWith("functions.") && !key.endsWith(".cron")) {
    configFunctions.add(key.replace("functions.", ""));
  }
}

// List actual folders
const actualFolders = new Set<string>();
for await (const entry of Deno.readDir(FUNCS_DIR)) {
  if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "_shared") {
    actualFolders.add(entry.name);
  }
}

// Find ghosts
const ghosts = Array.from(configFunctions).filter(name => !actualFolders.has(name));
ghosts.sort();

console.log(`Found ${ghosts.length} ghost functions to restore:\n`);

let restored = 0;
for (const name of ghosts) {
  const funcPath = `${FUNCS_DIR}/${name}`;
  const indexPath = `${funcPath}/index.ts`;
  
  try {
    await ensureDir(funcPath);
    
    // Create stub function
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
  } catch (error) {
    console.log(`  ❌ ${name} - Error: ${error.message}`);
  }
}

console.log(`\n✅ Restored ${restored}/${ghosts.length} ghost functions as stubs`);
console.log("\nAll functions now have folders. Run audit again to verify.\n");
