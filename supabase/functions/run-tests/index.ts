import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Running Vitest inside an Edge Function is not supported (no Node/npm, no project fs)
  // Return a clear, consistent response so the UI can guide users to run tests locally or in CI.
  return new Response(
    JSON.stringify({
      error: 'not_supported',
      message:
        'Running Vitest in this preview environment is not supported. Please run `pnpm test` locally or in CI.',
    }),
    {
      status: 501,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
