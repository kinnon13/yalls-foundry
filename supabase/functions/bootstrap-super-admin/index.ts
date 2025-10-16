// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticated client to get the caller
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Service client to bypass RLS for bootstrap
    const service = createClient(supabaseUrl, serviceRole);

    // Check if any super_admin already exists
    const { count, error: countError } = await service
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'super_admin');

    if (countError) {
      console.error('Count error', countError);
      return new Response(JSON.stringify({ error: 'Failed to check roles' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ error: 'Super admin already exists' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Insert the first super_admin
    const { error: insertError } = await service
      .from('user_roles')
      .insert({ user_id: user.id, role: 'super_admin', granted_by: user.id } as any);

    if (insertError) {
      console.error('Insert error', insertError);
      return new Response(JSON.stringify({ error: 'Failed to assign role' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Audit log (best effort)
    await service.from('admin_audit_log').insert({
      action: 'bootstrap_super_admin',
      actor_user_id: user.id,
      metadata: { route: '/admin/control-room', reason: 'first_time_bootstrap' },
    } as any);

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('Unhandled error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
