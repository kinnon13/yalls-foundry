/**
 * HMAC token generation and validation for preview postMessage security
 * Prevents spoofed messages from untrusted origins
 */

const HMAC_SECRET = import.meta.env.VITE_PREVIEW_HMAC_SECRET || 'dev-preview-secret-change-in-prod';
const TOKEN_TTL_MS = 5 * 60 * 1000; // 5 minutes

export interface HMACToken {
  tk: string;      // HMAC signature
  exp: number;     // Expiration timestamp
  origin: string;  // Expected parent origin
}

/**
 * Generate HMAC token for preview window
 */
export async function generatePreviewToken(parentOrigin: string): Promise<HMACToken> {
  const exp = Date.now() + TOKEN_TTL_MS;
  const message = `${parentOrigin}|${exp}`;
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(HMAC_SECRET);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const tk = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { tk, exp, origin: parentOrigin };
}

/**
 * Validate HMAC token from preview message
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
  
  // Verify signature
  const message = `${token.origin}|${token.exp}`;
  const encoder = new TextEncoder();
  const keyData = encoder.encode(HMAC_SECRET);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  // Decode token
  const tkDecoded = atob(
    token.tk.replace(/-/g, '+').replace(/_/g, '/')
  );
  const signature = new Uint8Array(tkDecoded.length);
  for (let i = 0; i < tkDecoded.length; i++) {
    signature[i] = tkDecoded.charCodeAt(i);
  }
  
  const valid = await crypto.subtle.verify('HMAC', key, signature, messageData);
  
  return { valid, reason: valid ? undefined : 'Invalid signature' };
}
