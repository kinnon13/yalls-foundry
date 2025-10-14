/**
 * SPA Health Checks
 * 
 * Provides client-side health check functionality that can work with or without
 * backend edge functions. Falls back to mock implementation when no backend URL
 * is configured.
 */

export async function checkHealth(): Promise<{ 
  ok: boolean; 
  source: 'mock' | 'supabase'; 
  ts: string 
}> {
  const ts = new Date().toISOString();
  const url = import.meta.env.VITE_FUNCTION_HEALTH_URL;
  
  if (url) {
    try {
      const r = await fetch(url, { method: 'GET' });
      if (r.ok) return { ok: true, source: 'supabase', ts };
    } catch (_) { 
      /* fall back to mock */ 
    }
  }
  
  return { ok: true, source: 'mock', ts };
}
