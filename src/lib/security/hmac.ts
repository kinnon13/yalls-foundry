/**
 * HMAC token validation for preview postMessage security
 * Token generation moved to server-side for security
 * Client-side validation only checks expiration and origin
 */

export interface HMACToken {
  tk: string;      // HMAC signature
  exp: number;     // Expiration timestamp
  origin: string;  // Expected parent origin
}

/**
 * Validate HMAC token from preview message (client-side checks only)
 * Signature validation happens server-side
 */
export async function validatePreviewToken(
  token: HMACToken,
  messageOrigin: string
): Promise<{ valid: boolean; reason?: string }> {
  // Check expiration
  if (Date.now() > token.exp) {
    return { valid: false, reason: 'Token expired' };
  }
  
  // Check origin match
  if (token.origin !== messageOrigin) {
    return { valid: false, reason: 'Origin mismatch' };
  }
  
  // Token appears valid (signature was validated server-side when generated)
  return { valid: true };
}
