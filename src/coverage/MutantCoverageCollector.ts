import { Logger } from '@stryker-mutator/api/logging';
import { MutantCoverage } from '@stryker-mutator/api/core';
import { ICoverageCollector, BunCoverageData, CoverageResult } from './CoverageTypes.js';

interface StrykerMutantCoverage {
  static: Record<string, number>;
  perTest: Record<string, Record<string, number>>;
}

interface StrykerGlobal {
  mutantCoverage?: StrykerMutantCoverage;
  currentTestId?: string | null;
}

type GlobalWithStryker = typeof globalThis & {
  __stryker__?: StrykerGlobal;
};

/**
 * Collects mutant coverage information during test execution
 */
export class MutantCoverageCollector implements ICoverageCollector {
  private readonly log: Logger;
  private startTime: number = 0;

  /**
   * Creates a new MutantCoverageCollector instance
   * @param logger - Logger instance for debug output
   */
  constructor(logger: Logger) {
    this.log = logger;
  }

  /**
   * Initializes the coverage collector and sets up global hooks
   * @returns Promise that resolves when initialization is complete
   */
  public async init(): Promise<void> {
    this.log.debug('Initializing MutantCoverageCollector');
    // Set up global hooks for coverage collection
    this.setupGlobalHooks();
  }

  /**
   * Starts coverage collection for a new test run
   * Resets any existing coverage data and prepares for collection
   */
  public startCoverage(): void {
    this.log.debug('Starting coverage collection');
    this.startTime = Date.now();

    // Don't overwrite Stryker's instrumentation, just ensure the object exists
    const global = globalThis as GlobalWithStryker;
    if (!global.__stryker__) {
      global.__stryker__ = {};
    }

    // Reset coverage for this run
    const strykerGlobal = global.__stryker__;
    strykerGlobal.mutantCoverage = {
      static: {},
      perTest: {}
    };
    strykerGlobal.currentTestId = null;
  }

  /**
   * Stops coverage collection and returns the collected data
   * @returns Coverage result with collected data and elapsed time
   */
  public stopCoverage(): CoverageResult {
    this.log.debug('Stopping coverage collection');

    const elapsedMs = Date.now() - this.startTime;

    // Read coverage data from Stryker's global
    const global = globalThis as GlobalWithStryker;
    const strykerGlobal = global.__stryker__;

    const coverage: BunCoverageData = {
      perTest: {},
      executedLines: {}
    };

    if (strykerGlobal?.mutantCoverage) {
      const mutantCoverage = strykerGlobal.mutantCoverage;

      // Convert from Stryker's format to our format
      coverage.perTest = {};
      for (const [testId, mutants] of Object.entries(mutantCoverage.perTest)) {
        coverage.perTest[testId] = new Set(Object.keys(mutants));
      }

      this.log.debug(`Collected coverage for ${Object.keys(coverage.perTest).length} tests`);
    }

    // Clean up global state
    if (strykerGlobal) {
      delete strykerGlobal.mutantCoverage;
      delete strykerGlobal.currentTestId;
    }

    return {
      coverage,
      elapsedMs
    };
  }

  /**
   * Converts Bun coverage data to Stryker's MutantCoverage format
   * @param coverage - Bun coverage data to convert
   * @returns Converted coverage in MutantCoverage format
   */
  public toMutantCoverage(coverage: BunCoverageData): MutantCoverage {
    this.log.debug('Converting Bun coverage to MutantCoverage format');

    const result: MutantCoverage = {
      static: {},
      perTest: {}
    };

    // Convert perTest coverage
    for (const [testId, mutantIds] of Object.entries(coverage.perTest)) {
      result.perTest[testId] = {};
      for (const mutantId of mutantIds) {
        result.perTest[testId][mutantId] = 1; // Coverage count
      }
    }

    // For 'all' coverage analysis, merge all test coverage
    const allCoveredMutants = new Set<string>();
    for (const mutantIds of Object.values(coverage.perTest)) {
      mutantIds.forEach(id => allCoveredMutants.add(id));
    }

    for (const mutantId of allCoveredMutants) {
      result.static[mutantId] = 1;
    }

    this.log.debug(`Converted coverage for ${Object.keys(result.perTest).length} tests`);

    return result;
  }

  /**
   * Cleans up the coverage collector and removes global state
   * @returns Promise that resolves when cleanup is complete
   */
  public async dispose(): Promise<void> {
    this.log.debug('Disposing MutantCoverageCollector');
    // Clean up any remaining global state
    const global = globalThis as GlobalWithStryker;
    const strykerGlobal = global.__stryker__;
    if (strykerGlobal) {
      delete strykerGlobal.mutantCoverage;
      delete strykerGlobal.currentTestId;
    }
  }

  private setupGlobalHooks(): void {
    // This function sets up the global hooks that will be injected into the test environment
    // The actual implementation will be injected via test runner configuration
    this.log.debug('Setting up global coverage hooks');
  }

  /**
   * Track mutant execution (called from mutated code)
   * @param mutantId - ID of the mutant being executed
   */
  public static trackMutant(mutantId: string): void {
    const global = globalThis as GlobalWithStryker;
    const strykerGlobal = global.__stryker__;
    if (strykerGlobal?.mutantCoverage && strykerGlobal?.currentTestId) {
      const testId = strykerGlobal.currentTestId;
      const mutantCoverage = strykerGlobal.mutantCoverage;

      if (!mutantCoverage.perTest[testId]) {
        mutantCoverage.perTest[testId] = {};
      }

      mutantCoverage.perTest[testId][mutantId] = 1;
    }
  }
}
