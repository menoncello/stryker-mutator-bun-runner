import { MutantCoverage, Mutant } from '@stryker-mutator/api/core';
import { TestResult } from '@stryker-mutator/api/test-runner';

/**
 * Filters tests based on mutant coverage information
 */
export class TestFilter {
  /**
   * Get the test IDs that cover a specific mutant
   * @param mutant - The mutant to check coverage for
   * @param mutantCoverage - Coverage information from dry run
   * @returns Array of test IDs that cover the mutant
   */
  public static getTestsForMutant(mutant: Mutant, mutantCoverage: MutantCoverage | undefined): string[] {
    if (!mutantCoverage) {
      // No coverage information available, run all tests
      return [];
    }

    const coveringTests: string[] = [];

    // Check perTest coverage first (most specific)
    if (mutantCoverage.perTest) {
      for (const [testId, mutants] of Object.entries(mutantCoverage.perTest)) {
        const mutantRecord = mutants as Record<string, number>;
        const mutantCoverage = mutantRecord[mutant.id];
        if (mutantCoverage && mutantCoverage > 0) {
          coveringTests.push(testId);
        }
      }
    }

    // If no perTest coverage but static coverage exists, we can't filter
    // (all tests might cover this mutant)
    if (coveringTests.length === 0 && mutantCoverage.static) {
      const staticCoverage = mutantCoverage.static[mutant.id];
      if (staticCoverage) {
        return []; // Return empty to run all tests
      }
    }

    return coveringTests;
  }

  /**
   * Filter test results to only include specific test IDs
   * @param allTests - All available test results
   * @param testIdsToRun - Test IDs to include in the filtered results
   * @returns Filtered array of test results
   */
  public static filterTests(allTests: TestResult[], testIdsToRun: string[]): TestResult[] {
    if (testIdsToRun.length === 0) {
      return allTests;
    }

    const testIdSet = new Set(testIdsToRun);
    return allTests.filter(test => testIdSet.has(test.id));
  }

  /**
   * Create a test name pattern for Bun based on test IDs
   * @param testIds - Array of test IDs to create pattern from
   * @returns Regex pattern string or undefined if no test IDs
   */
  public static createTestNamePattern(testIds: string[]): string | undefined {
    if (testIds.length === 0) {
      return undefined;
    }

    // Escape special regex characters in test names
    const escapedNames = testIds.map(id => id.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&'));

    // Create a pattern that matches any of the test names
    return `^(${escapedNames.join('|')})$`;
  }

  /**
   * Check if we should run all tests for a mutant
   * @param mutant - The mutant to check
   * @param mutantCoverage - Coverage information from dry run
   * @returns True if all tests should run, false if we can filter
   */
  public static shouldRunAllTests(mutant: Mutant, mutantCoverage: MutantCoverage | undefined): boolean {
    if (!mutantCoverage) {
      return true;
    }

    // If mutant is not covered by any test in static analysis
    if (mutantCoverage.static) {
      const staticCoverage = mutantCoverage.static[mutant.id];
      if (!staticCoverage) {
        return false; // No need to run any test
      }
    }

    // If we have perTest coverage, we can filter
    if (mutantCoverage.perTest) {
      const coveringTests = TestFilter.getTestsForMutant(mutant, mutantCoverage);
      return coveringTests.length === 0;
    }

    // Default to running all tests
    return true;
  }
}
