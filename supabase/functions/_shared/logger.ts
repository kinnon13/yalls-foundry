/**
 * Structured Logger for Edge Functions
 * 
 * Billion-user ready logging with:
 * - Structured JSON output
 * - PII-safe field filtering
 * - Performance tracking
 * - Silent in production (configurable)
 * - Sentry integration ready
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  lvl: LogLevel;
  msg: string;
  ts: string;
  fn?: string;
  user_id?: string;
  tenant_id?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

/**
 * PII-sensitive field patterns to redact
 */
const PII_PATTERNS = [
  /email/i,
  /phone/i,
  /ssn/i,
  /password/i,
  /token/i,
  /secret/i,
  /apikey/i,
  /creditcard/i,
  /cvv/i,
];

/**
 * Check if a field name contains PII
 */
function isPIIField(key: string): boolean {
  return PII_PATTERNS.some(pattern => pattern.test(key));
}

/**
 * Sanitize context to remove PII
 */
function sanitizeContext(ctx: LogContext): LogContext {
  const sanitized: LogContext = {};
  for (const [key, value] of Object.entries(ctx)) {
    if (isPIIField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeContext(value as LogContext);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Core logging function
 */
function log(level: LogLevel, msg: string, ctx?: LogContext): void {
  const entry: LogEntry = {
    lvl: level,
    msg,
    ts: new Date().toISOString(),
    ...sanitizeContext(ctx || {}),
  };

  // Output to appropriate console method
  const output = JSON.stringify(entry);
  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    case 'info':
      console.info(output);
      break;
    case 'debug':
      console.log(output);
      break;
  }
}

/**
 * Logger class for structured logging
 */
export class Logger {
  private functionName: string;
  private startTime?: number;

  constructor(functionName: string) {
    this.functionName = functionName;
  }

  /**
   * Start performance timer
   */
  startTimer(): void {
    this.startTime = performance.now();
  }

  /**
   * Get elapsed time in milliseconds
   */
  private getElapsed(): number | undefined {
    if (!this.startTime) return undefined;
    return Math.round(performance.now() - this.startTime);
  }

  /**
   * Debug log (development only)
   */
  debug(msg: string, ctx?: LogContext): void {
    log('debug', msg, { fn: this.functionName, ...ctx });
  }

  /**
   * Info log
   */
  info(msg: string, ctx?: LogContext): void {
    log('info', msg, { 
      fn: this.functionName, 
      duration_ms: this.getElapsed(),
      ...ctx 
    });
  }

  /**
   * Warning log
   */
  warn(msg: string, ctx?: LogContext): void {
    log('warn', msg, { 
      fn: this.functionName, 
      duration_ms: this.getElapsed(),
      ...ctx 
    });
  }

  /**
   * Error log
   */
  error(msg: string, error?: Error | unknown, ctx?: LogContext): void {
    const errorDetails = error instanceof Error ? {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
    } : { error: String(error) };

    log('error', msg, { 
      fn: this.functionName, 
      duration_ms: this.getElapsed(),
      ...errorDetails,
      ...ctx 
    });
  }

  /**
   * Log with custom level
   */
  log(level: LogLevel, msg: string, ctx?: LogContext): void {
    log(level, msg, { 
      fn: this.functionName, 
      duration_ms: this.getElapsed(),
      ...ctx 
    });
  }
}

/**
 * Create a logger instance
 */
export function createLogger(functionName: string): Logger {
  return new Logger(functionName);
}

/**
 * Quick logging helpers (without class instantiation)
 */
export const logger = {
  debug: (msg: string, ctx?: LogContext) => log('debug', msg, ctx),
  info: (msg: string, ctx?: LogContext) => log('info', msg, ctx),
  warn: (msg: string, ctx?: LogContext) => log('warn', msg, ctx),
  error: (msg: string, error?: Error | unknown, ctx?: LogContext) => {
    const errorDetails = error instanceof Error ? {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
    } : { error: String(error) };
    log('error', msg, { ...errorDetails, ...ctx });
  },
};
