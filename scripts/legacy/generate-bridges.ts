#!/usr/bin/env -S deno run -A
// 🌉 Auto-generate bridge functions and feature routers

import { exists, ensureDir } from "https://deno.land/std@0.223.0/fs/mod.ts";

const RESULTS_PATH = "scripts/dependency-scan-results.json";
const FUNCS_DIR = "supabase/functions";

if (!(await exists(RESULTS_PATH))) {
  console.error("❌ No scan results found. Run: deno run -A scripts/scan-cross-dependencies.ts");
  Deno.exit(1);
}

console.log("🌉 GENERATING BRIDGES & ROUTERS\n");

const results = JSON.parse(await Deno.readTextFile(RESULTS_PATH));
const categoryBridges: string[] = results.recommendations?.categoryBridges || [];
const featureRouters: string[] = results.recommendations?.featureRouters || [];

if (categoryBridges.length === 0 && featureRouters.length === 0) {
  console.log("✅ No bridges or routers needed");
  Deno.exit(0);
}

// ==================== PART 1: CATEGORY BRIDGES ====================
if (categoryBridges.length > 0) {
  console.log(`📦 Creating ${categoryBridges.length} category bridge(s):\n`);

  let bridgesCreated = 0;
  for (const bridgeName of categoryBridges) {
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
    bridgesCreated++;
  }

  console.log(`\n✅ Created ${bridgesCreated}/${categoryBridges.length} category bridge(s)\n`);
}

// ==================== PART 2: FEATURE ROUTERS ====================
if (featureRouters.length > 0) {
  console.log(`🎯 Creating ${featureRouters.length} feature router(s):\n`);
  
  let routersCreated = 0;
  for (const routerName of featureRouters) {
    const routerPath = `${FUNCS_DIR}/${routerName}`;
    const indexPath = `${routerPath}/index.ts`;
    
    if (await exists(routerPath)) {
      console.log(`  ⏭️  ${routerName} (already exists)`);
      continue;
    }
    
    await ensureDir(routerPath);
    
    // Extract feature name for router logic
    const featureName = routerName.replace('router-', '');
    
    const routerCode = `// Feature Router: ${routerName}
// Auto-generated router for multi-role feature: "${featureName}"
// Dispatches to role-specific implementations based on caller context

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouterRequest {
  action: string;          // Action to perform (e.g., "list", "create", "update")
  payload: any;            // Action payload
  role?: string;           // Optional explicit role override
}

interface RouteMapping {
  [role: string]: string;  // role -> function_name
}

// Define role-to-function mappings for "${featureName}"
const ROUTE_MAP: RouteMapping = {
  'super_andy': 'andy-${featureName}',
  'rocker_admin': 'rocker-admin-${featureName}',
  'rocker_user': 'rocker-${featureName}',
  'system_admin': 'admin-${featureName}',
};

async function getUserRole(userId: string, supabase: any): Promise<string> {
  // Check user_roles table for role assignment
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) {
    return 'rocker_user'; // Default to user role
  }
  
  return data.role;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      );
    }

    const body: RouterRequest = await req.json();
    const { action, payload, role: explicitRole } = body;

    // Determine role (explicit override or lookup)
    const userRole = explicitRole || await getUserRole(user.id, supabase);
    
    // Get target function for this role
    const targetFunction = ROUTE_MAP[userRole];
    
    if (!targetFunction) {
      return new Response(
        JSON.stringify({ 
          error: \`No implementation found for role: \${userRole}\`,
          availableRoles: Object.keys(ROUTE_MAP)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      );
    }

    console.log(\`[router-${featureName}] Routing \${action} for \${userRole} → \${targetFunction}\`);

    // Forward to role-specific implementation
    const response = await fetch(
      \`\${Deno.env.get('SUPABASE_URL')}/functions/v1/\${targetFunction}\`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({ action, payload }),
      }
    );

    const result = await response.json();
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: response.status
      }
    );
  } catch (error) {
    console.error(\`Error in ${routerName}:\`, error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        router: '${routerName}'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
`;
    
    await Deno.writeTextFile(indexPath, routerCode);
    console.log(`  ✅ ${routerName}`);
    routersCreated++;
  }

  console.log(`\n✅ Created ${routersCreated}/${featureRouters.length} feature router(s)\n`);
}

console.log("=".repeat(60));
console.log("\n🎯 Next steps:");
console.log("  1. Run: deno run -A scripts/sync-supabase-config.ts");
console.log("  2. Update calling code to use routers instead of direct calls");
console.log("  3. Run: deno run -A scripts/audit-functions.ts");
console.log("");
