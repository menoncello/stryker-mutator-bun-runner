import { Logger } from '@stryker-mutator/api/logging';
import { readFileSync, existsSync } from 'fs';
import { SourceMapConsumer } from 'source-map';

export interface StackFrame {
  file: string;
  line: number;
  column: number;
  functionName?: string;
}

export interface MappedStackFrame extends StackFrame {
  originalFile?: string;
  originalLine?: number;
  originalColumn?: number;
  originalFunctionName?: string;
}

/**
 * Handles source map resolution for stack traces
 * Maps compiled JavaScript locations back to original TypeScript/JSX source
 */
export class SourceMapHandler {
  private readonly log: Logger;
  private readonly sourceMapCache: Map<string, SourceMapConsumer> = new Map();

  /**
   * Creates a new SourceMapHandler instance
   * @param logger - Logger instance for debug output
   */
  constructor(logger: Logger) {
    this.log = logger;
  }

  /**
   * Maps a stack trace to original source locations using source maps
   * @param stackTrace - The stack trace string to map
   * @returns Promise resolving to the mapped stack trace
   */
  public async mapStackTrace(stackTrace: string): Promise<string> {
    const lines = stackTrace.split('\n');
    const mappedLines: string[] = [];

    for (const line of lines) {
      const frame = this.parseStackFrame(line);
      if (frame) {
        const mappedFrame = await this.mapStackFrame(frame);
        mappedLines.push(this.formatStackFrame(mappedFrame, line));
      } else {
        mappedLines.push(line);
      }
    }

    return mappedLines.join('\n');
  }

  /**
   * Maps a single stack frame to its original source location
   * @param frame - The stack frame to map
   * @returns Promise resolving to the mapped stack frame
   */
  public async mapStackFrame(frame: StackFrame): Promise<MappedStackFrame> {
    const sourceMapPath = `${frame.file}.map`;

    if (!existsSync(sourceMapPath)) {
      return frame;
    }

    try {
      const consumer = await this.getSourceMapConsumer(sourceMapPath);
      const originalPosition = consumer.originalPositionFor({
        line: frame.line,
        column: frame.column
      });

      if (originalPosition.source) {
        return {
          ...frame,
          originalFile: originalPosition.source,
          originalLine: originalPosition.line || undefined,
          originalColumn: originalPosition.column || undefined,
          originalFunctionName: originalPosition.name || undefined
        };
      }
    } catch (error) {
      this.log.debug(`Failed to map stack frame for ${frame.file}:`, error);
    }

    return frame;
  }

  /**
   * Parses a stack frame from a line of stack trace
   * @param line - The stack trace line to parse
   * @returns Parsed stack frame or null if not parseable
   */
  // eslint-disable-next-line complexity
  private parseStackFrame(line: string): StackFrame | null {
    // Common stack trace patterns:
    // at functionName (file:line:column)
    // at file:line:column
    const patterns = [/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/, /at\s+(.+?):(\d+):(\d+)/, /^\s*(.+?):(\d+):(\d+)$/];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        if (match.length === 5 && match[1] && match[2] && match[3] && match[4]) {
          // Pattern with function name
          return {
            functionName: match[1],
            file: match[2],
            line: parseInt(match[3], 10),
            column: parseInt(match[4], 10)
          };
        } else if (match.length === 4 && match[1] && match[2] && match[3]) {
          // Pattern without function name
          return {
            file: match[1],
            line: parseInt(match[2], 10),
            column: parseInt(match[3], 10)
          };
        }
      }
    }

    return null;
  }

  /**
   * Formats a mapped stack frame back into a string
   * @param frame - The mapped stack frame
   * @param originalLine - The original stack trace line
   * @returns Formatted stack trace line
   */
  private formatStackFrame(frame: MappedStackFrame, originalLine: string): string {
    if (!frame.originalFile) {
      return originalLine;
    }

    const location = `${frame.originalFile}:${frame.originalLine}:${frame.originalColumn}`;

    if (frame.originalFunctionName) {
      return `    at ${frame.originalFunctionName} (${location})`;
    } else if (frame.functionName) {
      return `    at ${frame.functionName} (${location})`;
    } else {
      return `    at ${location}`;
    }
  }

  /**
   * Gets or creates a source map consumer for a given source map file
   * @param sourceMapPath - Path to the source map file
   * @returns Promise resolving to the source map consumer
   */
  private async getSourceMapConsumer(sourceMapPath: string): Promise<SourceMapConsumer> {
    if (this.sourceMapCache.has(sourceMapPath)) {
      return this.sourceMapCache.get(sourceMapPath)!;
    }

    const sourceMapContent = readFileSync(sourceMapPath, 'utf8');
    const consumer = await new SourceMapConsumer(sourceMapContent);
    this.sourceMapCache.set(sourceMapPath, consumer);

    return consumer;
  }

  /**
   * Cleans up source map consumers
   * @returns Promise that resolves when cleanup is complete
   */
  public async dispose(): Promise<void> {
    for (const consumer of this.sourceMapCache.values()) {
      consumer.destroy();
    }
    this.sourceMapCache.clear();
  }
}
