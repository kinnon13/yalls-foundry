import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withCors } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return withCors(null);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const { eventId } = await req.json();

  const { data, error } = await supabase.rpc('export_producer_csv', { p_event_id: eventId });

  if (error) {
    return withCors(JSON.stringify({ error: error.message }), { status: 400 });
  }

  const csv = ['entry_id,rider_name,horse_name,fees_cents,status', ...(data || [])].join('\n');

  return withCors(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="event-${eventId}-export.csv"`,
    },
  });
});
