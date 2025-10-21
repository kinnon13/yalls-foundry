/**
 * Business Product Probe
 * Searches for similar products to help classify business
 * Uses demo data in DEMO mode, real search in production
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Demo product database
const DEMO_PRODUCTS = {
  'tack': [
    {
      title: 'Western Barrel Racing Saddle 14"',
      image: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=200',
      category: 'Tack/Saddles/Barrel',
      evidenceUrl: 'https://example.com/saddle'
    },
    {
      title: 'Leather Horse Bridle with Reins',
      image: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=200',
      category: 'Tack/Bridles',
      evidenceUrl: 'https://example.com/bridle'
    }
  ],
  'apparel': [
    {
      title: 'Cowboy Boots - Brown Leather',
      image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200',
      category: 'Apparel/Footwear',
      evidenceUrl: 'https://example.com/boots'
    },
    {
      title: 'Western Shirt - Pearl Snap',
      image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200',
      category: 'Apparel/Shirts',
      evidenceUrl: 'https://example.com/shirt'
    }
  ],
  'feed': [
    {
      title: 'Alfalfa Hay Bale - Premium',
      image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?w=200',
      category: 'Feed & Nutrition/Hay',
      evidenceUrl: 'https://example.com/hay'
    }
  ]
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, site, demo = true } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ items: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Demo mode - return canned results
    if (demo) {
      const normalized = query.toLowerCase();
      let items: any[] = [];
      
      // Match keywords to demo categories
      if (normalized.includes('saddle') || normalized.includes('tack')) {
        items = DEMO_PRODUCTS.tack;
      } else if (normalized.includes('boots') || normalized.includes('shirt') || normalized.includes('apparel')) {
        items = DEMO_PRODUCTS.apparel;
      } else if (normalized.includes('hay') || normalized.includes('feed')) {
        items = DEMO_PRODUCTS.feed;
      } else {
        // Default to tack
        items = DEMO_PRODUCTS.tack;
      }
      
      return new Response(
        JSON.stringify({ items: items.slice(0, 3) }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Production mode - would use real search API
    // For now, return empty (requires API keys and setup)
    console.log('[ProductProbe] Production search not yet implemented');
    
    return new Response(
      JSON.stringify({ 
        items: [],
        note: 'Real product search requires API setup'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ProductProbe] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, items: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
