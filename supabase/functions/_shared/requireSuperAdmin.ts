/**
 * Super Admin Gate Middleware
 * Use in any edge function requiring super admin privileges
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function requireSuperAdmin(req: Request) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { 
      global: { 
        headers: { Authorization: req.headers.get("Authorization") || "" } 
      } 
    }
  );

  // Check auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, status: 401, msg: "Unauthorized", supabase: null, user: null };
  }

  // Check super admin role
  const { data: isSuperAdmin, error: roleError } = await supabase.rpc("is_super_admin", {
    _user_id: user.id
  });

  if (roleError || !isSuperAdmin) {
    // Log unauthorized attempt
    await supabase.from("rocker_admin_audit").insert({
      user_id: user.id,
      action: "unauthorized_access_attempt",
      metadata: { 
        path: new URL(req.url).pathname,
        ip: req.headers.get("x-forwarded-for") || "unknown"
      }
    }).catch(() => {}); // Silent fail on audit

    return { ok: false, status: 403, msg: "Forbidden: Super admin required", supabase: null, user: null };
  }

  return { ok: true, supabase, user };
}
