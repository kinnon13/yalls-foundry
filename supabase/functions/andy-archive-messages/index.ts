/**
 * Andy Message Archival
 * Moves messages older than 250 count to long-term memory
 * Runs every hour via cron
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all users with messages
    const { data: users } = await supabaseClient
      .from('rocker_messages')
      .select('user_id')
      .order('created_at', { ascending: false });

    if (!users) {
      return new Response(JSON.stringify({ archived: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uniqueUserIds = [...new Set(users.map(u => u.user_id))];
    let totalArchived = 0;

    for (const userId of uniqueUserIds) {
      // Count messages for this user
      const { count } = await supabaseClient
        .from('rocker_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count && count > 250) {
        // Get messages beyond the 250 most recent
        const { data: oldMessages } = await supabaseClient
          .from('rocker_messages')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .range(250, count);

        if (oldMessages && oldMessages.length > 0) {
          // Archive to long-term memory
          const memoryEntries = oldMessages.map(msg => ({
            user_id: userId,
            content: `[${msg.role}] ${msg.content}`,
            metadata: { 
              archived_from: 'rocker_messages',
              original_id: msg.id,
              created_at: msg.created_at 
            }
          }));

          await supabaseClient
            .from('rocker_long_memory')
            .insert(memoryEntries);

          // Delete archived messages
          const messageIds = oldMessages.map(m => m.id);
          await supabaseClient
            .from('rocker_messages')
            .delete()
            .in('id', messageIds);

          totalArchived += oldMessages.length;
          console.log(`Archived ${oldMessages.length} messages for user ${userId}`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      archived: totalArchived,
      users_processed: uniqueUserIds.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Archive error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
