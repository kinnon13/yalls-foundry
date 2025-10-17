import { supabase } from '@/integrations/supabase/client';

export class MissingRpcError extends Error {
  constructor(public rpcName: string) {
    super(`RPC function ${rpcName} does not exist`);
    this.name = 'MissingRpcError';
  }
}

function isMissingFunction(err?: { code?: string; message?: string }) {
  return !!err && (err.code === '42883' || /function .* does not exist/i.test(err.message || ''));
}

export async function callRPC<T>(name: string, params: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    if (isMissingFunction(error)) throw new MissingRpcError(name);
    throw error;
  }
  return data as T;
}
