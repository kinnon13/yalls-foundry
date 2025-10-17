/**
 * Error Normalization (Task 26)
 * Production-grade error handling with rate-limit detection
 */

export interface NormalizedError {
  message: string;
  rateLimited: boolean;
  networkError: boolean;
  authError: boolean;
}

export function normalizeError(e: unknown): NormalizedError {
  const msg = e instanceof Error ? e.message : String(e);
  
  return {
    message: msg,
    rateLimited: /rate limit|42501|429/i.test(msg),
    networkError: /network|fetch|timeout/i.test(msg),
    authError: /auth|unauthorized|401|403/i.test(msg),
  };
}

export function getErrorMessage(e: unknown): string {
  const normalized = normalizeError(e);
  
  if (normalized.rateLimited) {
    return 'Too many requests. Please wait a moment and try again.';
  }
  
  if (normalized.networkError) {
    return 'Connection issue. Please check your internet and try again.';
  }
  
  if (normalized.authError) {
    return 'Authentication required. Please sign in again.';
  }
  
  return normalized.message || 'Something went wrong. Please try again.';
}
