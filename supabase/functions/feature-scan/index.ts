import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // End-user context (for auth)
    const userClient = createClient(url, anon, { 
      global: { headers: { Authorization: auth } } 
    });
    
    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    // Check admin role
    const { data: isAdmin } = await userClient.rpc('is_admin', { _user_id: user.id });
    
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { 
        status: 403,
        headers: { ...corsHeaders, "content-type": "application/json" }
      });
    }

    // Admin client to bypass RLS for introspection RPC
    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const rpcs: string[] = body.rpcs ?? [];
    const tables: string[] = body.tables ?? [];
    const routes: string[] = body.routes ?? [];

    console.log('Scanning features:', { rpcs: rpcs.length, tables: tables.length, routes: routes.length });

    const { data, error } = await admin.rpc("feature_introspect", { rpcs, tables });
    
    if (error) {
      console.error('Introspection error:', error);
      throw error;
    }

    return new Response(JSON.stringify({ ok: true, routes, ...data }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    console.error('Feature scan error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
