import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

async function analyzeFiling(content: string) {
  const prompt = `Analyze this content and determine detailed project-based filing:

Content: ${content.slice(0, 2000)}

Return JSON with:
{
  "project": "Specific project name (e.g., 'Website Redesign', 'Q1 Budget', 'Marketing Campaign')",
  "folder_path": "Deep nested path with project/phase/category/subcategory (e.g., 'Website Redesign/Backend/API/Authentication' or 'Finance/2025/Q1/Expenses/Office')",
  "name": "Descriptive filename",
  "category": "Main category",
  "summary": "Brief summary",
  "tags": ["detailed", "specific", "tags"],
  "confidence": 0-100,
  "should_split": false,
  "split_reason": "If content covers multiple projects/topics, explain why it should be split"
}

Be MICRO-LEVEL specific. Use actual project names, deep folder hierarchies (3-5 levels), and detailed tags. If content spans multiple projects/topics, set should_split=true.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) throw new Error(`AI error: ${response.status}`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    // Get all embedded knowledge items
    const { data: items, error: fetchErr } = await sb
      .from("rocker_knowledge")
      .select("id, content")
      .not("embedding", "is", null);

    if (fetchErr) throw fetchErr;
    if (!items || items.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No items to process" }), {
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    let processed = 0;
    const results = [];

    for (const item of items) {
      try {
        const analysis = await analyzeFiling(item.content);
        
        // Check if already filed
        const { data: existing } = await sb
          .from("rocker_files")
          .select("id")
          .eq("knowledge_id", item.id)
          .maybeSingle();

        if (existing) {
          // Update existing file
          await sb
            .from("rocker_files")
            .update({
              project: analysis.project,
              folder_path: analysis.folder_path,
              name: analysis.name,
              category: analysis.category,
              summary: analysis.summary,
              tags: analysis.tags,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Create new file entry
          await sb
            .from("rocker_files")
            .insert({
              knowledge_id: item.id,
              project: analysis.project,
              folder_path: analysis.folder_path,
              name: analysis.name,
              category: analysis.category,
              summary: analysis.summary,
              tags: analysis.tags,
            });
        }

        processed++;
        results.push({
          id: item.id,
          project: analysis.project,
          folder_path: analysis.folder_path,
          confidence: analysis.confidence,
        });

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
      } catch (e) {
        console.error(`Failed to process item ${item.id}:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      processed, 
      total: items.length,
      results 
    }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[rocker-reprocess-all]", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
