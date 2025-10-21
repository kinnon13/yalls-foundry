import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireSuperAdmin } from "../_shared/requireSuperAdmin.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Compute SHA256 hash for deduplication
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Clean HTML to text (basic)
function htmlToText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

// Chunk text with overlap
function chunkText(text: string, chunkSize = 800, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += (chunkSize - overlap);
    if (start >= text.length) break;
  }
  return chunks;
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
  const user = authResult.user!;

  try {
    const body = await req.json();
    const { 
      baseUrl, 
      allow = ['/'], 
      deny = ['/admin', '/auth', '/live', '/settings'],
      maxPages = 50,
      maxDepth = 3,
      chunkChars = 800
    } = body;

    if (!baseUrl) {
      return new Response(JSON.stringify({ error: 'baseUrl is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[rocker-crawl-site] Starting crawl: ${baseUrl}`);

    // Upsert source
    const { data: source, error: sourceError } = await supabase
      .from('kb_sources')
      .upsert({
        kind: 'site',
        base: baseUrl,
        allow,
        deny,
        updated_at: new Date().toISOString()
      }, { onConflict: 'kind,base' })
      .select()
      .single();

    if (sourceError) throw sourceError;

    // Simple breadth-first crawl (production would use a queue)
    const visited = new Set<string>();
    const queue: { url: string; depth: number }[] = [{ url: baseUrl, depth: 0 }];
    let processed = 0;

    while (queue.length > 0 && processed < maxPages) {
      const { url, depth } = queue.shift()!;
      if (visited.has(url) || depth > maxDepth) continue;
      visited.add(url);

      // Check deny list
      const path = new URL(url).pathname;
      if (deny.some(d => path.startsWith(d))) {
        console.log(`[crawl] Skipped (denied): ${url}`);
        continue;
      }

      try {
        console.log(`[crawl] Fetching: ${url}`);
        const pageResp = await fetch(url, { 
          headers: { 'User-Agent': 'RockerBot/1.0 (Knowledge Ingestion)' }
        });
        if (!pageResp.ok) continue;

        const html = await pageResp.text();
        const text = htmlToText(html);
        const hash = await sha256(text);

        // Check if document already exists with same hash
        const { data: existing } = await supabase
          .from('kb_documents')
          .select('id, sha256')
          .eq('source_id', source.id)
          .eq('uri', url)
          .maybeSingle();

        if (existing?.sha256 === hash) {
          console.log(`[crawl] Unchanged: ${url}`);
          processed++;
          continue;
        }

        // Extract title from HTML
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim() : url;

        // Upsert document
        const { data: doc, error: docError } = await supabase
          .from('kb_documents')
          .upsert({
            source_id: source.id,
            uri: url,
            title,
            text,
            sha256: hash,
            updated_at: new Date().toISOString()
          }, { onConflict: 'source_id,uri' })
          .select()
          .single();

        if (docError) throw docError;

        // Delete old chunks
        await supabase.from('kb_chunks').delete().eq('doc_id', doc.id);

        // Create chunks and embeddings
        const chunks = chunkText(text, chunkChars);
        const embeddings = await ai.embed('knower', chunks);

        const chunkRecords = chunks.map((content, idx) => ({
          doc_id: doc.id,
          idx,
          content,
          tokens: Math.ceil(content.length / 4),
          embedding: embeddings[idx]
        }));

        const { error: chunkError } = await supabase
          .from('kb_chunks')
          .insert(chunkRecords);

        if (chunkError) throw chunkError;

        console.log(`[crawl] Indexed: ${url} (${chunks.length} chunks)`);
        processed++;

        // Extract links for further crawling (simplified)
        const linkRegex = /href=["'](\/[^"']*|https?:\/\/[^"']*?)["']/g;
        let match;
        while ((match = linkRegex.exec(html)) !== null) {
          let link = match[1];
          if (link.startsWith('/')) {
            link = new URL(link, baseUrl).href;
          }
          if (link.startsWith(baseUrl) && !visited.has(link)) {
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      } catch (err) {
        console.error(`[crawl] Error fetching ${url}:`, err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      sourceId: source.id,
      processed,
      message: `Crawled ${processed} pages from ${baseUrl}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('[rocker-crawl-site] error:', e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
