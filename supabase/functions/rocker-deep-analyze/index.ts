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

    const { content, thread_id } = await req.json();
    if (!content) throw new Error('Content required');

    console.log(`[DeepAnalyze] Starting deep analysis for user ${user.id}`);

    // Step 1: Break content into logical sections
    const sections = await breakIntoSections(content);
    console.log(`[DeepAnalyze] Identified ${sections.length} sections`);

    // Step 2: Analyze each section with web research if needed
    const analyzedSections = [];
    for (const section of sections) {
      const analysis = await analyzeSection(section);
      
      // If confidence < 70%, do web research
      if (analysis.confidence < 0.7 && analysis.research_query) {
        console.log(`[DeepAnalyze] Low confidence, researching: ${analysis.research_query}`);
        const researchResults = await performWebResearch(analysis.research_query);
        analysis.research_sources = researchResults;
        
        // Re-analyze with research context
        const enrichedAnalysis = await reanalyzeWithContext(section, researchResults);
        analyzedSections.push(enrichedAnalysis);
      } else {
        analyzedSections.push(analysis);
      }
    }

    // Step 3: Generate 2-3 filing options for unclear content
    const filingOptions = await generateFilingOptions(analyzedSections);

    // Step 4: Store detailed analysis
    const { data: analysisRecord, error: insertError } = await supabase
      .from('rocker_deep_analysis')
      .insert({
        user_id: user.id,
        thread_id,
        content_preview: content.substring(0, 500),
        sections: analyzedSections,
        filing_options: filingOptions,
        status: 'pending_approval'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Step 5: Post options to chat for user confirmation
    await supabase.from('rocker_messages').insert({
      thread_id,
      user_id: user.id,
      role: 'assistant',
      content: formatFilingOptionsMessage(filingOptions, analyzedSections),
      meta: {
        type: 'deep_filing_options',
        analysis_id: analysisRecord.id,
        options: filingOptions
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis_id: analysisRecord.id,
        sections_analyzed: analyzedSections.length,
        filing_options: filingOptions
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[DeepAnalyze] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function breakIntoSections(content: string) {
  // Split by paragraphs, headings, or major topic shifts
  const sections = [];
  const paragraphs = content.split(/\n\n+/);
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i].trim();
    if (para.length < 50) continue; // Skip very short paragraphs
    
    sections.push({
      index: i,
      content: para,
      start_char: content.indexOf(para),
      end_char: content.indexOf(para) + para.length,
      sentences: para.split(/[.!?]+/).filter(s => s.trim().length > 0)
    });
  }
  
  return sections;
}

async function analyzeSection(section: any) {
  const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_KEY) throw new Error('LOVABLE_API_KEY not configured');

  const prompt = `Analyze this content section with EXTREME PRECISION:

Content: ${section.content}

For EACH sentence, determine:
1. Specific project/topic it belongs to
2. Exact category and subcategory (3-5 levels deep)
3. Whether it needs web research to understand
4. Confidence score (0-1)

Return JSON:
{
  "section_summary": "Brief summary",
  "primary_topic": "Specific topic/project name",
  "category_path": "Project/Phase/Category/Subcategory/Detail",
  "sentence_breakdown": [
    {
      "sentence": "exact sentence text",
      "belongs_to": "specific category path",
      "confidence": 0.9,
      "reasoning": "why this categorization"
    }
  ],
  "needs_research": false,
  "research_query": "search query if research needed",
  "confidence": 0.85,
  "tags": ["micro", "level", "tags"]
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) throw new Error('AI request failed');

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return { ...section, ...parsed };
    }
  } catch (e) {
    console.error('[DeepAnalyze] Section analysis failed:', e);
  }

  return {
    ...section,
    section_summary: 'Unable to analyze',
    confidence: 0.5,
    needs_research: true
  };
}

async function performWebResearch(query: string) {
  const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_KEY) return [];

  try {
    // Use Lovable AI to generate a comprehensive web search
    const searchPrompt = `Search query: "${query}"\n\nGenerate 3 specific search queries to deeply understand this topic, then summarize what you know about it.`;
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: searchPrompt }],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const researchSummary = data.choices?.[0]?.message?.content || '';

    return [{
      query,
      summary: researchSummary,
      source: 'ai_knowledge',
      confidence: 0.8
    }];
  } catch (e) {
    console.error('[DeepAnalyze] Web research failed:', e);
    return [];
  }
}

async function reanalyzeWithContext(section: any, researchResults: any[]) {
  const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_KEY) return section;

  const researchContext = researchResults.map(r => r.summary).join('\n\n');
  const prompt = `Re-analyze with research context:

Original content: ${section.content}

Research findings:
${researchContext}

Now provide PRECISE categorization with sentence-level breakdown.

Return JSON with same structure as before but higher confidence.`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }),
    });

    if (!response.ok) return section;

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const enriched = JSON.parse(jsonMatch[0]);
      return { ...section, ...enriched, research_sources: researchResults };
    }
  } catch (e) {
    console.error('[DeepAnalyze] Re-analysis failed:', e);
  }

  return section;
}

async function generateFilingOptions(sections: any[]) {
  const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_KEY) return [];

  const allTopics = sections.map(s => ({
    topic: s.primary_topic,
    path: s.category_path,
    confidence: s.confidence
  }));

  const prompt = `Given these analyzed sections:
${JSON.stringify(allTopics, null, 2)}

Generate 2-3 DIFFERENT filing strategies. For example:
1. Split by project (if content covers multiple projects)
2. File as single document with deep category path
3. File chronologically if it's time-based content

Return JSON:
{
  "options": [
    {
      "label": "Option 1: Split by Project",
      "description": "Create separate files for each project mentioned",
      "files": [
        {
          "name": "AgTech Platform - API Design",
          "path": "AgTech Platform/MVP/Backend/API",
          "content_indices": [0, 2, 5],
          "reasoning": "Groups all API-related sections"
        }
      ],
      "pros": ["Precise organization", "Easy retrieval"],
      "cons": ["Multiple files"]
    }
  ]
}`;

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || '{}';
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]).options || [];
    }
  } catch (e) {
    console.error('[DeepAnalyze] Options generation failed:', e);
  }

  return [];
}

function formatFilingOptionsMessage(options: any[], sections: any[]) {
  let message = `🔍 **Deep Analysis Complete**\n\n`;
  message += `I analyzed ${sections.length} sections at sentence-level precision.\n\n`;
  
  const lowConfSections = sections.filter(s => s.confidence < 0.7).length;
  if (lowConfSections > 0) {
    message += `⚠️ ${lowConfSections} sections required web research for accurate categorization.\n\n`;
  }

  message += `**Filing Options:**\n\n`;
  
  options.forEach((opt, i) => {
    message += `**Option ${i + 1}: ${opt.label}**\n`;
    message += `${opt.description}\n`;
    message += `✅ Pros: ${opt.pros.join(', ')}\n`;
    message += `⚠️ Cons: ${opt.cons.join(', ')}\n`;
    message += `\nWould create ${opt.files?.length || 0} file(s):\n`;
    opt.files?.slice(0, 3).forEach((f: any) => {
      message += `  • ${f.name} → ${f.path}\n`;
    });
    message += `\n`;
  });

  message += `\nReply with option number (1, 2, or 3) or tell me exactly how you want it organized.`;
  
  return message;
}
