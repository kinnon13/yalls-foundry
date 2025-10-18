import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { operation, ...params } = await req.json();

    let data, error;

    switch (operation) {
      case 'create':
        ({ data, error } = await supabaseClient.rpc('create_collection', params));
        break;
      case 'rename':
        ({ data, error } = await supabaseClient.rpc('rename_collection', params));
        break;
      case 'delete':
        ({ data, error } = await supabaseClient.rpc('delete_collection', params));
        break;
      case 'add_item':
        ({ data, error } = await supabaseClient.rpc('add_collection_item', params));
        break;
      case 'remove_item':
        ({ data, error } = await supabaseClient.rpc('remove_collection_item', params));
        break;
      case 'reorder':
        ({ data, error } = await supabaseClient.rpc('reorder_collection_items', params));
        break;
      default:
        throw new Error('Invalid operation');
    }
    
    if (error) throw error;

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
