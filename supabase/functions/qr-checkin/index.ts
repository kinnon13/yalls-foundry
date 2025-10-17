/**
 * QR Check-In Edge Function
 * Validates entry and sets checked_in status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { entry_id } = await req.json()

    if (!entry_id) {
      throw new Error('entry_id required')
    }

    // Fetch entry
    const { data: entry, error: fetchError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entry_id)
      .single()

    if (fetchError || !entry) {
      throw new Error('Entry not found')
    }

    if (entry.status === 'checked_in') {
      return new Response(
        JSON.stringify({ message: 'Already checked in', entry }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Update entry status
    const { error: updateError } = await supabase
      .from('entries')
      .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
      .eq('id', entry_id)

    if (updateError) throw updateError

    // Log check-in
    await supabase.from('entry_checkin_log').insert({
      entry_id,
      checked_in_at: new Date().toISOString(),
    })

    return new Response(
      JSON.stringify({ message: 'Checked in successfully', entry_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: any) {
    console.error('QR check-in error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
