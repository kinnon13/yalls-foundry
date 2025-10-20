import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openaiKey = Deno.env.get('OPENAI_API_KEY');

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('[Consolidate] Starting nightly consolidation...');
    
    // 1) Get all chunks from last 24h or all if empty
    const { data: chunks, error: chunkErr } = await supabase
      .from('rocker_knowledge')
      .select('id, content, meta, embedding')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (chunkErr) throw chunkErr;
    if (!chunks || chunks.length === 0) {
      console.log('[Consolidate] No chunks to consolidate');
      return new Response(JSON.stringify({ message: 'No chunks found' }), { status: 200 });
    }
    
    console.log(`[Consolidate] Processing ${chunks.length} chunks`);
    
    // 2) Group by thread_id or source
    const groups = new Map<string, any[]>();
    for (const chunk of chunks) {
      const key = chunk.meta?.thread_id || chunk.meta?.source || 'general';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(chunk);
    }
    
    console.log(`[Consolidate] Found ${groups.size} groups`);
    
    // 3) For each group, create a consolidation note
    const notesCreated = [];
    
    for (const [groupKey, groupChunks] of groups) {
      if (groupChunks.length < 3) continue; // Skip small groups
      
      // Build context from chunks
      const context = groupChunks
        .slice(0, 40) // Max 40 chunks per note
        .map((c, i) => `[#${i}] ${String(c.content || '').slice(0, 800)}`)
        .join('\n\n');
      
      // Summarize with AI
      const summaryPrompt = `You are consolidating agricultural knowledge. Below are ${groupChunks.length} related chunks.

Create a comprehensive, well-organized summary (1500-2000 words) that:
1. Synthesizes the key information across all chunks
2. Preserves specific data (numbers, dates, names, techniques)
3. Organizes by topic/theme
4. Cites chunks using [#N] references
5. Highlights actionable insights

Context:
${context}

Write the consolidated note:`;

      let noteText = '';
      let embedding: number[] = [];
      
      if (openaiKey) {
        try {
          // Generate summary
          const summaryResp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openaiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: summaryPrompt }],
              temperature: 0.3,
              max_tokens: 3000,
            }),
          });
          
          if (summaryResp.ok) {
            const summaryData = await summaryResp.json();
            noteText = summaryData.choices?.[0]?.message?.content || '';
          }
          
          // Generate embedding for the note
          if (noteText) {
            const embResp = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openaiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: noteText.slice(0, 8000),
              }),
            });
            
            if (embResp.ok) {
              const embData = await embResp.json();
              embedding = embData.data?.[0]?.embedding || [];
            }
          }
        } catch (err) {
          console.error('[Consolidate] AI error:', err);
        }
      }
      
      if (!noteText) {
        // Fallback: simple concatenation
        noteText = `Consolidated from ${groupChunks.length} chunks:\n\n${context}`;
      }
      
      // Insert note
      const { data: note, error: noteErr } = await supabase
        .from('rocker_notes')
        .insert({
          thread_id: groupKey === 'general' ? null : groupKey,
          title: `Consolidated: ${groupKey}`,
          note: noteText,
          sources: groupChunks.map(c => c.id),
          meta: {
            chunk_count: groupChunks.length,
            consolidated_at: new Date().toISOString(),
          },
          embedding: embedding.length > 0 ? embedding : null,
        })
        .select('id')
        .single();
      
      if (noteErr) {
        console.error(`[Consolidate] Failed to create note for ${groupKey}:`, noteErr);
      } else {
        notesCreated.push(note.id);
        console.log(`[Consolidate] Created note ${note.id} for ${groupKey}`);
      }
    }
    
    console.log(`[Consolidate] Created ${notesCreated.length} notes`);
    
    return new Response(
      JSON.stringify({
        message: 'Consolidation complete',
        notes_created: notesCreated.length,
        groups_processed: groups.size,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[Consolidate] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
