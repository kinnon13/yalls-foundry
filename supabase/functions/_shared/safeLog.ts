/**
 * Safe Logging for Edge Functions
 * Prevents sensitive data leaks in production
 */

export function safeLog(err: unknown, ctx: Record<string, unknown> = {}) {
  const sanitized = {
    ...ctx,
    timestamp: new Date().toISOString(),
    error: err instanceof Error ? err.message : String(err),
  };
  
  // Remove PII from logs
  if ('email' in sanitized) delete sanitized.email;
  if ('phone' in sanitized) delete sanitized.phone;
  if ('password' in sanitized) delete sanitized.password;
  if ('token' in sanitized) delete sanitized.token;
  
  console.error('[edge]', sanitized);
}

export function safeInfo(msg: string, ctx: Record<string, unknown> = {}) {
  console.log('[edge]', { msg, ...ctx, timestamp: new Date().toISOString() });
}
