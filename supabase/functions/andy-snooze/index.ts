import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseDurationOrUntil(input: string): { until: Date } | null {
  const s = input.toLowerCase();

  // Parse durations: "1h", "30m", "2 days", "90 minutes"
  const dur = /(\d+)\s*(hour|hr|h|minute|min|m|day|d)s?/g;
  let ms = 0;
  let match;
  
  while ((match = dur.exec(s)) !== null) {
    const n = parseInt(match[1], 10);
    const unit = match[2][0];
    if (unit === 'h') ms += n * 60 * 60 * 1000;
    else if (unit === 'm') ms += n * 60 * 1000;
    else if (unit === 'd') ms += n * 24 * 60 * 60 * 1000;
  }
  
  if (ms > 0) {
    return { until: new Date(Date.now() + ms) };
  }

  // Parse "until" phrases: "until 5pm", "until tomorrow 9am", "until Oct 22 3:15pm"
  const untilMatch = s.match(/until\s+(.+)/);
  if (untilMatch) {
    const timeStr = untilMatch[1].trim();
    
    // Try common time formats
    const now = new Date();
    
    // "5pm" or "17:00"
    const timeOnlyMatch = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
    if (timeOnlyMatch) {
      let hours = parseInt(timeOnlyMatch[1]);
      const minutes = timeOnlyMatch[2] ? parseInt(timeOnlyMatch[2]) : 0;
      const meridiem = timeOnlyMatch[3]?.toLowerCase();
      
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      
      const target = new Date(now);
      target.setHours(hours, minutes, 0, 0);
      
      // If time is in the past, assume tomorrow
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      
      return { until: target };
    }
    
    // Try Date constructor for full dates
    const dt = new Date(timeStr);
    if (!isNaN(dt.getTime()) && dt > now) {
      return { until: dt };
    }
  }

  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, thread_id, text, scope } = await req.json();
    
    if (!user_id || !text) {
      return new Response(JSON.stringify({ 
        error: 'Missing user_id or text' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('😴 Snooze request:', { user_id, thread_id, text, scope });

    // Check for "unmute" / "turn back on"
    if (/unmute|turn\s+(back\s+)?on|wake\s+up|resume/i.test(text)) {
      console.log('👋 Unsnoozing...');
      
      if (scope === 'thread' && thread_id) {
        await supabase
          .from('ai_thread_prefs')
          .upsert({
            user_id,
            thread_id,
            snoozed_until: null
          });
      } else {
        await supabase
          .from('ai_preferences')
          .update({ snoozed_until: null })
          .eq('user_id', user_id);
      }
      
      return new Response(JSON.stringify({ 
        ok: true,
        action: 'unsnooze',
        scope: scope || 'global'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse time
    const parsed = parseDurationOrUntil(text);
    
    if (!parsed?.until) {
      console.log('❌ Could not parse time from:', text);
      return new Response(JSON.stringify({ 
        ok: false,
        error: 'Could not parse time. Try: "for 90 minutes", "until 5pm", or "for 2 days"'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('⏰ Snoozing until:', parsed.until.toISOString());

    // Apply snooze
    if (scope === 'thread' && thread_id) {
      await supabase
        .from('ai_thread_prefs')
        .upsert({
          user_id,
          thread_id,
          snoozed_until: parsed.until.toISOString()
        });
    } else {
      await supabase
        .from('ai_preferences')
        .update({ snoozed_until: parsed.until.toISOString() })
        .eq('user_id', user_id);
    }

    return new Response(JSON.stringify({ 
      ok: true,
      until: parsed.until.toISOString(),
      scope: scope || 'global',
      message: `Snoozed ${scope === 'thread' ? 'this thread' : 'globally'} until ${parsed.until.toLocaleString()}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-snooze:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
