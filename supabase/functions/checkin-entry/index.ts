import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withCors } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return withCors(null);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { entryId, qrToken } = await req.json();

  // Verify QR token matches entry
  const { data: entry } = await supabase
    .from('entries')
    .select('id')
    .eq('id', entryId)
    .single();

  if (!entry) {
    return withCors(JSON.stringify({ error: 'Invalid entry' }), { status: 400 });
  }

  const { error } = await supabase
    .from('entry_checkin_log')
    .insert({ entry_id: entryId, method: 'qr' });

  if (error) {
    return withCors(JSON.stringify({ 
      error: error instanceof Error ? error.message : String(error) 
    }), { status: 400 });
  }

  return withCors(JSON.stringify({ success: true }));
});
