import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_BYTES = 500_000; // 500KB limit

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

    const { url } = await req.json();
    
    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing url' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check flags and verify super_admin access
    const { data: webAccessFlag } = await supabase
      .from('runtime_flags')
      .select('value')
      .eq('key', 'capabilities.web_access')
      .single();

    const { enabled, mode, admin_only } = webAccessFlag?.value as any || { enabled: false, mode: 'disabled', admin_only: true };

    if (!enabled) {
      return new Response(JSON.stringify({ error: 'Web access is disabled' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify super_admin if admin_only is true
    if (admin_only) {
      const { data: isSuperAdmin } = await supabase.rpc('is_super_admin', { _user_id: user.id });
      if (!isSuperAdmin) {
        return new Response(JSON.stringify({ error: 'Web access restricted to super admin' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Parse URL and validate
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!/^https?:$/.test(parsedUrl.protocol)) {
      return new Response(JSON.stringify({ error: 'Only HTTP/HTTPS allowed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Block localhost/private IPs
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.')
    ) {
      return new Response(JSON.stringify({ error: 'Private addresses blocked' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check blocklist
    const { data: blocked } = await supabase
      .from('web_access_blocklist')
      .select('domain')
      .eq('domain', hostname)
      .maybeSingle();

    if (blocked) {
      return new Response(JSON.stringify({ error: 'Domain is blocked' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check allowlist if in allowlist mode (blocklist mode allows all except blocked)
    if (mode === 'allowlist') {
      const { data: allowed } = await supabase
        .from('web_access_allowlist')
        .select('domain')
        .eq('domain', hostname)
        .maybeSingle();

      if (!allowed) {
        return new Response(JSON.stringify({ error: 'Domain not in allowlist. Web access is in restricted mode.' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    // In blocklist mode, all domains are allowed except those explicitly blocked above

    // Fetch with timeout and size limit
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(parsedUrl.href, {
      headers: { 'User-Agent': 'RockerBot/1.0' },
      redirect: 'follow',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `HTTP ${response.status}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Read with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return new Response(JSON.stringify({ error: 'No response body' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let bytesRead = 0;
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      bytesRead += value.length;
      if (bytesRead > MAX_BYTES) {
        return new Response(JSON.stringify({ error: 'Content too large (>500KB)' }), {
          status: 413,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      chunks.push(value);
    }

    const fullContent = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
      fullContent.set(chunk, offset);
      offset += chunk.length;
    }

    const text = new TextDecoder().decode(fullContent);
    const contentType = response.headers.get('content-type') || '';

    // Extract title and clean text
    let title = '';
    let cleanText = text;

    if (contentType.includes('html')) {
      const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch?.[1]?.trim() || '';

      // Strip HTML tags (basic)
      cleanText = text
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 10000); // Limit to 10K chars
    }

    // Log to action ledger
    await supabase.from('ai_action_ledger').insert({
      user_id: user.id,
      agent: 'rocker',
      action: 'web_fetch',
      input: { url },
      output: { title, bytes: bytesRead, content_type: contentType },
      result: 'success',
    });

    return new Response(
      JSON.stringify({
        url: parsedUrl.href,
        title,
        text: cleanText,
        contentType,
        bytes: bytesRead,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Web fetch error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
