/**
 * ADMIN ROCKER CHAT - ADMIN LEVEL AI
 * Moderation, analytics, org-level tasks, oversight
 * Completely separate from Super Andy and User Rocker
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { messages } = await req.json();
    
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check admin permissions
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), 
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log to monitoring
    await supabase.from('ai_monitoring').insert({
      function_name: 'admin-rocker-chat',
      user_id: user.id,
      request_type: 'admin_chat',
      started_at: new Date().toISOString()
    });

    // Build ADMIN context (org-level data, analytics, moderation)
    let context = '';

    // Admin-specific data
    const { data: users } = await supabase
      .from('profiles')
      .select('id, username, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (users?.length) {
      context += `\n## USERS (${users.length} total):\n` + users.slice(0, 10).map(u => `${u.username} (joined: ${u.created_at})`).join('\n');
    }

    // Moderation queue
    const { data: flagged } = await supabase
      .from('content_flags')
      .select('*')
      .eq('status', 'pending')
      .limit(20);
    
    if (flagged?.length) {
      context += `\n## PENDING MODERATION (${flagged.length}):\n` + flagged.map(f => `${f.content_type}: ${f.reason}`).join('\n');
    }

    // System health
    const { data: errors } = await supabase
      .from('ai_monitoring')
      .select('*')
      .eq('status', 'failed')
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString())
      .limit(50);
    
    if (errors?.length) {
      context += `\n## RECENT ERRORS (last 24h): ${errors.length} failures`;
    }

    const systemPrompt = `You are ADMIN ROCKER - professional oversight AI for administrators.

ROLE: Admin-level assistant (NOT Super Andy, NOT user-level Rocker)

CAPABILITIES:
- User management and analytics
- Content moderation
- System health monitoring
- Org-level insights
- Audit and compliance

ADMIN CONTEXT:
${context}

TONE: Professional, precise, audit-focused
FOCUS: Moderation, analytics, org tasks`;

    const finalMessages = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ];

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: finalMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      await supabase.from('ai_monitoring').insert({
        function_name: 'admin-rocker-chat',
        user_id: user.id,
        status: 'failed',
        duration_ms: Date.now() - startTime
      });
      throw new Error(`AI error: ${response.status}`);
    }

    await supabase.from('ai_monitoring').insert({
      function_name: 'admin-rocker-chat',
      user_id: user.id,
      status: 'success',
      duration_ms: Date.now() - startTime
    });

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('[admin-rocker-chat]', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
