import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: { Authorization: authHeader! },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      name, 
      website, 
      phone, 
      city, 
      state, 
      bio,
      categories, 
      ai, 
      claim_entity_id 
    } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Business name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let categoryKeys: { key: string; status: string }[] = [];

    // AI classification if requested
    if (ai && categories?.length === 0) {
      const classifyRes = await fetch(`${supabaseUrl}/functions/v1/ai-classify-business`, {
        method: "POST",
        headers: {
          "Authorization": authHeader!,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, website, examples: [] })
      });

      if (classifyRes.ok) {
        const classified = await classifyRes.json();
        if (classified.categories) {
          categories.push(...classified.categories);
        }
      }
    }

    // Ensure all categories exist
    if (categories?.length > 0) {
      for (const cat of categories) {
        const ensureRes = await fetch(`${supabaseUrl}/functions/v1/categories-ensure`, {
          method: "POST",
          headers: {
            "Authorization": authHeader!,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            label: cat.label,
            parent_key: cat.parent_key || null,
            synonyms: cat.synonyms || [],
            evidence: { business_name: name, website }
          })
        });

        if (ensureRes.ok) {
          const ensured = await ensureRes.json();
          if (ensured.key) {
            categoryKeys.push({ key: ensured.key, status: ensured.status });
          }
        }
      }
    }

    let entityId: string;
    let slug: string;

    // Handle claim vs create
    if (claim_entity_id) {
      // Claim ghost entity
      const { error: claimError } = await supabase.rpc('claim_ghost_entity', {
        p_entity: claim_entity_id,
        p_user: user.id
      });

      if (claimError) throw claimError;

      // Get entity details
      const { data: entity } = await supabase
        .from('entities')
        .select('id, slug')
        .eq('id', claim_entity_id)
        .single();

      if (!entity) throw new Error('Entity not found');
      
      entityId = entity.id;
      slug = entity.slug;
    } else {
      // Create new business
      const { data: newEntityId, error: createError } = await supabase.rpc('create_business_quick', {
        p_owner_user: user.id,
        p_name: name,
        p_categories: [], // Old system, deprecated
        p_website: website || null,
        p_phone: phone || null,
        p_city: city || null,
        p_state: state || null,
        p_bio: bio || null
      });

      if (createError) throw createError;
      if (!newEntityId) throw new Error('Failed to create entity');

      entityId = newEntityId;

      // Get slug
      const { data: entity } = await supabase
        .from('entities')
        .select('slug')
        .eq('id', entityId)
        .single();

      slug = entity?.slug || name.toLowerCase().replace(/\s+/g, '-');
    }

    // Attach marketplace categories
    if (categoryKeys.length > 0) {
      const inserts = categoryKeys.map(cat => ({
        entity_id: entityId,
        category_key: cat.key
      }));

      await supabase
        .from('entity_marketplace_categories')
        .insert(inserts)
        .select();
    }

    return new Response(
      JSON.stringify({
        entity_id: entityId,
        profile_slug: slug,
        categories: categoryKeys
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Business quick setup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
