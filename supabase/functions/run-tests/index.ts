import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: roles } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['admin', 'super_admin']);

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Run tests using Deno's subprocess
    const command = new Deno.Command("npx", {
      args: ["vitest", "run", "--reporter=json"],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();
    const output = new TextDecoder().decode(stdout);
    const errorOutput = new TextDecoder().decode(stderr);

    console.log('Test run completed with code:', code);
    console.log('stdout:', output);
    if (errorOutput) console.error('stderr:', errorOutput);

    // Parse vitest JSON output
    let testResults;
    try {
      testResults = JSON.parse(output);
    } catch (e) {
      console.error('Failed to parse test output:', e);
      return new Response(JSON.stringify({
        error: 'Failed to parse test results',
        raw: output,
        stderr: errorOutput
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Transform vitest results to our format
    const suites = testResults.testResults?.map((file: any) => ({
      name: file.name?.replace(/^.*\//, '') || 'Unknown',
      duration: file.duration || 0,
      tests: file.assertionResults?.map((test: any) => ({
        name: test.title || test.fullName,
        status: test.status === 'passed' ? 'passed' : test.status === 'skipped' ? 'skipped' : 'failed',
        duration: test.duration || 0,
        error: test.failureMessages?.join('\n') || undefined,
      })) || []
    })) || [];

    const summary = {
      total: testResults.numTotalTests || 0,
      passed: testResults.numPassedTests || 0,
      failed: testResults.numFailedTests || 0,
      skipped: testResults.numPendingTests || 0,
      duration: testResults.testResults?.reduce((acc: number, file: any) => acc + (file.duration || 0), 0) || 0,
    };

    return new Response(JSON.stringify({ suites, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error running tests:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
