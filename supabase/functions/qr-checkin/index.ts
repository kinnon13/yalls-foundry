/**
 * QR Check-In Edge Function
 * Production-grade: validates reservation and marks checked in
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
    const { code } = await req.json();
    
    if (!code) {
      return new Response(
        JSON.stringify({ error: 'QR code required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check in reservation
    const { data: reservation, error } = await supabase
      .from('reservations')
      .update({
        status: 'checked_in',
        metadata: { checked_in_at: new Date().toISOString() },
      })
      .eq('qr_code', code)
      .in('status', ['active', 'confirmed'])
      .select('id, event_id, entrant_name')
      .maybeSingle();

    if (error) {
      console.error('[QR Check-in] DB error:', error);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!reservation) {
      return new Response(
        JSON.stringify({ error: 'Not found or already checked in' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[QR Check-in] Success:', reservation.id);

    return new Response(
      JSON.stringify({
        success: true,
        reservation,
        message: 'Check-in successful',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[QR Check-in] Exception:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
