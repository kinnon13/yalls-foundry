import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';
import { withRateLimit, RateLimits } from '../_shared/rate-limit-wrapper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeletePrepareResponse {
  success: boolean;
  error?: string;
  message?: string;
  business_ids?: string[];
  profile_id?: string;
  anonymized_at?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const limited = await withRateLimit(req, 'delete-account', RateLimits.auth);
  if (limited) return limited;

  try {
    // Create authenticated client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-account] Starting deletion for user ${user.id}`);

    // Step 1: Call prepare function (anonymizes profile, checks sole-admin)
    const { data: prepareResult, error: prepareError } = await supabase.rpc(
      'delete_account_prepare'
    );

    if (prepareError) {
      console.error('[delete-account] Prepare RPC error:', prepareError);
      return new Response(
        JSON.stringify({
          error: 'prepare_failed',
          message: prepareError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = prepareResult as DeletePrepareResponse;

    // If prepare blocked deletion (sole admin), return early
    if (!result.success) {
      console.log('[delete-account] Blocked:', result.message);
      return new Response(
        JSON.stringify({
          error: result.error,
          message: result.message,
          business_ids: result.business_ids,
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Delete auth user (triggers CASCADE/SET NULL constraints)
    // Use service role key for admin API
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('[delete-account] Auth delete error:', deleteError);
      return new Response(
        JSON.stringify({
          error: 'auth_delete_failed',
          message: deleteError.message,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-account] Success: user ${user.id} deleted, profile ${result.profile_id} anonymized`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted. Your data has been anonymized while preserving business records.',
        profile_id: result.profile_id,
        anonymized_at: result.anonymized_at,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[delete-account] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
