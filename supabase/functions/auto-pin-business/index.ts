import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutoPinRequest {
  userId: string;
  businessId: string;
  apps?: string[];
}

const PIN_FEATURES = {
  PIN_LOCK_DAYS: 14,
  PIN_MIN_INTERACTIONS: 3,
  PIN_MAX: 24,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { userId, businessId, apps = [] }: AutoPinRequest = await req.json();

    console.log('[auto-pin] Processing:', { userId, businessId, apps });

    // 1. Check current pin count
    const { count: currentCount } = await supabase
      .from('user_pins')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    // 2. If at max, evict oldest auto_follow pin
    if (currentCount && currentCount >= PIN_FEATURES.PIN_MAX) {
      const { data: oldestAuto } = await supabase
        .from('user_pins')
        .select('id')
        .eq('user_id', userId)
        .eq('origin', 'auto_follow')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (oldestAuto) {
        await supabase
          .from('user_pins')
          .delete()
          .eq('id', oldestAuto.id);
        
        console.log('[auto-pin] Evicted oldest auto-follow pin:', oldestAuto.id);
      }
    }

    // 3. Check if already pinned manually
    const { data: existing } = await supabase
      .from('user_pins')
      .select('*')
      .eq('user_id', userId)
      .eq('pin_type', 'entity')
      .eq('ref_id', businessId)
      .single();

    if (existing) {
      // Don't overwrite manual pins
      if (existing.origin === 'manual') {
        console.log('[auto-pin] Already pinned manually, skipping');
        return new Response(
          JSON.stringify({ 
            success: true, 
            pinId: existing.id,
            alreadyPinned: true,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Update existing auto-follow pin lock
      const lockedUntil = new Date();
      lockedUntil.setDate(lockedUntil.getDate() + PIN_FEATURES.PIN_LOCK_DAYS);

      const { data: updated } = await supabase
        .from('user_pins')
        .update({
          locked_until: lockedUntil.toISOString(),
          lock_reason: 'auto_follow_business',
        })
        .eq('id', existing.id)
        .select()
        .single();

      console.log('[auto-pin] Updated existing pin lock:', updated);

      return new Response(
        JSON.stringify({ 
          success: true, 
          pinId: updated.id,
          locked: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Create new locked pin
    const lockedUntil = new Date();
    lockedUntil.setDate(lockedUntil.getDate() + PIN_FEATURES.PIN_LOCK_DAYS);

    const { data: newPin, error: pinError } = await supabase
      .from('user_pins')
      .insert({
        user_id: userId,
        pin_type: 'entity',
        ref_id: businessId,
        origin: 'auto_follow',
        locked_until: lockedUntil.toISOString(),
        lock_reason: 'auto_follow_business',
        use_count: 0,
        metadata: { apps },
      })
      .select()
      .single();

    if (pinError) {
      console.error('[auto-pin] Failed to create pin:', pinError);
      throw pinError;
    }

    console.log('[auto-pin] Created new locked pin:', newPin.id);

    // 5. Log to AI action ledger
    await supabase.from('ai_action_ledger').insert({
      user_id: userId,
      agent: 'system',
      action: 'pin_autocreated',
      input: { businessId, apps },
      output: { pinId: newPin.id, lockedUntil },
      result: 'success',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        pinId: newPin.id,
        locked: true,
        lockedUntil,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[auto-pin] Error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
