import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperAdmin } from "../_shared/requireSuperAdmin.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Chunk code by language heuristics
function chunkCode(content: string, language: string, maxChars = 1000): string[] {
  const chunks: string[] = [];
  
  // For now, simple line-based chunking
  const lines = content.split('\n');
  let currentChunk = '';
  
  for (const line of lines) {
    if ((currentChunk.length + line.length) > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = line + '\n';
    } else {
      currentChunk += line + '\n';
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [content];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authResult = await requireSuperAdmin(req);
  if (!authResult.ok) {
    return new Response(JSON.stringify({ error: authResult.msg }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = authResult.supabase!;

  try {
    const body = await req.json();
    const { 
      repo, 
      ref = 'main',
      include_globs = ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.sql', '**/*.md'],
      exclude_globs = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
    } = body;

    if (!repo) {
      return new Response(JSON.stringify({ error: 'repo is required (format: owner/repo)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[rocker-ingest-repo] Starting ingestion: ${repo}@${ref}`);

    // Upsert source
    const { data: source, error: sourceError } = await supabase
      .from('kb_sources')
      .upsert({
        kind: 'repo',
        base: repo,
        allow: include_globs,
        deny: exclude_globs,
        updated_at: new Date().toISOString()
      }, { onConflict: 'kind,base' })
      .select()
      .single();

    if (sourceError) throw sourceError;

    // Fetch repo tree from GitHub API
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'RockerBot/1.0'
    };
    if (GITHUB_TOKEN) headers['Authorization'] = `Bearer ${GITHUB_TOKEN}`;

    const treeUrl = `https://api.github.com/repos/${repo}/git/trees/${ref}?recursive=1`;
    const treeResp = await fetch(treeUrl, { headers });
    if (!treeResp.ok) {
      throw new Error(`GitHub API error: ${treeResp.status} ${await treeResp.text()}`);
    }

    const treeData = await treeResp.json();
    const files = treeData.tree.filter((item: any) => item.type === 'blob');

    console.log(`[ingest-repo] Found ${files.length} files in ${repo}`);

    let processed = 0;
    const maxFiles = 100; // Limit for now

    for (const file of files.slice(0, maxFiles)) {
      const path = file.path;

      // Simple glob matching (production would use micromatch)
      const isIncluded = include_globs.some(glob => {
        const pattern = glob.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
        return new RegExp(pattern).test(path);
      });

      const isExcluded = exclude_globs.some(glob => {
        const pattern = glob.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
        return new RegExp(pattern).test(path);
      });

      if (!isIncluded || isExcluded) continue;

      try {
        // Fetch file content
        const contentUrl = `https://api.github.com/repos/${repo}/contents/${path}?ref=${ref}`;
        const contentResp = await fetch(contentUrl, { headers });
        if (!contentResp.ok) continue;

        const contentData = await contentResp.json();
        const content = atob(contentData.content.replace(/\n/g, ''));
        const hash = await sha256(content);

        // Check if unchanged
        const { data: existing } = await supabase
          .from('kb_documents')
          .select('id, sha256')
          .eq('source_id', source.id)
          .eq('uri', path)
          .maybeSingle();

        if (existing?.sha256 === hash) {
          console.log(`[ingest-repo] Unchanged: ${path}`);
          continue;
        }

        // Determine language from extension
        const ext = path.split('.').pop() || '';
        const language = ['ts', 'tsx', 'js', 'jsx'].includes(ext) ? 'typescript' : 
                        ext === 'sql' ? 'sql' : 
                        ext === 'md' ? 'markdown' : 'text';

        // Upsert document
        const { data: doc, error: docError } = await supabase
          .from('kb_documents')
          .upsert({
            source_id: source.id,
            uri: path,
            title: path.split('/').pop(),
            text: content,
            sha256: hash,
            metadata: { language, size: content.length },
            updated_at: new Date().toISOString()
          }, { onConflict: 'source_id,uri' })
          .select()
          .single();

        if (docError) throw docError;

        // Delete old chunks
        await supabase.from('kb_chunks').delete().eq('doc_id', doc.id);

        // Chunk and embed
        const chunks = chunkCode(content, language);
        const embeddings = await ai.embed('knower', chunks);

        const chunkRecords = chunks.map((chunk, idx) => ({
          doc_id: doc.id,
          idx,
          content: chunk,
          tokens: Math.ceil(chunk.length / 4),
          embedding: embeddings[idx]
        }));

        await supabase.from('kb_chunks').insert(chunkRecords);

        console.log(`[ingest-repo] Indexed: ${path} (${chunks.length} chunks)`);
        processed++;

      } catch (err) {
        console.error(`[ingest-repo] Error processing ${path}:`, err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sourceId: source.id,
      processed,
      message: `Ingested ${processed} files from ${repo}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('[rocker-ingest-repo] error:', e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
