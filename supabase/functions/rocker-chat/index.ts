import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, session_id, message } = await req.json();

    if (!user_id || !session_id || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create conversation
    let { data: conversation } = await supabase
      .from('rocker_conversations')
      .select('*')
      .eq('user_id', user_id)
      .eq('session_id', session_id)
      .single();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('rocker_conversations')
        .insert({ user_id, session_id, messages: [] })
        .select()
        .single();
      conversation = newConv;
    }

    // Append user message
    const messages = conversation?.messages || [];
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Simple AI reply logic (replace with actual AI later)
    let reply = "I'm Rocker AI, your assistant. How can I help?";
    let actions = null;

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

    messages.push({ role: 'assistant', content: reply, timestamp: new Date().toISOString(), actions });

    // Update conversation
    await supabase
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