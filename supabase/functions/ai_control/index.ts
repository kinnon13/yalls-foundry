/**
 * AI Control API
 * Admin interface for global/scoped control flags and kill switches
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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

    // Verify super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check super admin
    const { data: adminCheck } = await supabase
      .from('super_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (!adminCheck) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // GET /status
    if (req.method === 'GET' && path === 'status') {
      const { data: flags } = await supabase
        .from('ai_control_flags')
        .select('*')
        .single();

      const { data: scopes } = await supabase
        .from('ai_control_scopes')
        .select('*')
        .eq('paused', true);

      return new Response(JSON.stringify({ flags, scopes }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /global
    if (req.method === 'POST' && path === 'global') {
      const body = await req.json();
      const { pause, write_freeze, external_calls_enabled, burst_override, reason } = body;

      const updates: any = {
        last_changed_by: user.id,
        changed_at: new Date().toISOString(),
      };

      if (pause !== undefined) updates.global_pause = pause;
      if (write_freeze !== undefined) updates.write_freeze = write_freeze;
      if (external_calls_enabled !== undefined) updates.external_calls_enabled = external_calls_enabled;
      if (burst_override !== undefined) updates.burst_override = burst_override;
      if (reason) updates.last_reason = reason;

      const { data, error } = await supabase
        .from('ai_control_flags')
        .update(updates)
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('ai_kill_events').insert({
        level: 'global',
        action: JSON.stringify(updates),
        requested_by: user.id,
        reason: reason || 'Global control update',
      });

      return new Response(JSON.stringify({ success: true, flags: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /scope
    if (req.method === 'POST' && path === 'scope') {
      const body = await req.json();
      const { type, key, paused, reason } = body;

      if (!type || !key || paused === undefined) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabase
        .from('ai_control_scopes')
        .upsert({
          scope_type: type,
          scope_key: key,
          paused,
          reason: reason || '',
          changed_by: user.id,
          changed_at: new Date().toISOString(),
        }, {
          onConflict: 'scope_type,scope_key',
        })
        .select()
        .single();

      if (error) throw error;

      // Log event
      await supabase.from('ai_kill_events').insert({
        level: type,
        key,
        action: paused ? 'pause' : 'resume',
        requested_by: user.id,
        reason: reason || `${type} control update`,
      });

      return new Response(JSON.stringify({ success: true, scope: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /kill
    if (req.method === 'POST' && path === 'kill') {
      const body = await req.json();
      const { level, key, reason } = body;

      if (!level) {
        return new Response(JSON.stringify({ error: 'Missing level' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Log kill event
      await supabase.from('ai_kill_events').insert({
        level,
        key: key || null,
        action: 'kill',
        requested_by: user.id,
        reason: reason || 'Emergency kill switch activated',
      });

      // Apply kill based on level
      if (level === 'global') {
        await supabase
          .from('ai_control_flags')
          .update({
            global_pause: true,
            last_reason: reason || 'KILL SWITCH',
            last_changed_by: user.id,
            changed_at: new Date().toISOString(),
          });
      } else if (key) {
        await supabase
          .from('ai_control_scopes')
          .upsert({
            scope_type: level,
            scope_key: key,
            paused: true,
            reason: reason || 'KILL SWITCH',
            changed_by: user.id,
            changed_at: new Date().toISOString(),
          }, {
            onConflict: 'scope_type,scope_key',
          });
      }

      return new Response(JSON.stringify({ success: true, message: 'Kill switch activated' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[ai_control] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
