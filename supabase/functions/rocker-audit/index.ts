import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { requireSuperAdmin } from "../_shared/requireSuperAdmin.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUDITOR_SYSTEM_PROMPT = `You are **Gemini**, serving as a *second auditor* for a TypeScript/React + Supabase project. Read the provided unified diff and produce a JSON array of issues:

\`\`\`json
[{
 "severity": "critical|high|medium|low|nit",
 "title": "short summary",
 "file": "path/to/file",
 "line": 123,
 "advice": "actionable fix in plain language",
 "rationale": "why this matters",
 "code_suggestion": "optional patch snippet"
}]
\`\`\`

Focus on:
- **Security**: secrets in code, SSRF, XSS, CSRF, SQL injection, insecure crypto
- **Privacy**: PII leaks, GDPR violations, logging sensitive data
- **Prompt injection**: LLM prompt manipulation, modeled data exfiltration risks
- **Auth/RLS**: missing RLS policies, weak auth flows, RBAC gaps
- **Code safety**: unsafe eval, DOM manipulation, race conditions
- **Error handling**: poor error messages, missing try/catch on critical paths
- **Testing**: missing tests on security-critical or business-critical paths
- **Accessibility**: inaccessible UI components, missing ARIA labels

If no issues found, return \`[]\`. Output **only** valid JSON.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authResult = await requireSuperAdmin(req);
  if (!authResult.ok) {
    return new Response(JSON.stringify({ error: authResult.msg }), {
      status: authResult.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { prNumber, diff, repo, ref } = body;

    if (!diff) {
      return new Response(JSON.stringify({ error: 'diff is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[rocker-audit] Auditing PR #${prNumber || 'unknown'} for ${repo || 'unknown repo'}`);

    // Call Gemini via unified AI gateway
    const { text, raw } = await ai.chat({
      role: 'admin',
      messages: [
        { role: 'system', content: AUDITOR_SYSTEM_PROMPT },
        { role: 'user', content: `Repository: ${repo || 'unknown'}\nRef: ${ref || 'main'}\n\n${diff}` }
      ],
      maxTokens: 2000,
      temperature: 0.2
    });

    // Parse JSON response
    let findings = [];
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      findings = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[rocker-audit] Failed to parse JSON:', parseError);
      findings = [{
        severity: 'low',
        title: 'Audit response parsing error',
        file: '',
        line: 0,
        advice: 'The audit completed but response format was unexpected',
        rationale: 'JSON parsing failed'
      }];
    }

    return new Response(JSON.stringify({ 
      success: true,
      findings,
      raw_response: text,
      metadata: {
        prNumber,
        repo,
        ref,
        model: raw?.model || 'google/gemini-2.5-flash',
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('[rocker-audit] error:', e);
    return new Response(JSON.stringify({ 
      error: e instanceof Error ? e.message : 'Unknown error',
      stack: e instanceof Error ? e.stack : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
