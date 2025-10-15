/**
 * Structured Logger (Production Safe)
 * 
 * Replaces console.* calls with PII-safe, structured logging.
 * Logs are silenced in production except for warnings and errors.
 * 
 * Usage:
 *   import { log } from '@/lib/logger';
 *   log.info('user_login', { userId: hashUserId(user.id) });
 *   log.error('api_error', { message: error.message, code: error.code });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

/**
 * Hash sensitive values (user IDs, emails, etc.) for logging
 */
function hashSensitive(value: string): string {
  // Simple hash for non-crypto logging - just obscure the value
  const hash = value.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return `hash_${Math.abs(hash).toString(16)}`;
}

/**
 * Scrub PII from log context
 */
function scrubPII(context: LogContext): LogContext {
  const scrubbed: LogContext = {};
  const piiFields = ['email', 'phone', 'ssn', 'password', 'token', 'api_key'];
  
  for (const [key, value] of Object.entries(context)) {
    if (piiFields.some(field => key.toLowerCase().includes(field))) {
      scrubbed[key] = '[REDACTED]';
    } else if (key.includes('user_id') || key.includes('userId')) {
      scrubbed[key] = typeof value === 'string' ? hashSensitive(value) : value;
    } else {
      scrubbed[key] = value;
    }
  }
  
  return scrubbed;
}

/**
 * Core logging function
 */
function logMessage(
  level: LogLevel,
  message: string,
  context?: LogContext
) {
  const isDev = process.env.NODE_ENV === 'development';
  const isProd = process.env.NODE_ENV === 'production';
  
  // In production, only log warnings and errors
  if (isProd && (level === 'debug' || level === 'info')) {
    return;
  }
  
  const timestamp = new Date().toISOString();
  const scrubbedContext = context ? scrubPII(context) : {};
  
  const logData = {
    timestamp,
    level,
    message,
    ...scrubbedContext,
  };
  
  // Use appropriate console method
  switch (level) {
    case 'debug':
      if (isDev) console.debug(message, scrubbedContext);
      break;
    case 'info':
      if (isDev) console.info(message, scrubbedContext);
      break;
    case 'warn':
      console.warn(message, scrubbedContext);
      break;
    case 'error':
      console.error(message, scrubbedContext);
      break;
  }
  
  // TODO: Send to external logging service (Sentry, LogRocket, etc.)
  // if (isProd && (level === 'warn' || level === 'error')) {
  //   sendToExternalLogger(logData);
  // }
}

/**
 * Structured logger - use instead of console.*
 */
export const log = {
  /**
   * Debug messages (dev only)
   */
  debug: (message: string, context?: LogContext) => {
    logMessage('debug', message, context);
  },
  
  /**
   * Info messages (dev only)
   */
  info: (message: string, context?: LogContext) => {
    logMessage('info', message, context);
  },
  
  /**
   * Warnings (always logged)
   */
  warn: (message: string, context?: LogContext) => {
    logMessage('warn', message, context);
  },
  
  /**
   * Errors (always logged)
   */
  error: (message: string, context?: LogContext) => {
    logMessage('error', message, context);
  },
};

/**
 * Helper to hash user IDs for logging
 */
export function hashUserId(userId: string): string {
  return hashSensitive(userId);
}
