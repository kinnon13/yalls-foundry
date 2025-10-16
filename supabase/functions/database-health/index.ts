import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthMetrics {
  totalEvents: number;
  partitionCount: number;
  rlsPolicyCount: number;
  userCount: number;
  businessCount: number;
  edgeFunctionCount: number;
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

    // Query actual database metrics
    const [
      eventsResult,
      profilesResult,
      businessesResult,
    ] = await Promise.all([
      // Count total CRM events
      supabase.from('crm_events').select('*', { count: 'exact', head: true }),
      
      // Count profiles
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      
      // Count businesses
      supabase.from('businesses').select('*', { count: 'exact', head: true }),
    ]);

    // Query partition count from pg_class
    const { data: partitionData } = await supabase
      .from('information_schema.tables')
      .select('*', { count: 'exact', head: true })
      .like('table_name', 'crm_events_%');

    // Count RLS policies
    const { data: policyData } = await supabase
      .from('pg_policies')
      .select('*', { count: 'exact', head: true });

    const metrics: HealthMetrics = {
      totalEvents: eventsResult.count || 0,
      partitionCount: (partitionData as any) || 1,
      rlsPolicyCount: (policyData as any) || 0,
      userCount: profilesResult.count || 0,
      businessCount: businessesResult.count || 0,
      edgeFunctionCount: 45, // Static count of edge functions
    };

    return new Response(
      JSON.stringify(metrics),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Database health check failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
