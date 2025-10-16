/**
 * Cart Session Management
 * 
 * Handles guest cart sessions via localStorage
 */

export function getCartSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  
  let sessionId = localStorage.getItem('cart_session_id');
  
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem('cart_session_id', sessionId);
  }
  
  return sessionId;
}

export function clearCartSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('cart_session_id');
}

export async function mergeGuestCart(supabase: any): Promise<void> {
  const sessionId = getCartSessionId();
  if (!sessionId) return;
  
  try {
    await supabase.rpc('cart_merge_guest_to_user', { p_session_id: sessionId });
    clearCartSession();
  } catch (error) {
    console.error('Failed to merge guest cart:', error);
  }
}
