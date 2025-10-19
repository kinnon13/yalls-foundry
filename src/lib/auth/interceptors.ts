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
      const url = args[0] as string;
      
      // Only intercept Supabase API calls
      if (url.includes('supabase') || url.includes('/functions/v1/')) {
        console.warn('[Auth] 401 detected, clearing session and redirecting');
        
        // Clear session
        await supabase.auth.signOut();
        
        // Preserve current location as next param
        const currentPath = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        
        // Redirect to login
        window.location.href = `/auth?mode=login&next=${currentPath}`;
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
