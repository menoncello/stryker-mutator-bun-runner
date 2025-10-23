/**
 * Log formatter interface
 */
export interface LogFormatter {
  format: (level: string, message: string, meta?: unknown) => string;
}

/**
 * Default implementation that formats logs with timestamp and level prefix
 */
export class DefaultLogFormatter implements LogFormatter {
  /**
   * Format a log message with timestamp and level prefix
   * @param level - The log level (debug, info, warn, error)
   * @param message - The log message to format
   * @param meta - Optional metadata object to include in the log
   * @returns The formatted log string with timestamp and level prefix
   */
  format(level: string, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${level.toUpperCase()}]`;
    const metaString = meta ? JSON.stringify(meta) : '';

    const metaPart = metaString ? ` ${metaString}` : '';
    return `${prefix} ${timestamp} ${message}${metaPart}`;
  }
}
