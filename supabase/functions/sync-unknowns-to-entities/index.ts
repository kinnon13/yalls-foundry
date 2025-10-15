import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch unknowns from AI memory that haven't been converted to entities
    const { data: unknowns, error: unknownsError } = await supabase
      .from('ai_user_memory')
      .select('*')
      .eq('type', 'unknown')
      .eq('visibility', 'shared')
      .order('created_at', { ascending: false })
      .limit(100);

    if (unknownsError) throw unknownsError;

    const created = [];
    const skipped = [];

    for (const unknown of unknowns || []) {
      try {
        // Parse the unknown to determine entity type (with size guard)
        let value;
        try {
          const rawValue = typeof unknown.value === 'string' ? unknown.value : JSON.stringify(unknown.value);
          if (rawValue.length > 50000) {
            throw new Error('Value too large');
          }
          value = typeof unknown.value === 'string' ? JSON.parse(unknown.value) : unknown.value;
        } catch (parseError) {
          skipped.push({ unknown: unknown.id, reason: 'json_parse_error' });
          continue;
        }

        const entityName = unknown.key || value.name || value.title;
        
        if (!entityName || entityName.length > 500) {
          skipped.push({ unknown: unknown.id, reason: 'invalid_name' });
          continue;
        }

        // Normalize name for deduplication
        const normalizedName = entityName.trim().toLowerCase().replace(/\s+/g, ' ');

        // Determine entity type from tags or content
        let entityType = 'person'; // default
        const tags = unknown.tags || [];
        const key = (unknown.key || '').toLowerCase();
        
        if (tags.includes('business') || key.includes('business') || key.includes('company')) {
          entityType = 'business';
        } else if (tags.includes('horse') || key.includes('horse')) {
          entityType = 'horse';
        } else if (tags.includes('product') || key.includes('product')) {
          entityType = 'product';
        }

        // Check for existing entity (application-level deduplication)
        const { data: existingEntity } = await supabase
          .from('entity_profiles')
          .select('id')
          .eq('entity_type', entityType)
          .eq('normalized_name', normalizedName)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingEntity) {
          skipped.push({ unknown: unknown.id, reason: 'duplicate', entity_id: existingEntity.id });
          
          // Log audit
          await supabase.from('entity_ingest_log').insert({
            unknown_memory_id: unknown.id,
            entity_id: existingEntity.id,
            action: 'duplicate',
            reason: 'Entity already exists',
            by_user_id: unknown.user_id,
          });
          continue;
        }

        // Create new entity profile
        const { data: newEntity, error: createError } = await supabase
          .from('entity_profiles')
          .insert({
            name: entityName,
            normalized_name: normalizedName,
            slug: normalizedName.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            entity_type: entityType,
            claimed_by: null,
            is_claimed: false,
            custom_fields: {
              source: 'ai_unknown',
              original_memory_id: unknown.id,
              discovered_at: unknown.created_at,
              discovered_by: unknown.user_id,
              confidence: unknown.confidence || 0.5,
              tags: tags,
              ...value,
            },
          })
          .select()
          .single();

        if (createError) {
          skipped.push({ unknown: unknown.id, reason: 'create_failed', error: createError.message });
          continue;
        }

        // Update the unknown memory to mark it as synced
        await supabase
          .from('ai_user_memory')
          .update({
            tags: [...(tags || []), 'synced_to_entity'],
            namespace: `entity:${newEntity.id}`,
          })
          .eq('id', unknown.id);

        // Log audit
        await supabase.from('entity_ingest_log').insert({
          unknown_memory_id: unknown.id,
          entity_id: newEntity.id,
          action: 'created',
          reason: 'Auto-created from AI unknown',
          by_user_id: unknown.user_id,
        });

        created.push({
          unknown_id: unknown.id,
          entity_id: newEntity.id,
          entity_name: entityName,
          entity_type: entityType,
        });

      } catch (error) {
        console.error('Error processing unknown:', unknown.id, error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        skipped.push({ unknown: unknown.id, reason: 'processing_error', error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: unknowns?.length || 0,
        created: created.length,
        skipped: skipped.length,
        details: { created, skipped },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Sync unknowns error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
