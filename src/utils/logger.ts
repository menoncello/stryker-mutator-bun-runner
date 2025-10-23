/**
 * Logging Utility Module
 *
 * Provides comprehensive logging functionality with security features
 * and proper message sanitization using dependency injection pattern.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 2.0.0
 */

import { DefaultLogFormatter, type LogFormatter } from './log-formatter.js';
import { LOG_LEVEL_PRIORITY, type LogLevel } from './log-level.js';
import { DefaultLogOutput, type LogOutput } from './log-output.js';
import { DefaultLogSanitizer, type LogSanitizer } from './log-sanitizer.js';

/**
 * Modular logger implementation following single responsibility principle
 * Provides dependency injection for extensibility
 */
export class Logger {
  private readonly formatter: LogFormatter;
  private readonly sanitizer: LogSanitizer;
  private readonly output: LogOutput;
  private readonly level: LogLevel;

  /**
   * Create a new Logger instance
   * @param level - The minimum log level to output
   * @param dependencies - Optional dependency injection overrides
   * @param dependencies.formatter - Custom log formatter
   * @param dependencies.sanitizer - Custom log sanitizer
   * @param dependencies.output - Custom log output handler
   * @returns A new Logger instance
   */
  constructor(
    level: LogLevel = 'info',
    dependencies?: {
      formatter?: LogFormatter;
      sanitizer?: LogSanitizer;
      output?: LogOutput;
    }
  ) {
    this.level = level;
    this.formatter = dependencies?.formatter ?? new DefaultLogFormatter();
    this.sanitizer = dependencies?.sanitizer ?? new DefaultLogSanitizer();
    this.output = dependencies?.output ?? new DefaultLogOutput();
  }

  /**
   * Log debug message
   *
   * @param message - Message to log
   * @param meta - Optional metadata object
   */
  public debug(message: string, meta?: unknown): void {
    this.log('debug', message, meta);
  }

  /**
   * Log info message
   *
   * @param message - Message to log
   * @param meta - Optional metadata object
   */
  public info(message: string, meta?: unknown): void {
    this.log('info', message, meta);
  }

  /**
   * Log warning message
   *
   * @param message - Message to log
   * @param meta - Optional metadata object
   */
  public warn(message: string, meta?: unknown): void {
    this.log('warn', message, meta);
  }

  /**
   * Log error message
   *
   * @param message - Message to log
   * @param meta - Optional metadata object
   */
  public error(message: string, meta?: unknown): void {
    this.log('error', message, meta);
  }

  /**
   * Internal logging method with level checking
   *
   * @param level - Log level
   * @param message - Message to log
   * @param meta - Optional metadata object
   */
  private log(level: LogLevel, message: string, meta?: unknown): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const sanitizedMessage = this.sanitizer.sanitize(message);
    const sanitizedMeta = meta ? this.sanitizer.sanitizeMetadata(meta) : undefined;
    const formattedMessage = this.formatter.format(level, sanitizedMessage, sanitizedMeta);

    this.output.write(level, formattedMessage);
  }

  /**
   * Check if message should be logged based on current log level
   * @param level - The log level of the message
   * @returns True if the message should be logged, false otherwise
   */
  private shouldLog(level: LogLevel): boolean {
    return this.shouldLogPrivate(level);
  }

  /**
   * Internal method for level checking with injected dependencies
   * @param level - The log level of the message
   * @returns True if the message should be logged, false otherwise
   */
  private shouldLogPrivate(level: LogLevel): boolean {
    return this.shouldLogWithDependencies(level);
  }

  /**
   * Check if message should be logged using dependency injection
   * This allows for runtime modification of logging behavior
   * @param level - The log level of the message
   * @returns True if the message should be logged, false otherwise
   */
  private shouldLogWithDependencies(level: LogLevel): boolean {
    // Get level priority (lower number = higher priority)
    const currentPriority = this.getLevelPriority(this.level);
    const messagePriority = this.getLevelPriority(level);

    // Log if current level priority is less than or equal to message priority
    // (debug=0, info=1, warn=2, error=3)
    // So INFO level (1) should log INFO (1), WARN (2), ERROR (3) but not DEBUG (0)
    return currentPriority <= messagePriority;
  }

  /**
   * Get numeric priority for log level
   * @param level - The log level
   * @returns The numeric priority (lower number = higher priority)
   */
  private getLevelPriority(level: LogLevel): number {
    return LOG_LEVEL_PRIORITY[level];
  }
}

// Re-export LogLevel for convenience
export type { LogLevel };
