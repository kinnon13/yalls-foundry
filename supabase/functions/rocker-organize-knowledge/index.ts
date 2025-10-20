/**
 * Rocker Interactive File Organization
 * Analyzes content and asks user where to file it when uncertain
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CONFIDENCE_THRESHOLD = 0.85;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization');

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');

    const { thread_id, content_id, approve, suggestion } = await req.json();

    // If this is an approval response
    if (approve !== undefined && suggestion) {
      return await handleApproval(supabase, user.id, content_id, approve, suggestion);
    }

    console.log(`[Organize] Analyzing content for thread: ${thread_id}`);

    // Get unorganized knowledge chunks
    const { data: chunks, error: chunksError } = await supabase
      .from('rocker_knowledge')
      .select('id, content, chunk_index, meta, created_at')
      .eq('user_id', user.id)
      .eq('meta->>thread_id', thread_id)
      .is('meta->>organized', null)
      .order('chunk_index', { ascending: true });

    if (chunksError) throw chunksError;
    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No chunks to organize' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const fullContent = chunks.map(c => c.content).join('\n\n');
    const subject = chunks[0].meta?.subject || 'Knowledge';

    // Use AI to analyze and suggest filing
    const filingSuggestion = await analyzeFiling(fullContent, subject);

    console.log(`[Organize] Confidence: ${filingSuggestion.confidence}, Category: ${filingSuggestion.category}`);

    // If confidence is high, auto-file
    if (filingSuggestion.confidence >= CONFIDENCE_THRESHOLD) {
      const file = await createFile(supabase, user.id, thread_id, fullContent, subject, filingSuggestion);
      
      await supabase
        .from('rocker_knowledge')
        .update({ meta: { ...chunks[0].meta, organized: true, file_id: file.id } })
        .in('id', chunks.map(c => c.id));

      return new Response(
        JSON.stringify({ 
          success: true, 
          auto_filed: true,
          file: { id: file.id, name: file.name, category: file.category }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Low confidence - ask user
    const pendingId = `pending_${Date.now()}`;
    await supabase
      .from('rocker_knowledge')
      .update({ 
        meta: { 
          ...chunks[0].meta, 
          pending_filing: pendingId,
          suggested: filingSuggestion 
        } 
      })
      .in('id', chunks.map(c => c.id));

    // Post to chat asking where to file
    await supabase.from('rocker_messages').insert({
      thread_id,
      user_id: user.id,
      role: 'assistant',
      content: `📁 **Filing Question** (${Math.round(filingSuggestion.confidence * 100)}% confidence)

I analyzed: **${subject}**

My suggestion:
• Project/Category: **${filingSuggestion.category}**
• Folder Path: **${filingSuggestion.folder_path || '(root)'}**
• Tags: ${filingSuggestion.tags.join(', ')}

${filingSuggestion.reasoning}

Is this correct? Reply:
• "yes" to file there
• "ProjectName/Category/Subfolder" to file in a specific path
• Or tell me exactly where it belongs`,
      meta: { 
        type: 'filing_request',
        pending_id: pendingId,
        suggestion: filingSuggestion 
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        asked_user: true,
        suggestion: filingSuggestion 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Organize] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function analyzeFiling(content: string, subject: string) {
  const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
  const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
  
  const prompt = `Analyze this content and suggest MICRO-LEVEL project-based filing:

Title: ${subject}
Content: ${content.substring(0, 2000)}

CRITICAL RULES:
1. Identify the SPECIFIC PROJECT NAME first (not just "Projects")
2. Create detailed folder path: "ProjectName/Phase/Category/Subcategory"
3. If content covers multiple topics, suggest splitting into separate files
4. Be VERY SPECIFIC - avoid generic categories
5. Include micro-level tags for precise retrieval

Example good paths:
- "AgTech Platform/MVP Launch/Backend/API Design"
- "Q1 Marketing/Social Campaign/Instagram/Content Calendar"
- "Personal/Health/Workout Plans/2025 Q1"

Return JSON: 
{
  "project": "Specific project name",
  "category": "Main category",
  "folder_path": "Full/Micro/Level/Path", 
  "tags": ["specific", "detailed", "tags"],
  "reasoning": "Why this exact filing location",
  "confidence": 0.8,
  "should_split": false,
  "split_suggestions": []
}`;

  try {
    const apiKey = LOVABLE_KEY || OPENAI_KEY;
    const url = LOVABLE_KEY ? 'https://ai.gateway.lovable.dev/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
    const model = LOVABLE_KEY ? 'google/gemini-2.5-flash' : 'gpt-4o-mini';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) throw new Error('AI request failed');

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('[Organize] AI analysis failed:', e);
  }

  // Fallback to rule-based
  return {
    category: smartCategorize(content),
    folder_path: null,
    tags: extractKeywords(content).slice(0, 5),
    reasoning: 'Based on keyword analysis (AI unavailable)',
    confidence: 0.6,
  };
}

async function handleApproval(supabase: any, userId: string, pendingId: string, approve: boolean, suggestion: any) {
  const { data: chunks } = await supabase
    .from('rocker_knowledge')
    .select('*')
    .eq('user_id', userId)
    .eq('meta->>pending_filing', pendingId);

  if (!chunks || chunks.length === 0) {
    return new Response(
      JSON.stringify({ error: 'Pending filing not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (!approve) {
    // User rejected - clear pending
    await supabase
      .from('rocker_knowledge')
      .update({ meta: { ...chunks[0].meta, pending_filing: null, suggested: null } })
      .in('id', chunks.map((c: any) => c.id));

    return new Response(
      JSON.stringify({ success: true, cancelled: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // User approved - create file
  const fullContent = chunks.map((c: any) => c.content).join('\n\n');
  const subject = chunks[0].meta?.subject || 'Knowledge';
  const threadId = chunks[0].meta?.thread_id;

  const file = await createFile(supabase, userId, threadId, fullContent, subject, suggestion);

  await supabase
    .from('rocker_knowledge')
    .update({ meta: { ...chunks[0].meta, organized: true, file_id: file.id, pending_filing: null } })
    .in('id', chunks.map((c: any) => c.id));

  return new Response(
    JSON.stringify({ success: true, filed: true, file: { id: file.id, name: file.name } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createFile(supabase: any, userId: string, threadId: string, content: string, name: string, suggestion: any) {
  const { data: file, error } = await supabase
    .from('rocker_files')
    .insert({
      user_id: userId,
      thread_id: threadId,
      name,
      status: 'filed',
      category: suggestion.category,
      folder_path: suggestion.folder_path,
      tags: suggestion.tags,
      summary: generateSummary(content),
      text_content: content,
      source: 'rocker_organize',
      mime: 'text/plain',
      size: content.length,
    })
    .select()
    .single();

  if (error) throw error;
  return file;
}

function smartCategorize(content: string): string {
  const lower = content.toLowerCase();
  const patterns: Record<string, string[]> = {
    'Projects': ['project', 'roadmap', 'milestone', 'sprint', 'development'],
    'People': ['meeting', 'conversation', 'contact', 'team', 'colleague'],
    'Finance': ['budget', 'cost', 'revenue', 'payment', 'invoice', '$'],
    'Legal': ['contract', 'agreement', 'legal', 'compliance', 'terms'],
    'Marketing': ['campaign', 'marketing', 'branding', 'social', 'seo'],
    'Product': ['feature', 'product', 'user', 'design', 'ux'],
    'Personal': ['personal', 'idea', 'thought', 'reminder'],
    'Notes': ['note', 'information', 'knowledge'],
  };

  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(patterns)) {
    scores[category] = keywords.filter(kw => lower.includes(kw)).length;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return sorted[0][1] > 0 ? sorted[0][0] : 'Notes';
}

function extractKeywords(content: string): string[] {
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of']);
  const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const freq: Record<string, number> = {};
  
  for (const word of words) {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function generateSummary(content: string): string {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  if (sentences.length > 0) {
    let summary = '';
    for (const sentence of sentences) {
      if ((summary + sentence).length > 200) break;
      summary += sentence;
    }
    return summary.trim() || content.substring(0, 200) + '...';
  }
  return content.substring(0, 200) + (content.length > 200 ? '...' : '');
}
