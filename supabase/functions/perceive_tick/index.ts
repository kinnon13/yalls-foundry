// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { withTenantGuard } from "../_shared/tenantGuard.ts";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  return withTenantGuard(
    req,
    async (ctx) => {
      try {
        const adminClient = ctx.adminClient; // From tenant guard—RLS-safe
        const tenantId = ctx.tenantId; // Auto-resolved

        // Check global pause
        const { data: flags } = await adminClient
          .from("ai_control_flags")
          .select("*")
          .eq("tenant_id", tenantId)
          .single();

        if (flags?.global_pause) {
          return new Response(JSON.stringify({ paused: true }), {
            status: 202,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Pull tenants with active goals (use your RPC)
        const { data: tenants } = await adminClient.rpc("distinct_tenants_with_active_goals", {
          p_tenant_id: tenantId,
        });

        // Monitor queues/incidents
        const { count: dlq } = await adminClient
          .from("ai_job_dlq")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId);
        const { count: openIncidents } = await adminClient
          .from("ai_incidents")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenantId)
          .is("resolved_at", null);

        // Create suggestions with Grok AI for smarter plans
        let suggestionsCreated = 0;
        for (const t of tenants || []) {
          const summary = `Tenant ${t.tenant_id} has ${t.active_count} goals; DLQ=${dlq || 0}, incidents=${openIncidents || 0}. Suggest consolidation.`;
          const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${Deno.env.get("GROK_API_KEY")}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "user", content: `Generate proactive suggestion for: ${summary}. Keep <50 words, friendly.` },
              ],
              model: "grok-4-latest",
              temperature: 0.3,
            }),
          });
          if (!grokRes.ok) throw new Error(`Grok error: ${grokRes.status}`);
          const { choices } = await grokRes.json();
          const suggestionText = choices[0].message.content;

          await adminClient.from("ai_proactive_suggestions").insert({
            tenant_id: t.tenant_id,
            category: "ops/productivity",
            title: "Backlog consolidation",
            summary: suggestionText,
            plan: {
              steps: ["cluster_goals", "schedule_block", "auto-reminders"],
              signals: { dlq, openIncidents },
            },
            confidence: 75,
          });
          suggestionsCreated++;
        }

        // Log to ledger
        await adminClient.from("ai_action_ledger").insert({
          tenant_id: tenantId,
          operation: "proactive_suggestions_tick",
          result: "success",
          output: { suggestions: suggestionsCreated },
        });

        return new Response(JSON.stringify({ ok: true, suggestions: suggestionsCreated }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        // Log error to incidents
        await ctx.adminClient.from("ai_incidents").insert({
          tenant_id: tenantId,
          summary: "Proactive tick failed",
          severity: "medium",
          detail: { error: e.message },
        });
        return new Response(JSON.stringify({ error: String(e?.message || e) }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    },
    { rateLimitTier: "standard" },
  ); // From secure.ts—add if needed
});
