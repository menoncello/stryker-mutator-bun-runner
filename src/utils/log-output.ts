/**
 * Log output interface
 */
export interface LogOutput {
  write: (level: string, message: string) => void;
}

/**
 * Default implementation that writes to console
 */
export class DefaultLogOutput implements LogOutput {
  /**
   * Write a log message to the appropriate output stream
   * @param level - The log level (determines output stream)
   * @param message - The formatted log message to write
   * @returns void - Returns undefined
   */
  write(level: string, message: string): void {
    const stream = level === 'error' ? process.stderr : process.stdout;
    stream.write(`${message}\n`);
  }
}
