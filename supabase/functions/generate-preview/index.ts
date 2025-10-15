import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { entityType, entityId } = await req.json();

    if (!entityType || !entityId) {
      return new Response(JSON.stringify({ error: 'entityType and entityId are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating preview for ${entityType}:${entityId}`);

    // Fetch entity data based on type
    let entityData: any = null;
    let tableName = '';

    switch (entityType) {
      case 'profile':
        tableName = 'profiles';
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', entityId)
          .single();
        entityData = profile;
        break;

      case 'horse':
        tableName = 'entity_profiles';
        const { data: horse } = await supabase
          .from('entity_profiles')
          .select('*')
          .eq('id', entityId)
          .eq('entity_type', 'horse')
          .single();
        entityData = horse;
        break;

      case 'business':
        tableName = 'businesses';
        const { data: business } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', entityId)
          .single();
        entityData = business;
        break;

      default:
        return new Response(JSON.stringify({ error: 'Invalid entity type' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    if (!entityData) {
      return new Response(JSON.stringify({ error: 'Entity not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a rich preview object
    const preview = {
      type: entityType,
      id: entityId,
      name: entityData.name || entityData.display_name || 'Unknown',
      image: entityData.avatar_url || entityData.custom_fields?.profile_image_url || entityData.capabilities?.logo_url,
      description: entityData.bio || entityData.description || '',
      metadata: {
        created_at: entityData.created_at,
        updated_at: entityData.updated_at,
        is_claimed: entityData.is_claimed,
        slug: entityData.slug
      },
      // Generate preview URL for client to render
      previewUrl: `${supabaseUrl.replace('supabase.co', 'lovableproject.com')}/${entityType}s/${entityData.slug || entityId}`
    };

    // Audit log
    await supabase.rpc('audit_write', {
      p_actor: user.id,
      p_role: 'user',
      p_tenant: '00000000-0000-0000-0000-000000000000',
      p_action: 'preview.generate',
      p_scope: entityType,
      p_targets: [entityId],
      p_meta: { preview_generated: true }
    });

    return new Response(JSON.stringify({ preview }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-preview:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
