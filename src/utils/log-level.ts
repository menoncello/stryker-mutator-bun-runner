/**
 * Log level definitions
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Log level priority mapping
 */
export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
} as const;
