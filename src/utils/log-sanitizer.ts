/**
 * Log sanitizer interface
 */
export interface LogSanitizer {
  sanitize: (message: string) => string;
  sanitizeMetadata: (meta: unknown) => unknown;
}

/**
 * Constants for sanitization
 */
const BEARER_PREFIX_LENGTH = 7; // Length of "Bearer "

/**
 * Default implementation that removes sensitive data
 */
export class DefaultLogSanitizer implements LogSanitizer {
  private readonly sensitivePatterns = [
    /password[:=][\S\s]*?(\s|$)/gi,
    /token[:=][\S\s]*?(\s|$)/gi,
    /secret[:=][\S\s]*?(\s|$)/gi,
    /key[:=][\S\s]*?(\s|$)/gi,
    /auth[:=][\S\s]*?(\s|$)/gi,
    /credential[:=][\S\s]*?(\s|$)/gi,
    /bearer\s+[\w+./~\-]+/gi, // Bearer tokens (case insensitive)
    /sk-[\da-z]+/gi, // API keys starting with sk-
  ];

  /**
   * Sanitize a log message by removing or masking sensitive information
   * @param message - The log message to sanitize
   * @returns The sanitized log message with sensitive data masked
   */
  sanitize(message: string): string {
    return this.sensitivePatterns.reduce(
      (clean, pattern) =>
        clean.replace(pattern, match => {
          // Handle different patterns
          if (match.includes('=')) {
            const parts = match.split('=');
            return `${parts[0]}=***`;
          } else if (match.includes(':')) {
            const parts = match.split(':');
            return `${parts[0]}:***`;
          } else if (match.toLowerCase().startsWith('bearer ')) {
            return `${match.substring(0, BEARER_PREFIX_LENGTH)}***`;
          } else if (match.startsWith('sk-')) {
            return 'sk-***';
          }
          return `${match}=***`;
        }),
      message
    );
  }

  /**
   * Sanitize metadata object by masking sensitive values
   * @param meta - The metadata object to sanitize
   * @returns The sanitized metadata object with sensitive values masked
   */
  sanitizeMetadata(meta: unknown): unknown {
    if (typeof meta !== 'object' || meta === null) {
      return meta;
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(meta as Record<string, unknown>)) {
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '***';
      } else if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Check if a key is considered sensitive
   * @param key - The key to check
   * @returns True if the key is sensitive, false otherwise
   */
  private isSensitiveKey(key: string): boolean {
    const sensitivePatterns = ['password', 'token', 'secret', 'key', 'auth', 'credential'];
    return sensitivePatterns.some(pattern => key.toLowerCase().includes(pattern));
  }
}
