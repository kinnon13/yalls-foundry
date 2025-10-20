// Feature Verification & Connectivity Checker
// Verifies if described features exist in code/UI/DB and checks Rocker's access
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('[rocker-verify-feature] boot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  feature_type: 'rpc' | 'table' | 'route' | 'component' | 'edge_function';
  feature_name: string;
  test_connectivity?: boolean;
  test_params?: Record<string, any>;
}

interface VerificationResult {
  exists: boolean;
  accessible: boolean;
  status: 'done' | 'not_done' | 'partial';
  details: {
    found_in?: string[];
    missing_from?: string[];
    connectivity?: {
      can_call: boolean;
      test_result?: any;
      error?: string;
    };
    suggestions?: string[];
  };
  metadata: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { feature_type, feature_name, test_connectivity, test_params }: VerificationRequest = await req.json();

    const result: VerificationResult = {
      exists: false,
      accessible: false,
      status: 'not_done',
      details: {
        found_in: [],
        missing_from: [],
      },
      metadata: {
        feature_type,
        feature_name,
        checked_at: new Date().toISOString(),
      },
    };

    // === 1. Check Database Objects (RPCs, Tables, Views) ===
    if (feature_type === 'rpc') {
      // Check if RPC exists by querying pg_proc directly
      const { data: rpcCheck } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('proname', feature_name)
        .eq('pronamespace', '(SELECT oid FROM pg_namespace WHERE nspname = \'public\')')
        .maybeSingle();

      if (rpcCheck) {
        result.exists = true;
        result.details.found_in?.push('database/functions');
        
        // Test connectivity if requested
        if (test_connectivity) {
          try {
            const testResult = await supabase.rpc(feature_name, test_params || {});
            result.accessible = !testResult.error;
            result.details.connectivity = {
              can_call: !testResult.error,
              test_result: testResult.data,
              error: testResult.error?.message,
            };
          } catch (e: any) {
            result.details.connectivity = {
              can_call: false,
              error: e.message,
            };
          }
        } else {
          result.accessible = true; // Assume accessible if it exists
        }
      } else {
        result.details.missing_from?.push('database/functions');
        result.details.suggestions?.push(
          `RPC '${feature_name}' not found. Create it with: CREATE FUNCTION public.${feature_name}(...)`
        );
      }
    }

    if (feature_type === 'table') {
      const { data: tableCheck } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', feature_name)
        .maybeSingle();

      if (tableCheck) {
        result.exists = true;
        result.details.found_in?.push('database/tables');

        // Check RLS policies
        const { data: rlsCheck } = await supabase
          .from('pg_policies')
          .select('policyname')
          .eq('tablename', feature_name);

        result.metadata.rls_policies = rlsCheck?.length || 0;
        
        if (test_connectivity) {
          try {
            const testResult = await supabase.from(feature_name).select('*').limit(1);
            result.accessible = !testResult.error;
            result.details.connectivity = {
              can_call: !testResult.error,
              test_result: `Query returned ${testResult.data?.length || 0} rows`,
              error: testResult.error?.message,
            };
          } catch (e: any) {
            result.details.connectivity = {
              can_call: false,
              error: e.message,
            };
          }
        } else {
          result.accessible = true;
        }
      } else {
        result.details.missing_from?.push('database/tables');
        result.details.suggestions?.push(
          `Table '${feature_name}' not found. Create it with a migration.`
        );
      }
    }

    // === 2. Check Edge Functions ===
    if (feature_type === 'edge_function') {
      // Check if edge function exists by attempting to invoke with dry-run
      if (test_connectivity) {
        try {
          const testResult = await supabase.functions.invoke(feature_name, {
            body: test_params || {},
          });
          
          result.exists = true;
          result.accessible = testResult.error?.message !== 'Function not found';
          result.details.found_in?.push('edge_functions');
          result.details.connectivity = {
            can_call: !testResult.error || testResult.error?.message.includes('rate limit'),
            test_result: testResult.data,
            error: testResult.error?.message,
          };
        } catch (e: any) {
          result.details.missing_from?.push('edge_functions');
          result.details.connectivity = {
            can_call: false,
            error: e.message,
          };
          result.details.suggestions?.push(
            `Edge function '${feature_name}' not accessible. Check if it's deployed.`
          );
        }
      } else {
        result.details.suggestions?.push(
          `Enable test_connectivity to verify edge function '${feature_name}'`
        );
      }
    }

    // === 3. Check Routes & Components (via rocker_knowledge search) ===
    if (feature_type === 'route' || feature_type === 'component') {
      const { data: codeSearch } = await supabase
        .from('rocker_knowledge')
        .select('id, content, meta')
        .or(`content.ilike.%${feature_name}%`)
        .limit(5);

      if (codeSearch && codeSearch.length > 0) {
        result.exists = true;
        result.details.found_in?.push('codebase_knowledge');
        result.metadata.code_references = codeSearch.length;
        result.metadata.sample_files = codeSearch.map(c => c.meta?.source).filter(Boolean);
        result.accessible = true; // If found in code, assume it's accessible
      } else {
        result.details.missing_from?.push('codebase_knowledge');
        result.details.suggestions?.push(
          `${feature_type === 'route' ? 'Route' : 'Component'} '${feature_name}' not found in ingested code. Ingest codebase or verify naming.`
        );
      }
    }

    // === 4. Determine Overall Status ===
    if (result.exists && result.accessible) {
      result.status = 'done';
    } else if (result.exists && !result.accessible) {
      result.status = 'partial';
      result.details.suggestions?.push(
        `Feature exists but connectivity failed. Check permissions, RLS policies, or implementation.`
      );
    } else {
      result.status = 'not_done';
    }

    // === 5. Log Verification to rocker_deep_analysis ===
    await supabase.from('rocker_deep_analysis').insert({
      input_text: `Verification: ${feature_type}:${feature_name}`,
      analysis: {
        verification_result: result,
        type: 'feature_verification',
      },
      meta: {
        feature_type,
        feature_name,
        status: result.status,
      },
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('[rocker-verify-feature] error:', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
