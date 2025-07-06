import { Logger } from '@stryker-mutator/api/dist/src/logging';
import { BunTestResult, TestResult } from './BunTestRunnerOptions';

export class BunResultParser {
  private readonly log: Logger;

  constructor(logger: Logger) {
    this.log = logger;
  }

  public parse(output: string): BunTestResult {
    this.log.debug('Parsing Bun test output');
    
    const lines = output.split('\n');
    const tests: TestResult[] = [];
    let passed = 0;
    let failed = 0;
    let currentTest: Partial<TestResult> | null = null;

    for (const line of lines) {
      // Parse test results - Bun uses these patterns:
      // ✓ test name (2ms)
      // ✗ test name
      // ⏭ test name (skipped)
      
      if (line.includes('✓')) {
        const match = /✓\s+(.+?)(?:\s+\((\d+(?:\.\d+)?)ms\))?$/.exec(line);
        if (match) {
          tests.push({
            name: match[1].trim(),
            status: 'passed',
            duration: match[2] ? parseFloat(match[2]) : undefined
          });
          passed++;
        }
      } else if (line.includes('✗')) {
        const match = /✗\s+(.+?)(?:\s+\((\d+(?:\.\d+)?)ms\))?$/.exec(line);
        if (match) {
          currentTest = {
            name: match[1].trim(),
            status: 'failed',
            duration: match[2] ? parseFloat(match[2]) : undefined
          };
          failed++;
        }
      } else if (line.includes('⏭')) {
        const match = /⏭\s+(.+)/.exec(line);
        if (match) {
          tests.push({
            name: match[1].trim(),
            status: 'skipped'
          });
        }
      } else if (currentTest && line.trim() && !line.startsWith(' ')) {
        // This might be error output for the current failed test
        if (!currentTest.error) {
          currentTest.error = line.trim();
        }
      } else if (currentTest && (line.includes('✓') || line.includes('✗') || line.includes('⏭') || line.trim() === '')) {
        // We've hit another test or empty line, save the current test
        tests.push(currentTest as TestResult);
        currentTest = null;
      }

      // Also look for summary line
      // Example: "2 pass | 1 fail | 0 skip | 3 total"
      const summaryMatch = /(\d+)\s+pass\s*\|\s*(\d+)\s+fail/.exec(line);
      if (summaryMatch) {
        passed = parseInt(summaryMatch[1], 10);
        failed = parseInt(summaryMatch[2], 10);
      }
    }

    // Don't forget the last test if it was failed
    if (currentTest) {
      tests.push(currentTest as TestResult);
    }

    // Calculate totals
    const total = tests.length || passed + failed;
    
    // Extract duration if available
    let duration: number | undefined;
    const durationMatch = /\((\d+(?:\.\d+)?)ms\)/.exec(output);
    if (durationMatch) {
      duration = parseFloat(durationMatch[1]);
    }

    // Get failed tests for error reporting
    const failedTests = tests.filter(t => t.status === 'failed');

    this.log.debug(`Parsed ${total} tests: ${passed} passed, ${failed} failed`);

    return {
      tests,
      passed,
      failed,
      total,
      duration,
      failedTests: failedTests.length > 0 ? failedTests : undefined
    };
  }
}