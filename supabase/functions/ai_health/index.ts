/**
 * AI Health Check Endpoint
 * Pings all AI roles and workers, returns system status
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ComponentStatus {
  name: string
  status: 'ok' | 'degraded' | 'fail'
  latency_ms?: number
  error?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const checks: ComponentStatus[] = []
    const startTime = Date.now()

    // 1. Check database connectivity
    try {
      const dbStart = Date.now()
      const { error } = await supabase.from('ai_action_ledger').select('id').limit(1)
      const dbLatency = Date.now() - dbStart
      
      checks.push({
        name: 'database',
        status: error ? 'fail' : 'ok',
        latency_ms: dbLatency,
        error: error?.message
      })
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 2. Check AI action ledger table
    try {
      const { count, error } = await supabase
        .from('ai_action_ledger')
        .select('*', { count: 'exact', head: true })
      
      checks.push({
        name: 'ai_action_ledger',
        status: error ? 'fail' : 'ok',
        error: error?.message
      })
    } catch (error) {
      checks.push({
        name: 'ai_action_ledger',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 3. Check brain state table
    try {
      const { count, error } = await supabase
        .from('ai_brain_state')
        .select('*', { count: 'exact', head: true })
      
      checks.push({
        name: 'ai_brain_state',
        status: error ? 'fail' : 'ok',
        error: error?.message
      })
    } catch (error) {
      checks.push({
        name: 'ai_brain_state',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 4. Check system metrics
    try {
      const { count, error } = await supabase
        .from('system_metrics')
        .select('*', { count: 'exact', head: true })
      
      checks.push({
        name: 'system_metrics',
        status: error ? 'fail' : 'ok',
        error: error?.message
      })
    } catch (error) {
      checks.push({
        name: 'system_metrics',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // 5. Check audit log
    try {
      const { count, error } = await supabase
        .from('audit_log')
        .select('*', { count: 'exact', head: true })
      
      checks.push({
        name: 'audit_log',
        status: error ? 'fail' : 'ok',
        error: error?.message
      })
    } catch (error) {
      checks.push({
        name: 'audit_log',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Calculate overall status
    const failCount = checks.filter(c => c.status === 'fail').length
    const degradedCount = checks.filter(c => c.status === 'degraded').length
    
    let overallStatus: 'ok' | 'degraded' | 'fail' = 'ok'
    if (failCount > 0) {
      overallStatus = failCount > 2 ? 'fail' : 'degraded'
    } else if (degradedCount > 0) {
      overallStatus = 'degraded'
    }

    const totalLatency = Date.now() - startTime

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      total_latency_ms: totalLatency,
      checks,
      summary: {
        total: checks.length,
        ok: checks.filter(c => c.status === 'ok').length,
        degraded: degradedCount,
        failed: failCount
      }
    }

    console.log('[AI Health]', overallStatus, {
      total: checks.length,
      ok: response.summary.ok,
      failed: failCount
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: overallStatus === 'fail' ? 503 : 200
    })

  } catch (error) {
    console.error('[AI Health] Error:', error)
    return new Response(JSON.stringify({ 
      status: 'fail',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
