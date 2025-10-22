import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MetricThreshold {
  name: string
  value: number
  unit: string
  status: 'ok' | 'warning' | 'critical'
  threshold: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Collect system metrics
    const metrics: MetricThreshold[] = []

    // 1. Queue Depth (from ingest_jobs if exists)
    const { count: queueDepth } = await supabase
      .from('ingest_jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    metrics.push({
      name: 'queue_depth',
      value: queueDepth || 0,
      unit: 'count',
      status: (queueDepth || 0) > 1000 ? 'critical' : (queueDepth || 0) > 100 ? 'warning' : 'ok',
      threshold: 1000
    })

    // 2. AI Action Error Rate (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    const { count: totalActions } = await supabase
      .from('ai_action_ledger')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo)

    const { count: errorActions } = await supabase
      .from('ai_action_ledger')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo)
      .neq('status', 'success')

    const errorRate = totalActions ? (errorActions / totalActions) * 100 : 0

    metrics.push({
      name: 'ai_error_rate',
      value: errorRate,
      unit: 'percent',
      status: errorRate > 5 ? 'critical' : errorRate > 1 ? 'warning' : 'ok',
      threshold: 5
    })

    // 3. AI Token Usage (last hour)
    const { data: tokenData } = await supabase
      .from('ai_action_ledger')
      .select('total_tokens')
      .gte('created_at', oneHourAgo)

    const totalTokens = tokenData?.reduce((sum, row) => sum + (row.total_tokens || 0), 0) || 0

    metrics.push({
      name: 'ai_tokens_hourly',
      value: totalTokens,
      unit: 'tokens',
      status: totalTokens > 1000000 ? 'warning' : 'ok',
      threshold: 1000000
    })

    // 4. AI Cost (last hour)
    const { data: costData } = await supabase
      .from('ai_action_ledger')
      .select('cost_usd')
      .gte('created_at', oneHourAgo)

    const totalCost = costData?.reduce((sum, row) => sum + parseFloat(row.cost_usd || '0'), 0) || 0

    metrics.push({
      name: 'ai_cost_hourly',
      value: totalCost,
      unit: 'usd',
      status: totalCost > 100 ? 'warning' : 'ok',
      threshold: 100
    })

    // 5. Audit Log Activity (last hour)
    const { count: auditCount } = await supabase
      .from('audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo)

    metrics.push({
      name: 'audit_activity_hourly',
      value: auditCount || 0,
      unit: 'count',
      status: 'ok',
      threshold: 10000
    })

    // Record metrics to database
    for (const metric of metrics) {
      await supabase.from('system_metrics').insert({
        metric_name: metric.name,
        metric_value: metric.value,
        metric_unit: metric.unit,
        tags: { status: metric.status, threshold: metric.threshold }
      })
    }

    // Check for critical alerts
    const criticalMetrics = metrics.filter(m => m.status === 'critical')
    const warningMetrics = metrics.filter(m => m.status === 'warning')

    const response = {
      timestamp: new Date().toISOString(),
      status: criticalMetrics.length > 0 ? 'critical' : warningMetrics.length > 0 ? 'warning' : 'healthy',
      metrics,
      alerts: {
        critical: criticalMetrics.map(m => `${m.name}: ${m.value}${m.unit} (threshold: ${m.threshold})`),
        warning: warningMetrics.map(m => `${m.name}: ${m.value}${m.unit} (threshold: ${m.threshold})`)
      }
    }

    console.log('[Rocker Monitor]', response.status, {
      critical: criticalMetrics.length,
      warning: warningMetrics.length,
      metrics: metrics.length
    })

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('[Rocker Monitor] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
