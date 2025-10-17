import { serve } from "https://deno.land/std@0.214.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { withCors } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return withCors(null, { status: 204 });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return withCors(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });

    const { order_id } = await req.json().catch(() => ({}));
    if (!order_id) return withCors(JSON.stringify({ error: "Missing order_id" }), { status: 400, headers: { "content-type": "application/json" } });

    const { error } = await supabase.rpc("order_mark_label_printed", { p_order_id: order_id });
    if (error) return withCors(JSON.stringify({ error: error.message }), { status: 400, headers: { "content-type": "application/json" } });

    return withCors(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  } catch (e) {
    return withCors(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { "content-type": "application/json" }
    });
  }
});
