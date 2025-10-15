import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'No URL provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching URL: ${url}`);

    // Fetch the URL
    const response = await fetch(url);
    const contentType = response.headers.get('content-type') || '';

    let content = '';
    let summary = '';

    if (contentType.includes('text/html')) {
      const html = await response.text();
      
      // Simple HTML parsing - extract text content
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      content = textContent.substring(0, 5000);
      summary = `Website: ${url}\nContent length: ${textContent.length} characters\nPreview:\n${textContent.substring(0, 500)}...`;
    } 
    else if (contentType.includes('application/json')) {
      const json = await response.json();
      content = JSON.stringify(json, null, 2);
      summary = `JSON data from ${url}:\n${content.substring(0, 500)}...`;
    }
    else if (contentType.includes('text/')) {
      content = await response.text();
      summary = `Text content from ${url}:\n${content.substring(0, 500)}...`;
    }
    else {
      summary = `Binary content from ${url}. Content-Type: ${contentType}. Size: ${response.headers.get('content-length') || 'unknown'}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        url,
        contentType,
        content,
        summary,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching URL:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
