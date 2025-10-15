import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client for auth verification with user's JWT
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! }
        }
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create service role client for database operations (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { operation, ...params } = await req.json();

    let result;
    switch (operation) {
      case 'create_calendar':
        result = await createCalendar(supabase, user.id, params);
        break;
      case 'create_event':
        result = await createEvent(supabase, user.id, params);
        break;
      case 'share_calendar':
        result = await shareCalendar(supabase, params);
        break;
      case 'create_collection':
        result = await createCollection(supabase, user.id, params);
        break;
      case 'add_to_collection':
        result = await addToCollection(supabase, params);
        break;
      case 'get_collection_events':
        result = await getCollectionEvents(supabase, params);
        break;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Calendar ops error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function createCalendar(supabase: any, userId: string, params: any) {
  const { name, calendar_type, color, description } = params;

  // Insert calendar with authenticated user as owner
  const { data, error } = await supabase
    .from('calendars')
    .insert({
      owner_profile_id: userId,
      name,
      calendar_type: calendar_type || 'personal',
      color: color || '#3b82f6',
      description
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating calendar:', error);
    throw error;
  }
  
  console.log('Calendar created successfully:', data);
  return { calendar: data };
}

async function createEvent(supabase: any, userId: string, params: any) {
  const {
    calendar_id,
    title,
    description,
    location,
    starts_at,
    ends_at,
    all_day,
    visibility,
    event_type
  } = params;

  // Verify calendar access
  const { data: access } = await supabase.rpc('has_calendar_access', {
    _calendar_id: calendar_id,
    _profile_id: userId,
    _min_role: 'writer'
  });

  if (!access) {
    throw new Error('No write access to calendar');
  }

  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      calendar_id,
      created_by: userId,
      title,
      description,
      location,
      starts_at,
      ends_at,
      all_day: all_day || false,
      visibility: visibility || 'private',
      event_type
    })
    .select()
    .single();

  if (error) throw error;
  return { event: data };
}

async function shareCalendar(supabase: any, params: any) {
  const { calendar_id, profile_id, role, busy_only } = params;

  const { data, error } = await supabase
    .from('calendar_shares')
    .upsert({
      calendar_id,
      profile_id,
      role: role || 'reader',
      busy_only: busy_only || false
    })
    .select()
    .single();

  if (error) throw error;
  return { share: data };
}

async function createCollection(supabase: any, userId: string, params: any) {
  const { name, description, color, calendar_ids } = params;

  // Use the authenticated user's ID as owner_profile_id
  const { data: collection, error: collectionError } = await supabase
    .from('calendar_collections')
    .insert({
      owner_profile_id: userId,
      name,
      description,
      color: color || '#8b5cf6'
    })
    .select()
    .single();

  if (collectionError) {
    console.error('Error creating collection:', collectionError);
    throw collectionError;
  }

  console.log('Collection created successfully:', collection);

  // Add calendars to collection
  if (calendar_ids && calendar_ids.length > 0) {
    const members = calendar_ids.map((calendar_id: string) => ({
      collection_id: collection.id,
      calendar_id
    }));

    const { error: membersError } = await supabase
      .from('calendar_collection_members')
      .insert(members);

    if (membersError) {
      console.error('Error adding calendars to collection:', membersError);
      throw membersError;
    }
  }

  return { collection };
}

async function addToCollection(supabase: any, params: any) {
  const { collection_id, calendar_id } = params;

  const { data, error } = await supabase
    .from('calendar_collection_members')
    .insert({ collection_id, calendar_id })
    .select()
    .single();

  if (error) throw error;
  return { member: data };
}

async function getCollectionEvents(supabase: any, params: any) {
  const { collection_id, starts_at, ends_at } = params;

  // Get all calendars in collection
  const { data: members, error: membersError } = await supabase
    .from('calendar_collection_members')
    .select('calendar_id')
    .eq('collection_id', collection_id);

  if (membersError) throw membersError;

  const calendar_ids = members.map((m: any) => m.calendar_id);

  if (calendar_ids.length === 0) {
    return { events: [] };
  }

  // Get events from all calendars
  let query = supabase
    .from('calendar_events')
    .select('*, calendars(name, color)')
    .in('calendar_id', calendar_ids)
    .order('starts_at', { ascending: true });

  if (starts_at) {
    query = query.gte('starts_at', starts_at);
  }
  if (ends_at) {
    query = query.lte('ends_at', ends_at);
  }

  const { data: events, error: eventsError } = await query;

  if (eventsError) throw eventsError;

  return { events };
}
