import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { createLogger } from "../_shared/logger.ts";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('auto-sync-entities');
  log.startTimer();

  // Apply rate limiting
  const limited = await withRateLimit(req, 'auto-sync-entities', RateLimits.standard);
  if (limited) return limited;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    log.info('Starting automatic entity discovery');

    // Find AI memories with entity references that aren't synced yet
    const { data: unknowns, error: fetchError } = await supabase
      .from('ai_user_memory')
      .select('id, key, value, type, tags, created_at')
      .contains('tags', ['unknown'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (fetchError) {
      log.error('Error fetching unknowns', fetchError);
      throw fetchError;
    }

    if (!unknowns || unknowns.length === 0) {
      log.info('No new entities to discover');
      return new Response(
        JSON.stringify({ created: 0, skipped: 0, message: 'No new entities found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let created = 0;
    let skipped = 0;

    for (const unknown of unknowns) {
      try {
        // Parse the value
        const value = typeof unknown.value === 'string' 
          ? JSON.parse(unknown.value) 
          : unknown.value;

        const entityName = value.name || value.entity_name || unknown.key;
        const entityType = value.type || value.entity_type || 'person';

        if (!entityName || entityName.length < 2) {
          skipped++;
          continue;
        }

        // Normalize name for deduplication
        const normalized = entityName.trim().toLowerCase().replace(/\s+/g, ' ');

        // Check if already exists
        const { data: existing } = await supabase
          .from('entity_profiles')
          .select('id')
          .eq('entity_type', entityType)
          .eq('normalized_name', normalized)
          .maybeSingle();

        if (existing) {
          log.info('Skipping duplicate', { entityName });
          
          // Log as skipped
          await supabase.from('entity_ingest_log').insert({
            unknown_memory_id: unknown.id,
            entity_id: existing.id,
            action: 'skipped',
            reason: 'duplicate',
            metadata: { normalized_name: normalized }
          });
          
          skipped++;
          continue;
        }

        // Create new entity
        const { data: newEntity, error: insertError } = await supabase
          .from('entity_profiles')
          .insert({
            name: entityName,
            normalized_name: normalized,
            entity_type: entityType,
            is_claimed: false,
            metadata: {
              source: 'ai_discovery',
              discovered_at: new Date().toISOString(),
              original_unknown_id: unknown.id,
              ...value
            }
          })
          .select()
          .single();

        if (insertError) {
          log.error('Error creating entity', insertError, { entityName });
          skipped++;
          continue;
        }

        // Log successful creation
        await supabase.from('entity_ingest_log').insert({
          unknown_memory_id: unknown.id,
          entity_id: newEntity.id,
          action: 'created',
          reason: 'auto_discovery',
          metadata: { 
            entity_name: entityName,
            normalized_name: normalized 
          }
        });

        log.info('Created entity', { entityName, entityType });
        created++;

      } catch (error) {
        log.error('Error processing unknown', error, { unknown_id: unknown.id });
        skipped++;
      }
    }

    const result = { created, skipped };
    log.info('Complete', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('Fatal error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});