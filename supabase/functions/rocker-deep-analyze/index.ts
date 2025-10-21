/**
 * Rocker Deep Analysis - God-Level Filing with Web Research
 * 
 * Breaks content into micro-sections, researches unclear topics,
 * provides sentence-level filing decisions with 2-3 options
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  return new Response(JSON.stringify({ 
    error: "This function has been disabled. Rocker now uses OpenAI exclusively. Use rocker-chat instead." 
  }), {
    status: 503,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

