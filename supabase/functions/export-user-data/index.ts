import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { createLogger } from '../_shared/logger.ts';
import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'export-user-data', RateLimits.auth);
  if (limited) return limited;

  const log = createLogger('export-user-data');
  log.startTimer();

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify auth
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      log.warn('Unauthorized export attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id } = await req.json();
    
    // Only allow users to export their own data
    if (user_id !== user.id) {
      log.warn('User attempted to export another user data', { user_id, requester: user.id });
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    log.info('Exporting user data', { user_id });

    // Collect all user data across tables
    const exportData: Record<string, any> = {
      export_date: new Date().toISOString(),
      user_id,
    };

    // Profile data
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id);
    exportData.profiles = profiles || [];

    // Posts
    const { data: posts } = await supabase
      .from('posts')
      .select('*')
      .eq('author_user_id', user_id);
    exportData.posts = posts || [];

    // Saved posts
    const { data: savedPosts } = await supabase
      .from('saved_posts')
      .select('*')
      .eq('user_id', user_id);
    exportData.saved_posts = savedPosts || [];

    // Horses
    const { data: horses } = await supabase
      .from('horses')
      .select('*')
      .eq('owner_id', user_id);
    exportData.horses = horses || [];

    // Calendar events
    const { data: events } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('created_by', user_id);
    exportData.calendar_events = events || [];

    // Businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user_id);
    exportData.businesses = businesses || [];

    // AI memories (non-sensitive only)
    const { data: memories } = await supabase
      .from('ai_user_memory')
      .select('type, key, value, created_at')
      .eq('user_id', user_id)
      .neq('sensitivity', 'high');
    exportData.ai_memories = memories || [];

    // Marketplace listings
    const { data: listings } = await supabase
      .from('marketplace_listings')
      .select('*')
      .eq('created_by', user_id);
    exportData.marketplace_listings = listings || [];

    // Convert to JSON and create download
    const jsonData = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    
    // In production, upload to storage and return signed URL
    // For now, return inline data
    log.info('Export complete', { 
      tables_exported: Object.keys(exportData).length,
      size_bytes: jsonData.length 
    });

    return new Response(JSON.stringify({
      success: true,
      download_url: null, // In prod: signed storage URL
      data: exportData,
      size_bytes: jsonData.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    log.error('Export failed', error);
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
