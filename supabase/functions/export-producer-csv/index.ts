/**
 * Producer CSV Export
 * Export event reservations/entries as CSV
 */

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
    const url = new URL(req.url);
    const eventId = url.searchParams.get('event_id');

    if (!eventId) {
      return new Response('Missing event_id parameter', { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch reservations
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, entrant_name, contact, kind, price_cents, status, qr_code, created_at')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[CSV Export] Error:', error);
      return new Response('Database error', { status: 500, headers: corsHeaders });
    }

    // Generate CSV
    const headers = ['ID', 'Entrant', 'Contact', 'Type', 'Price', 'Status', 'QR', 'Created'];
    const rows = (reservations || []).map(r => [
      r.id,
      `"${(r.entrant_name || '').replace(/"/g, '""')}"`,
      `"${(r.contact || '').replace(/"/g, '""')}"`,
      r.kind,
      `$${(r.price_cents / 100).toFixed(2)}`,
      r.status,
      r.qr_code || '',
      new Date(r.created_at).toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="event-${eventId}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[CSV Export] Exception:', error);
    return new Response('Internal error', { status: 500, headers: corsHeaders });
  }
});
