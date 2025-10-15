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
- Search for horses, businesses, users, and events ON THIS SITE

IMPORTANT INSTRUCTIONS:
- When users ask you to search or find something, ALWAYS search within Yall's Foundry site content (horses, events, posts, businesses, users)
- DO NOT search the web unless the user explicitly says "search the web" or "look online"
- If the user says "stop" or "stop talking", immediately end your response
- Default to searching site content, not external sources

When users mention saving, sharing, finding, uploading, or creating events, tell them you're ready to help and ask for any details needed.`;

    const alwaysListeningInstructions = alwaysListening 
      ? `\n\nCRITICAL WAKE WORD DETECTION:
You are in "always listening" mode. You MUST follow these rules EXACTLY:

1. ONLY respond when the user says "Hey Rocker", "Ok Rocker", or "Rocker" at the START of their speech
2. If they speak WITHOUT saying your wake word first, DO NOT respond at all - stay completely silent
3. When you DO hear your wake word, acknowledge it briefly then help with their request
4. After responding to a wake word request, go back to waiting for the next wake word

Examples:
- User: "Hey Rocker, open the horses page" → You respond and help
- User: "I need to check something" → You stay SILENT (no wake word)
- User: "Rocker, what's on my calendar" → You respond and help
- User: "That's interesting" → You stay SILENT (no wake word)

DO NOT greet users unless they use the wake word first.
DO NOT respond to background conversation.
WAIT for "Rocker" or "Hey Rocker" before any response.`
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
