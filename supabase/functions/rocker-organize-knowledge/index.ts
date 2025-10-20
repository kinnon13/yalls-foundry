/**
 * Rocker Auto-Organize Knowledge
 * Automatically files and organizes knowledge chunks into structured files
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const { thread_id } = await req.json();

    console.log(`[Organize] Processing knowledge for thread: ${thread_id}`);

    // Get all unorganized knowledge chunks for this thread
    const { data: chunks, error: chunksError } = await supabase
      .from('rocker_knowledge')
      .select('id, content, chunk_index, meta, created_at')
      .eq('user_id', user.id)
      .eq('meta->>thread_id', thread_id)
      .order('chunk_index', { ascending: true });

    if (chunksError) throw chunksError;
    if (!chunks || chunks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No chunks to organize' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Group chunks and analyze content
    const fullContent = chunks.map(c => c.content).join('\n\n');
    const subject = chunks[0].meta?.subject || 'Knowledge';
    const category = chunks[0].meta?.category || 'Notes';

    // Extract key topics for tags (simple keyword extraction)
    const tags = extractKeywords(fullContent);

    // Generate summary (first 200 chars or key sentences)
    const summary = generateSummary(fullContent);

    // Determine best category based on content
    const finalCategory = smartCategorize(fullContent, category);

    // Create organized file entry
    const { data: file, error: fileError } = await supabase
      .from('rocker_files')
      .insert({
        user_id: user.id,
        thread_id,
        name: subject,
        status: 'inbox',
        category: finalCategory,
        tags,
        summary,
        text_content: fullContent,
        source: 'rocker_organize',
        mime: 'text/plain',
        size: fullContent.length,
      })
      .select()
      .single();

    if (fileError) throw fileError;

    // Update knowledge chunks to mark them as organized
    await supabase
      .from('rocker_knowledge')
      .update({ 
        meta: { 
          ...chunks[0].meta, 
          organized: true, 
          file_id: file.id 
        } 
      })
      .in('id', chunks.map(c => c.id));

    // Log action
    await supabase.from('ai_action_ledger').insert({
      user_id: user.id,
      agent: 'rocker',
      action: 'organize_knowledge',
      input: { thread_id, chunks: chunks.length },
      output: { file_id: file.id, category: finalCategory, tags },
      result: 'success',
    });

    console.log(`[Organize] Created file: ${file.name} (${finalCategory})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        file: {
          id: file.id,
          name: file.name,
          category: finalCategory,
          tags,
          summary
        }
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

// Smart categorization based on content analysis
function smartCategorize(content: string, defaultCategory: string): string {
  const lower = content.toLowerCase();
  
  // Keywords for each category
  const patterns: Record<string, string[]> = {
    'Projects': ['project', 'roadmap', 'milestone', 'sprint', 'development', 'feature', 'release'],
    'People': ['meeting', 'conversation', 'contact', 'team', 'colleague', 'client', 'customer'],
    'Finance': ['budget', 'cost', 'revenue', 'payment', 'invoice', 'expense', 'profit', '$', 'price'],
    'Legal': ['contract', 'agreement', 'legal', 'compliance', 'regulation', 'terms', 'policy'],
    'Marketing': ['campaign', 'marketing', 'branding', 'social media', 'content', 'seo', 'ads'],
    'Product': ['feature', 'product', 'user', 'design', 'ux', 'interface', 'specification'],
    'Personal': ['personal', 'note', 'idea', 'thought', 'reminder', 'todo'],
    'Notes': ['note', 'information', 'knowledge', 'learning', 'reference'],
  };

  // Count matches for each category
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(patterns)) {
    scores[category] = keywords.filter(kw => lower.includes(kw)).length;
  }

  // Find category with highest score
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] > 0) {
    return sorted[0][0];
  }

  return defaultCategory;
}

// Extract key topics/keywords
function extractKeywords(content: string): string[] {
  // Remove common words
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'this', 'that'
  ]);

  const words = content
    .toLowerCase()
    .match(/\b[a-z]{4,}\b/g) || [];

  // Count word frequency
  const freq: Record<string, number> = {};
  for (const word of words) {
    if (!stopWords.has(word)) {
      freq[word] = (freq[word] || 0) + 1;
    }
  }

  // Get top 5 keywords
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// Generate summary from content
function generateSummary(content: string): string {
  // Get first 200 chars or first complete sentence
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
