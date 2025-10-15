import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const limited = await withRateLimit(req, 'health-liveness', RateLimits.high);
  if (limited) return limited;

  return new Response(
    JSON.stringify({ status: 'alive', timestamp: new Date().toISOString() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});