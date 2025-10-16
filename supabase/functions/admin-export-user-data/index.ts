import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with service role to bypass RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get the user making the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      SUPABASE_URL,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify user is super admin
    const { data: isSuperAdmin } = await supabaseAdmin.rpc('is_super_admin', {
      _user_id: user.id
    });

    if (!isSuperAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only super admins can export user data' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { target_user_id, reason } = await req.json();

    if (!target_user_id) {
      throw new Error('target_user_id is required');
    }

    console.log(`Super admin ${user.id} exporting data for user ${target_user_id}`);

    // Fetch all user data using service role (bypasses RLS)
    const [
      profileData,
      conversationsData,
      memoriesData,
      interactionsData,
      postsData,
      calendarData,
      businessData
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('user_id', target_user_id).single(),
      supabaseAdmin.from('rocker_conversations').select('*').eq('user_id', target_user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('ai_user_memory').select('*').eq('user_id', target_user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('ai_interaction_log').select('*').eq('user_id', target_user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('posts').select('*').eq('author_id', target_user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('calendar_events').select('*').eq('created_by', target_user_id).order('created_at', { ascending: false }),
      supabaseAdmin.from('businesses').select('*').eq('owner_id', target_user_id).order('created_at', { ascending: false })
    ]);

    // Log this export action to audit log
    await supabaseAdmin.from('admin_audit_log').insert({
      actor_user_id: user.id,
      action: 'export_user_data',
      metadata: {
        target_user_id,
        reason: reason || 'Legal/compliance export',
        export_timestamp: new Date().toISOString(),
        data_types: ['profile', 'conversations', 'memories', 'interactions', 'posts', 'calendar', 'businesses']
      }
    });

    const exportData = {
      export_metadata: {
        exported_by: user.id,
        exported_at: new Date().toISOString(),
        target_user_id,
        reason: reason || 'Legal/compliance export',
        export_type: 'super_admin_full_export'
      },
      profile: profileData.data,
      conversations: {
        total: conversationsData.data?.length || 0,
        data: conversationsData.data || [],
        note: 'Includes ALL conversations including private ones'
      },
      memories: {
        total: memoriesData.data?.length || 0,
        data: memoriesData.data || [],
        note: 'Includes ALL AI memories including private ones'
      },
      interactions: {
        total: interactionsData.data?.length || 0,
        data: interactionsData.data || [],
        note: 'Complete AI interaction history'
      },
      posts: {
        total: postsData.data?.length || 0,
        data: postsData.data || []
      },
      calendar_events: {
        total: calendarData.data?.length || 0,
        data: calendarData.data || []
      },
      businesses: {
        total: businessData.data?.length || 0,
        data: businessData.data || []
      }
    };

    return new Response(
      JSON.stringify(exportData),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="user-${target_user_id}-export-${Date.now()}.json"`
        } 
      }
    );

  } catch (error) {
    console.error('Error exporting user data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
