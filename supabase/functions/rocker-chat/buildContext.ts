import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

export async function buildUserContext(
  supabaseClient: SupabaseClient,
  userId: string,
  userEmail?: string
): Promise<string> {
  let context = `\n\n**CURRENT USER:**\n- User ID: ${userId}\n- Email: ${userEmail || 'Not provided'}`;

  try {
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name, bio')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: userRoles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    const roles = (userRoles || []).map((r: any) => r.role);
    
    if (roles.length > 0) {
      context += `\n- Roles: ${roles.join(', ')}`;
    }

    const { data: memoryData } = await supabaseClient.functions.invoke('rocker-memory', {
      body: {
        action: 'search_memory',
        limit: 25
      }
    });

    const { data: analytics } = await supabaseClient
      .from('ai_user_analytics')
      .select('*')
      .eq('user_id', userId)
      .order('calculated_at', { ascending: false })
      .limit(5);

    if (profile) {
      context += `\n- Name: ${profile.display_name || 'Not set'}`;
      if (profile.bio) {
        context += `\n- Bio: ${profile.bio}`;
      }
    }

    if (memoryData?.memories?.length > 0) {
      context += `\n\n**USER MEMORY:**\n${memoryData.memories.slice(0, 10).map((m: any) => 
        `- ${m.key}: ${JSON.stringify(m.value)}`
      ).join('\n')}`;
    }

    if (analytics && analytics.length > 0) {
      context += `\n\n**USER ANALYTICS:**\n${analytics.slice(0, 3).map((a: any) => 
        `- ${a.metric_type}: ${a.metric_value}`
      ).join('\n')}`;
    }
  } catch (err: any) {
    context += `\n\n[Context loading error: ${err.message}]`;
  }

  return context;
}
