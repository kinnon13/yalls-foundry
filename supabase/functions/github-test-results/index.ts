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
    const GITHUB_TOKEN = Deno.env.get('GITHUB_TOKEN');
    if (!GITHUB_TOKEN) {
      throw new Error('GITHUB_TOKEN not configured');
    }

    const { owner, repo } = await req.json();
    if (!owner || !repo) {
      throw new Error('Missing owner or repo in request body');
    }

    // Fetch recent workflow runs
    const runsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'Lovable-Test-Dashboard',
        },
      }
    );

    if (!runsResponse.ok) {
      const error = await runsResponse.text();
      console.error('GitHub API error:', error);
      throw new Error(`GitHub API failed: ${runsResponse.status}`);
    }

    const runsData = await runsResponse.json();
    
    // Get details for the most recent run
    const latestRun = runsData.workflow_runs?.[0];
    let jobsData = null;

    if (latestRun) {
      const jobsResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/actions/runs/${latestRun.id}/jobs`,
        {
          headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'Lovable-Test-Dashboard',
          },
        }
      );

      if (jobsResponse.ok) {
        jobsData = await jobsResponse.json();
      }
    }

    return new Response(
      JSON.stringify({
        runs: runsData.workflow_runs || [],
        latestJobs: jobsData?.jobs || [],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching test results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        hint: 'Make sure GITHUB_TOKEN is set and has repo access'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
