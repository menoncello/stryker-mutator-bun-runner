import { Logger } from '@stryker-mutator/api/dist/src/logging';
import { BunTestResult, TestResult } from './BunTestRunnerOptions';

export class BunResultParser {
  private readonly log: Logger;
  
  private static readonly PASSED_PATTERN = /✓\s+(.+?)(?:\s+\((\d+(?:\.\d+)?)ms\))?$/;
  private static readonly FAILED_PATTERN = /✗\s+(.+?)(?:\s+\((\d+(?:\.\d+)?)ms\))?$/;
  private static readonly SKIPPED_PATTERN = /⏭\s+(.+)/;
  private static readonly SUMMARY_PATTERN = /(\d+)\s+pass\s*\|\s*(\d+)\s+fail/;
  private static readonly DURATION_PATTERN = /(\d+(?:\.\d+)?)ms\)/;

  constructor(logger: Logger) {
    this.log = logger;
  }

  public parse(output: string): BunTestResult {
    this.log.debug('Parsing Bun test output');
    
    const lines = output.split('\n');
    const parseResult = this.parseTestLines(lines);
    const duration = this.extractDuration(output);
    
    this.log.debug(`Parsed ${parseResult.total} tests: ${parseResult.passed} passed, ${parseResult.failed} failed`);

    return {
      ...parseResult,
      duration,
      failedTests: parseResult.failedTests.length > 0 ? parseResult.failedTests : undefined
    };
  }

  private parseTestLines(lines: string[]) {
    const tests: TestResult[] = [];
    let passed = 0;
    let failed = 0;
    let currentTest: Partial<TestResult> | null = null;

    for (const line of lines) {
      const result = this.processLine(line, currentTest);
      
      if (result.test) {
        tests.push(result.test);
        if (result.test.status === 'passed') passed++;
        if (result.test.status === 'failed') failed++;
      }
      
      if (result.updateCounts) {
        passed = result.updateCounts.passed;
        failed = result.updateCounts.failed;
      }
      
      currentTest = result.currentTest;
    }

    if (currentTest) {
      tests.push(currentTest as TestResult);
    }

    return {
      tests,
      passed,
      failed,
      total: tests.length || passed + failed,
      failedTests: tests.filter(t => t.status === 'failed')
    };
  }

  private processLine(line: string, currentTest: Partial<TestResult> | null) {
    if (line.includes('✓')) {
      return this.handlePassedTest(line);
    }
    
    if (line.includes('✗')) {
      return this.handleFailedTest(line);
    }
    
    if (line.includes('⏭')) {
      return this.handleSkippedTest(line);
    }
    
    const summaryResult = this.handleSummaryLine(line);
    if (summaryResult) {
      return summaryResult;
    }
    
    return this.handleErrorLine(line, currentTest);
  }

  private handlePassedTest(line: string) {
    const match = BunResultParser.PASSED_PATTERN.exec(line);
    if (!match) return { currentTest: null };
    
    return {
      test: {
        name: match[1].trim(),
        status: 'passed' as const,
        duration: match[2] ? parseFloat(match[2]) : undefined
      },
      currentTest: null
    };
  }

  private handleFailedTest(line: string) {
    const match = BunResultParser.FAILED_PATTERN.exec(line);
    if (!match) return { currentTest: null };
    
    return {
      currentTest: {
        name: match[1].trim(),
        status: 'failed' as const,
        duration: match[2] ? parseFloat(match[2]) : undefined
      }
    };
  }

  private handleSkippedTest(line: string) {
    const match = BunResultParser.SKIPPED_PATTERN.exec(line);
    if (!match) return { currentTest: null };
    
    return {
      test: {
        name: match[1].trim(),
        status: 'skipped' as const
      },
      currentTest: null
    };
  }

  private handleSummaryLine(line: string) {
    const summaryMatch = BunResultParser.SUMMARY_PATTERN.exec(line);
    if (!summaryMatch) return null;
    
    return {
      updateCounts: {
        passed: parseInt(summaryMatch[1], 10),
        failed: parseInt(summaryMatch[2], 10)
      },
      currentTest: null
    };
  }

  private handleErrorLine(line: string, currentTest: Partial<TestResult> | null) {
    if (!currentTest || !line.trim() || line.startsWith(' ')) {
      return { currentTest };
    }
    
    const isNewTest = line.includes('✓') || line.includes('✗') || line.includes('⏭') || line.trim() === '';
    if (isNewTest) {
      return {
        test: currentTest as TestResult,
        currentTest: null
      };
    }
    
    if (!currentTest.error) {
      currentTest.error = line.trim();
    }
    
    return { currentTest };
  }

  private extractDuration(output: string): number | undefined {
    const durationMatch = BunResultParser.DURATION_PATTERN.exec(output);
    return durationMatch ? parseFloat(durationMatch[1]) : undefined;
  }
}