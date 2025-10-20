/**
 * Ingest Paste - Bulk text ingestion
 * Handles massive text pastes (up to 250k chars), chunks, summarizes, and files
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { subject, text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: "text required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const title = subject || "Untitled paste";
    
    // Basic chunking for massive text
    const MAX_CHUNK = 20000;
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += MAX_CHUNK) {
      chunks.push(text.slice(i, i + MAX_CHUNK));
    }

    // Generate summary (first 500 chars as fallback)
    const summary = (text.slice(0, 500) + (text.length > 500 ? "…" : "")).trim();

    // Auto-categorize based on keywords
    let category = null;
    const lowerText = text.toLowerCase();
    if (lowerText.includes("sow") || lowerText.includes("contract") || lowerText.includes("agreement")) {
      category = "Legal";
    } else if (lowerText.includes("p&l") || lowerText.includes("budget") || lowerText.includes("invoice")) {
      category = "Finance";
    } else if (lowerText.includes("launch") || lowerText.includes("campaign") || lowerText.includes("marketing")) {
      category = "Marketing";
    } else if (lowerText.includes("roadmap") || lowerText.includes("feature") || lowerText.includes("sprint")) {
      category = "Product";
    }

    // Extract simple tags
    const tags: string[] = [];
    if (lowerText.includes("q4") || lowerText.includes("q 4")) tags.push("Q4");
    if (lowerText.includes("investor")) tags.push("investor");
    if (lowerText.includes("urgent") || lowerText.includes("asap")) tags.push("urgent");

    // Insert into rocker_files
    const { data: file, error: fileError } = await supabase
      .from("rocker_files")
      .insert({
        user_id: user.id,
        title,
        category,
        tags,
        summary,
        text_content: text,
        source: "paste",
        status: "inbox",
        starred: false,
      })
      .select()
      .single();

    if (fileError) {
      console.error("File insert error:", fileError);
      return new Response(
        JSON.stringify({ error: fileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Write to long-term memory
    await supabase.from("rocker_long_memory").insert({
      user_id: user.id,
      kind: "paste",
      source_id: file.id,
      title,
      summary,
      keywords: tags,
    });

    // Also store in vault for embeddings later
    await supabase.from("rocker_vault_docs").insert({
      user_id: user.id,
      title,
      doc_type: "paste",
      text_content: text,
      metadata: { category, tags, chunks: chunks.length },
    });

    return new Response(
      JSON.stringify({ 
        ok: true, 
        id: file.id, 
        chunks: chunks.length,
        category,
        tags,
        summary: summary.slice(0, 200) + "..."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("ingest-paste error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
