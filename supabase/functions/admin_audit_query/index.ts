/**
 * Admin Audit Query
 * 
 * Provides read-only access to audit views for admin/super_admin roles.
 * All queries are logged to ai_action_ledger for compliance.
 * 
 * Security:
 * - Only allowed views can be queried
 * - Role must be admin, super_admin, or agent_super_andy
 * - Tenant isolation enforced
 * - All queries logged
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Allowed audit views (must exist in database)
const ALLOWED_VIEWS = new Set([
  'v_orders_summary',
  'v_user_activity',
  'v_ai_costs',
  'v_incidents_summary',
  'v_model_usage',
  'v_budget_status',
]);

interface AuditQueryRequest {
  view: string;
  filters?: Record<string, string>;
  tenantId: string;
  traceId?: string;
  role: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body: AuditQueryRequest = await req.json();
    const { view, filters, tenantId, traceId, role } = body;

    // Validate role
    const allowedRoles = ['admin', 'super_admin', 'agent_super_andy'];
    if (!allowedRoles.includes(role)) {
      console.warn('[AuditQuery] Forbidden role:', role);
      return new Response(
        JSON.stringify({ error: 'Forbidden: insufficient privileges' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate view
    if (!ALLOWED_VIEWS.has(view)) {
      console.warn('[AuditQuery] View not allowed:', view);
      return new Response(
        JSON.stringify({ error: 'View not allowed', allowedViews: Array.from(ALLOWED_VIEWS) }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query = supabase.from(view).select('*');

    // Apply tenant isolation
    query = query.eq('tenant_id', tenantId);

    // Apply additional filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        // Parse filter operators (e.g., "gte.2025-01-01")
        const parts = value.split('.');
        if (parts.length === 2) {
          const [op, val] = parts;
          switch (op) {
            case 'eq':
              query = query.eq(key, val);
              break;
            case 'neq':
              query = query.neq(key, val);
              break;
            case 'gt':
              query = query.gt(key, val);
              break;
            case 'gte':
              query = query.gte(key, val);
              break;
            case 'lt':
              query = query.lt(key, val);
              break;
            case 'lte':
              query = query.lte(key, val);
              break;
            case 'like':
              query = query.like(key, val);
              break;
            default:
              query = query.eq(key, value);
          }
        } else {
          query = query.eq(key, value);
        }
      });
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('[AuditQuery] Query error:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log audit query
    await supabase.from('ai_action_ledger').insert({
      tenant_id: tenantId,
      topic: 'admin.audit.query',
      payload: {
        view,
        filters,
        rowCount: data?.length || 0,
        traceId: traceId || crypto.randomUUID(),
        role,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(`[AuditQuery] Success: ${view} returned ${data?.length || 0} rows for ${role}`);

    return new Response(
      JSON.stringify({ 
        ok: true, 
        data,
        meta: {
          view,
          rowCount: data?.length || 0,
          timestamp: new Date().toISOString(),
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AuditQuery] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
