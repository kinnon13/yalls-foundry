import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all files that need organization
    const { data: files, error: fetchError } = await supabase
      .from("rocker_files")
      .select("id, thread_id")
      .not("text_content", "is", null)
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    let queued = 0;
    
    // Trigger organization for each file's thread
    const uniqueThreads = new Set<string>();
    for (const file of files || []) {
      if (file.thread_id && !uniqueThreads.has(file.thread_id)) {
        uniqueThreads.add(file.thread_id);
        
        // Fire and forget - queue organization
        supabase.functions.invoke('rocker-organize-knowledge', {
          body: { thread_id: file.thread_id }
        }).catch(err => {
          console.log('[OrganizeAll] Queued for thread:', file.thread_id);
        });
        
        queued++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        queued,
        message: `Queued organization for ${queued} threads` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("[OrganizeAll] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
