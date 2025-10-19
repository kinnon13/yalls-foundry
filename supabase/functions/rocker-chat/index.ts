import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 2000;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Dual-client pattern: validate user with JWT, write with service client
    const jwt = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
        auth: { persistSession: false }
      }
    );

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service client for guaranteed writes
    const svc = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Rate limiting: 300 requests per hour
    const rlKey = `rocker:${user.id}:${new Date().toISOString().slice(0, 13)}`;
    const { data: hits } = await svc.rpc('bump_counter', { 
      p_key: rlKey, 
      p_ttl_sec: 3600 
    });
    
    if ((hits ?? 0) > 300) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize input
    const body = await req.json();
    const session_id = String(body.session_id || 'default').slice(0, 128);
    let message = String(body.message || '').slice(0, MAX_MESSAGE_LENGTH);

    if (!message || message.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create conversation
    let { data: conversation } = await svc
      .from('rocker_conversations')
      .select('*')
      .eq('user_id', user.id)
      .eq('session_id', session_id)
      .single();

    if (!conversation) {
      const { data: newConv } = await svc
        .from('rocker_conversations')
        .insert({ user_id: user.id, session_id, messages: [] })
        .select()
        .single();
      conversation = newConv;
    }

    // Append user message and cap at MAX_MESSAGES
    let messages = (conversation?.messages || []) as Array<{
      role: string;
      content: string;
      timestamp: string;
      actions?: any[];
    }>;
    
    messages.push({ 
      role: 'user', 
      content: message, 
      timestamp: new Date().toISOString() 
    });

    // Keep only last MAX_MESSAGES and truncate content
    messages = messages.slice(-MAX_MESSAGES).map(m => ({
      ...m,
      content: String(m.content).slice(0, MAX_MESSAGE_LENGTH)
    }));

    // Simple AI reply logic (replace with actual AI later)
    let reply = "I'm Rocker AI, your assistant. How can I help?";
    let actions: any[] | undefined = undefined;

    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('create') && lowerMsg.includes('listing')) {
      const priceMatch = message.match(/\$?(\d+)/);
      const price = priceMatch ? parseInt(priceMatch[1]) : 22;
      reply = `I can help you create a listing for $${price}. What would you like to list?`;
      actions = [{
        type: 'create_listing',
        label: `Create $${price} listing`,
        params: { price_cents: price * 100 }
      }];
    } else if (lowerMsg.includes('order')) {
      reply = "Let me check your recent orders...";
      actions = [{ type: 'view_orders', label: 'View Orders' }];
    }

    messages.push({ 
      role: 'assistant', 
      content: reply, 
      timestamp: new Date().toISOString(), 
      actions 
    });

    // Update conversation
    await svc
      .from('rocker_conversations')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    return new Response(
      JSON.stringify({ reply, actions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in rocker-chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});