import { supabase } from '@/integrations/supabase/client';

type RpcStatus = 'ok' | 'error' | 'noop';

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

  // Fire-and-forget log (don't block UI; ignore errors)
  (supabase as any)
    .rpc('rpc_observe', {
      p_rpc_name: rpcName,
      p_duration_ms: durationMs,
      p_status: status,
      p_error_code: errorCode,
      p_meta: meta ?? null
    })
    .then(() => void 0)
    .catch(() => void 0);

  return { data: (data as TResult) ?? null, error };
}
