import { Logger } from '@stryker-mutator/api/logging';
import { BunTestResult, BunTestResultData } from './BunTestRunnerOptions';
import { SourceMapHandler } from './utils/SourceMapHandler.js';

/**
 * Parser for Bun test runner output that extracts test results and statistics.
 * Handles various output formats including passed, failed, and skipped tests.
 */
export class BunResultParser {
  private readonly log: Logger;
  private readonly sourceMapHandler: SourceMapHandler;

  private static readonly PASSED_PATTERN = /(?:✓|\(pass\))\s+(.+?)(?:\s+\[(\d+(?:\.\d+)?)ms])?$/;
  private static readonly FAILED_PATTERN = /(?:✗|\(fail\))\s+(.+?)(?:\s+\[(\d+(?:\.\d+)?)ms])?$/;
  private static readonly SKIPPED_PATTERN = /(?:⏭|\(skip\))\s+(.+)/;
  private static readonly SUMMARY_PATTERN = /(\d+)\s+pass\s*\|\s*(\d+)\s+fail/;
  private static readonly DURATION_PATTERN = /(\d+(?:\.\d+)?)ms\)/;

  /**
   * Creates an instance of BunResultParser.
   * @param logger - StrykerJS logger for debug output
   */
  constructor(logger: Logger) {
    this.log = logger;
    this.sourceMapHandler = new SourceMapHandler(logger);
  }

  /**
   * Parses Bun test output and extracts test results.
   * @param output - Raw output string from Bun test execution
   * @returns Promise with parsed test results including counts and test details
   */
  public async parse(output: string): Promise<BunTestResult> {
    this.log.debug('Parsing Bun test output');

    const lines = output.split('\n');
    const parseResult = await this.parseTestLines(lines);
    const duration = this.extractDuration(output);

    this.log.debug(`Parsed ${parseResult.total} tests: ${parseResult.passed} passed, ${parseResult.failed} failed`);

    return {
      ...parseResult,
      duration,
      failedTests: parseResult.failedTests.length > 0 ? parseResult.failedTests : undefined
    };
  }

  private async parseTestLines(lines: string[]): Promise<{
    tests: BunTestResultData[];
    passed: number;
    failed: number;
    total: number;
    failedTests: BunTestResultData[];
  }> {
    const tests: BunTestResultData[] = [];
    let passed = 0;
    let failed = 0;
    let currentTest: Partial<BunTestResultData> | null = null;
    let errorBuffer: string[] = [];

    for (const line of lines) {
      const result = this.processLine(line, currentTest);

      if (result.test) {
        const processedTest = await this.processTest(result.test);
        tests.push(processedTest);
        const counts = this.updateTestCounts(processedTest.status, { passed, failed });
        passed = counts.passed;
        failed = counts.failed;
        errorBuffer = [];
      }

      if (result.updateCounts) {
        passed = result.updateCounts.passed;
        failed = result.updateCounts.failed;
      }

      currentTest = result.currentTest;
      errorBuffer = this.collectErrorLine(currentTest, line, errorBuffer);
    }

    if (currentTest) {
      const finalTest = await this.finalizePendingTest(currentTest, errorBuffer);
      tests.push(finalTest);
    }

    return {
      tests,
      passed,
      failed,
      total: tests.length || passed + failed,
      failedTests: tests.filter(t => t.status === 'failed')
    };
  }

  private processLine(
    line: string,
    currentTest: Partial<BunTestResultData> | null
  ): {
    test?: BunTestResultData;
    updateCounts?: { passed: number; failed: number };
    currentTest: Partial<BunTestResultData> | null;
  } {
    if (line.includes('✓') || line.includes('(pass)')) {
      return this.handlePassedTest(line);
    }

    if (line.includes('✗') || line.includes('(fail)')) {
      return this.handleFailedTest(line);
    }

    if (line.includes('⏭') || line.includes('(skip)')) {
      return this.handleSkippedTest(line);
    }

    const summaryResult = this.handleSummaryLine(line);
    if (summaryResult) {
      return summaryResult;
    }

    return this.handleErrorLine(line, currentTest);
  }

  private async processTest(test: BunTestResultData): Promise<BunTestResultData> {
    if (test.status === 'failed' && test.error) {
      return {
        ...test,
        error: await this.sourceMapHandler.mapStackTrace(test.error)
      };
    }
    return test;
  }

  private updateTestCounts(
    status: string,
    counts: { passed: number; failed: number }
  ): { passed: number; failed: number } {
    if (status === 'passed') return { ...counts, passed: counts.passed + 1 };
    if (status === 'failed') return { ...counts, failed: counts.failed + 1 };
    return counts;
  }

  private collectErrorLine(
    currentTest: Partial<BunTestResultData> | null,
    line: string,
    errorBuffer: string[]
  ): string[] {
    if (currentTest && currentTest.status === 'failed' && line.trim()) {
      return [...errorBuffer, line];
    }
    return errorBuffer;
  }

  private async finalizePendingTest(
    currentTest: Partial<BunTestResultData>,
    errorBuffer: string[]
  ): Promise<BunTestResultData> {
    if (currentTest.status === 'failed' && errorBuffer.length > 0) {
      const finalTest: BunTestResultData = {
        name: currentTest.name || 'unknown',
        status: 'failed' as const,
        duration: currentTest.duration,
        error: await this.sourceMapHandler.mapStackTrace(errorBuffer.join('\n'))
      };
      if (currentTest.id) finalTest.id = currentTest.id;
      return finalTest;
    }

    // Ensure all required fields are present
    return {
      name: currentTest.name || 'unknown',
      status: currentTest.status || 'skipped',
      duration: currentTest.duration,
      ...(currentTest.id && { id: currentTest.id }),
      ...(currentTest.error && { error: currentTest.error })
    } as BunTestResultData;
  }

  private handlePassedTest(line: string): { test?: BunTestResultData; currentTest: null } {
    const match = BunResultParser.PASSED_PATTERN.exec(line);
    if (!match) return { currentTest: null };

    return {
      test: {
        name: match[1]?.trim() ?? 'unknown',
        status: 'passed' as const,
        duration: match[2] ? parseFloat(match[2]) : undefined
      },
      currentTest: null
    };
  }

  private handleFailedTest(line: string): { test?: BunTestResultData; currentTest: null } {
    const match = BunResultParser.FAILED_PATTERN.exec(line);
    if (!match) return { currentTest: null };

    return {
      test: {
        name: match[1]?.trim() ?? 'unknown',
        status: 'failed' as const,
        duration: match[2] ? parseFloat(match[2]) : undefined
      },
      currentTest: null
    };
  }

  private handleSkippedTest(line: string): { test?: BunTestResultData; currentTest: null } {
    const match = BunResultParser.SKIPPED_PATTERN.exec(line);
    if (!match) return { currentTest: null };

    return {
      test: {
        name: match[1]?.trim() ?? 'unknown',
        status: 'skipped' as const
      },
      currentTest: null
    };
  }

  private handleSummaryLine(
    line: string
  ): { updateCounts?: { passed: number; failed: number }; currentTest: null } | null {
    const summaryMatch = BunResultParser.SUMMARY_PATTERN.exec(line);
    if (!summaryMatch) return null;

    return {
      updateCounts: {
        passed: parseInt(summaryMatch[1] ?? '0', 10),
        failed: parseInt(summaryMatch[2] ?? '0', 10)
      },
      currentTest: null
    };
  }

  private handleErrorLine(
    line: string,
    currentTest: Partial<BunTestResultData> | null
  ): { currentTest: Partial<BunTestResultData> | null } {
    if (!currentTest || !line.trim() || line.startsWith(' ')) {
      return { currentTest };
    }

    const isNewTest = this.isNewTestLine(line);
    if (isNewTest) {
      return { currentTest };
    }

    if (!currentTest.error) {
      currentTest.error = line.trim();
    }

    return { currentTest };
  }

  private extractDuration(output: string): number | undefined {
    const durationMatch = BunResultParser.DURATION_PATTERN.exec(output);
    return durationMatch ? parseFloat(durationMatch[1] ?? '0') : undefined;
  }

  private isNewTestLine(line: string): boolean {
    return (
      line.includes('✓') ||
      line.includes('✗') ||
      line.includes('⏭') ||
      line.includes('(pass)') ||
      line.includes('(fail)') ||
      line.includes('(skip)') ||
      line.trim() === ''
    );
  }

  /**
   * Cleans up resources used by the parser, including source map consumers.
   * @returns Promise that resolves when cleanup is complete
   */
  public async dispose(): Promise<void> {
    await this.sourceMapHandler.dispose();
  }
}
