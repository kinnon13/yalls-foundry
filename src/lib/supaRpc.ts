import { supabase } from '@/integrations/supabase/client';

type RpcStatus = 'ok' | 'error' | 'noop';

// Sampling rate: 1.0 = 100%, 0.1 = 10% (configurable via env)
const SAMPLE_RATE = Number(import.meta.env.VITE_RPC_OBS_SAMPLE ?? '1');

/**
 * RPC wrapper with observability tracking
 * Automatically logs duration, status, and errors to rpc_observations
 */
export async function rpcWithObs<TParams extends Record<string, any>, TResult = unknown>(
  rpcName: string,
  params: TParams,
  meta?: Record<string, any>
): Promise<{ data: TResult | null; error: any | null }> {
  const t0 = performance.now();
  let status: RpcStatus = 'ok';
  let errorCode: string | null = null;

  const { data, error } = await (supabase as any).rpc(rpcName, params);

  if (error) {
    status = 'error';
    errorCode = error.code ?? 'unknown';
  }

  const durationMs = Math.round(performance.now() - t0);

  // Sampling + safety: only log if sampled, and keep meta small (<1KB)
  if (Math.random() <= SAMPLE_RATE) {
    const safeMeta = sanitizeMeta(meta);
    
    // Fire-and-forget log (don't block UI; ignore errors)
    (supabase as any)
      .rpc('rpc_observe', {
        p_rpc_name: rpcName,
        p_duration_ms: durationMs,
        p_status: status,
        p_error_code: errorCode,
        p_meta: safeMeta
      })
      .then(() => void 0)
      .catch(() => void 0);
  }

  return { data: (data as TResult) ?? null, error };
}

/**
 * Sanitize metadata to prevent PII and bloat
 * Only keeps structural keys, strips sensitive data
 */
function sanitizeMeta(meta?: Record<string, any>): Record<string, any> | null {
  if (!meta) return null;
  
  const ALLOWED_KEYS = ['surface', 'lane', 'page', 'tenantHint', 'feature', 'variant'];
  const safe: Record<string, any> = {};
  
  for (const key of ALLOWED_KEYS) {
    if (meta[key] !== undefined) {
      const val = meta[key];
      // Truncate strings to 100 chars max
      safe[key] = typeof val === 'string' ? val.slice(0, 100) : val;
    }
  }
  
  // Keep total size under 1KB
  const jsonStr = JSON.stringify(safe);
  return jsonStr.length > 1024 ? null : safe;
}
