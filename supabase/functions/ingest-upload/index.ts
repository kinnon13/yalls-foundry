import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

function detectCategory(text: string, filename: string): string {
  const lower = `${text} ${filename}`.toLowerCase();
  
  if (/(sow|contract|agreement|legal|terms|nda)/i.test(lower)) return 'Legal';
  if (/(p&l|profit|loss|invoice|payment|financial|budget)/i.test(lower)) return 'Finance';
  if (/(pitch|investor|funding|raise|cap table)/i.test(lower)) return 'Projects';
  if (/(marketing|campaign|social|ads|brand)/i.test(lower)) return 'Marketing';
  if (/(roadmap|feature|spec|requirements|product)/i.test(lower)) return 'Product';
  if (/(team|people|org|hr|employee)/i.test(lower)) return 'People';
  
  return 'Notes';
}

async function extractTags(text: string, filename: string): Promise<string[]> {
  if (!LOVABLE_API_KEY) return [];
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Extract 3-7 relevant tags from this document. Return ONLY a JSON array of strings, no other text.\n\nFilename: ${filename}\n\nContent: ${text.slice(0, 2000)}`
        }],
        max_completion_tokens: 100,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    return JSON.parse(content);
  } catch {
    return [];
  }
}

async function generateSummary(text: string): Promise<string> {
  if (!LOVABLE_API_KEY) return text.slice(0, 200) + '...';
  
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{
          role: 'user',
          content: `Summarize this in 1-3 clear sentences:\n\n${text.slice(0, 3000)}`
        }],
        max_completion_tokens: 150,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || text.slice(0, 200);
  } catch {
    return text.slice(0, 200) + '...';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract text based on file type
    let textContent = '';
    let ocrText = '';
    
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      textContent = await file.text();
    } else if (file.type.includes('image')) {
      ocrText = 'OCR placeholder - image uploaded';
      textContent = ocrText;
    } else {
      textContent = 'Binary file - ' + file.name;
    }

    // Auto-categorize and tag
    const category = detectCategory(textContent, file.name);
    const tags = await extractTags(textContent, file.name);
    const summary = await generateSummary(textContent);

    // Upload to storage
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('rocker-files')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
    }

    // Create file record
    const { data: fileRecord, error: dbError } = await supabase
      .from('rocker_files')
      .insert({
        user_id: user.id,
        name: file.name,
        mime: file.type,
        size: file.size,
        storage_path: filePath,
        text_content: textContent,
        ocr_text: ocrText || null,
        category,
        tags,
        summary,
        status: 'inbox'
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // Log action
    await supabase.from('ai_action_ledger').insert({
      user_id: user.id,
      agent: 'rocker',
      action: 'file_upload',
      input: { filename: file.name, size: file.size },
      output: { file_id: fileRecord.id, category, tags },
      result: 'success'
    });

    return new Response(JSON.stringify({ 
      file: fileRecord,
      category,
      tags,
      summary: summary.slice(0, 100)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});