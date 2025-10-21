/**
 * Business Website Scanner
 * Extracts metadata, OpenGraph, and schema.org data from a website
 */

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

    if (!url || !url.startsWith('http')) {
      throw new Error('Valid URL required');
    }

    // Fetch website HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'YallsBot/1.0 (Business verification bot)',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch site: ${response.status}`);
    }

    const html = await response.text();

    // Extract metadata
    const metadata = {
      title: extractTag(html, /<title[^>]*>([^<]+)<\/title>/i),
      description: extractMetaTag(html, 'description'),
      keywords: extractMetaTag(html, 'keywords'),
      
      // OpenGraph
      ogTitle: extractMetaTag(html, 'og:title'),
      ogDescription: extractMetaTag(html, 'og:description'),
      ogImage: extractMetaTag(html, 'og:image'),
      ogType: extractMetaTag(html, 'og:type'),
      
      // Schema.org hints (simplified extraction)
      schemaTypes: extractSchemaTypes(html),
      
      // Product hints
      products: extractProductHints(html),
      
      confidence: 0.5 // Default, will be calculated
    };

    // Calculate confidence based on data richness
    let confidence = 0.3;
    if (metadata.title) confidence += 0.1;
    if (metadata.description) confidence += 0.1;
    if (metadata.ogTitle || metadata.ogDescription) confidence += 0.2;
    if (metadata.schemaTypes.length > 0) confidence += 0.2;
    if (metadata.products.length > 0) confidence += 0.1;
    
    metadata.confidence = Math.min(confidence, 1.0);

    return new Response(
      JSON.stringify(metadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ScanSite] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        title: null,
        description: null,
        confidence: 0
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper functions
function extractTag(html: string, regex: RegExp): string | null {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractMetaTag(html: string, property: string): string | null {
  // Try property= first (OpenGraph)
  let regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  let match = html.match(regex);
  if (match) return match[1];
  
  // Try name= (standard meta)
  regex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, 'i');
  match = html.match(regex);
  return match ? match[1] : null;
}

function extractSchemaTypes(html: string): string[] {
  const types: Set<string> = new Set();
  
  // Look for schema.org types in JSON-LD
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const type = json['@type'] || json.type;
      if (type) {
        if (Array.isArray(type)) {
          type.forEach(t => types.add(t));
        } else {
          types.add(type);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return Array.from(types);
}

function extractProductHints(html: string): Array<{name: string, category?: string}> {
  const products: Array<{name: string, category?: string}> = [];
  
  // Look for product schema
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi;
  let match;
  
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      if (json['@type'] === 'Product' || json.type === 'Product') {
        products.push({
          name: json.name || 'Unknown Product',
          category: json.category || undefined
        });
      }
    } catch (e) {
      // Ignore
    }
  }
  
  return products.slice(0, 5); // Limit to 5
}
