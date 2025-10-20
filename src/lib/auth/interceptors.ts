/**
 * Global 401 Interceptor
 * Handles expired sessions and redirects to login
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Setup global fetch interceptor for 401 responses
 */
export function setupAuthInterceptor() {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    // Check for 401 Unauthorized
    if (response.status === 401) {
      const raw = args[0] as any;
      const url = typeof raw === 'string' ? raw : (raw?.url ?? '');

      const isSupabaseAuth = url.includes('/auth/v1/');
      const isSupabaseRest = url.includes('/rest/v1/');
      const isEdgeFunction = url.includes('/functions/v1/');

      // Only force sign-out for Auth/REST endpoints (token truly invalid)
      if (isSupabaseAuth || isSupabaseRest) {
        console.warn('[Auth] 401 on auth/rest, clearing session and redirecting', { url });
        await supabase.auth.signOut();

        // Preserve current location as next param
        const currentPath = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `/auth?mode=login&next=${currentPath}`;
      } else if (isEdgeFunction) {
        // Do NOT nuke session on function 401s; surface to UI instead
        console.warn('[Auth] 401 from edge function; keeping session', { url });
        window.dispatchEvent(new CustomEvent('edge:function-401', { detail: { url } }));
        // Let caller handle the 401 normally
      }
    }
    
    return response;
  };
}

/**
 * Ensure all Supabase Edge function calls include JWT
 */
export async function callEdgeFunction(
  functionName: string,
  payload?: any
): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }
  
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(payload),
    }
  );
  
  return response;
}
