#!/usr/bin/env -S deno run -A
// 🌉 Auto-generate bridge functions for cross-category dependencies

import { exists, ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const RESULTS_PATH = "scripts/dependency-scan-results.json";
const FUNCS_DIR = "supabase/functions";

if (!(await exists(RESULTS_PATH))) {
  console.error("❌ No scan results found. Run: deno run -A scripts/scan-cross-dependencies.ts");
  Deno.exit(1);
}

console.log("🌉 GENERATING BRIDGE FUNCTIONS\n");

const results = JSON.parse(await Deno.readTextFile(RESULTS_PATH));
const bridges: string[] = results.bridgeRecommendations || [];

if (bridges.length === 0) {
  console.log("✅ No bridge functions needed - no cross-category dependencies detected");
  Deno.exit(0);
}

console.log(`Found ${bridges.length} bridge(s) to create:\n`);

let created = 0;
for (const bridgeName of bridges) {
  const bridgePath = `${FUNCS_DIR}/${bridgeName}`;
  const indexPath = `${bridgePath}/index.ts`;
  
  if (await exists(bridgePath)) {
    console.log(`  ⏭️  ${bridgeName} (already exists)`);
    continue;
  }
  
  await ensureDir(bridgePath);
  
  const bridgeCode = `// Bridge function: ${bridgeName}
// Auto-generated proxy for cross-category communication
// This prevents direct coupling between system categories

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BridgeRequest {
  target: string;      // Target function name
  payload: any;        // Data to forward
  method?: string;     // HTTP method (default: POST)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: BridgeRequest = await req.json();
    const { target, payload, method = 'POST' } = body;

    if (!target) {
      return new Response(
        JSON.stringify({ error: 'Missing target function name' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // Forward request to target function
    const response = await fetch(\`\${supabaseUrl}/functions/v1/\${target}\`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${serviceRoleKey}\`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      }
    );
  } catch (error) {
    console.error(\`Error in ${bridgeName}:\`, error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        bridge: '${bridgeName}'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
`;
  
  await Deno.writeTextFile(indexPath, bridgeCode);
  console.log(`  ✅ ${bridgeName}`);
  created++;
}

console.log(`\n✅ Created ${created}/${bridges.length} bridge function(s)`);
console.log("\n🎯 Next steps:");
console.log("  1. Run: deno run -A scripts/sync-supabase-config.ts");
console.log("  2. Update calling functions to use bridges instead of direct calls");
console.log("  3. Run: deno run -A scripts/audit-functions.ts");
console.log("");
