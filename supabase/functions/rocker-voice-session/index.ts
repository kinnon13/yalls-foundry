import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Get user session
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { alwaysListening } = await req.json();

    const baseInstructions = `You are Rocker, the AI assistant for Yall's Foundry - a platform for the western performance horse community.

Your personality:
- Friendly, helpful, and concise
- Use casual language but stay professional
- Show enthusiasm for horses, rodeo, and western culture
- Keep responses brief unless the user asks for details

Available actions you can help with:
- Save posts for later (bookmarking)
- Reshare posts with commentary
- Find and recall saved content
- Upload and analyze media (photos/videos of horses, events)
- Create events (barrel races, team ropings, etc.)
- Search for horses, businesses, users, and events

When users mention saving, sharing, finding, uploading, or creating events, tell them you're ready to help and ask for any details needed.`;

    const alwaysListeningInstructions = alwaysListening 
      ? `\n\nIMPORTANT: You are in "always listening" mode. Only respond when the user addresses you by saying "Rocker" or "Hey Rocker" at the start of their message. If they speak without saying your name, stay silent and wait. When they do say "Rocker", respond helpfully to their request.`
      : '';

    // Create ephemeral token for Realtime API
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: baseInstructions + alwaysListeningInstructions
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI session error:", error);
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Session created successfully");

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
