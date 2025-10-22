// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const auth = req.headers.get('authorization') || '';
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Forward the caller's JWT so we can read user identity if needed.
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: auth } }
    });

    const body = await req.json();
    const {
      tenantId = null,
      conversationId = null,
      ledgerId = null,
      correlationId = null,
      rating,
      comment = '',
      tags = [],
      modelName = 'grok-2',
      promptHash = null,
      policyVersion = null,
      source = 'why_panel'
    } = body || {};

    if (!rating || rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'rating must be 1..5' }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' }
      });
    }

    // Who is rating?
    const { data: userInfo } = await supabase.auth.getUser();
    const userId = userInfo?.user?.id ?? null;

    // Insert learning
    const { data: learning, error: learnErr } = await supabase
      .from('ai_learnings')
      .insert([{
        tenant_id: tenantId,
        conversation_id: conversationId,
        ledger_id: ledgerId,
        correlation_id: correlationId,
        source,
        rating,
        comment,
        tags,
        model_name: modelName,
        prompt_hash: promptHash,
        policy_version: policyVersion,
        created_by: userId
      }])
      .select()
      .single();

    if (learnErr) throw learnErr;

    // Mirror to action ledger for full traceability
    await supabase.from('ai_action_ledger').insert({
      tenant_id: tenantId,
      conversation_id: conversationId,
      correlation_id: correlationId,
      actor_role: 'user',
      topic: 'feedback.rate',
      tool: 'ui:why_panel',
      input_excerpt: comment?.slice(0, 200) || null,
      output_excerpt: `rating=${rating} tags=${Array.isArray(tags)? tags.join(','): ''}`,
      success: true,
      error: null,
      trace: { learning_id: learning?.id, source, modelName, promptHash, policyVersion }
    });

    return new Response(JSON.stringify({ ok: true, id: learning?.id }), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message || err) }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' }
    });
  }
});
