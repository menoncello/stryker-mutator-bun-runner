import { Logger } from '@stryker-mutator/api/logging';
import { MutantCoverage } from '@stryker-mutator/api/core';
import { 
  ICoverageCollector, 
  BunCoverageData, 
  CoverageResult
} from './CoverageTypes.js';

/**
 * Collects mutant coverage information during test execution
 */
export class MutantCoverageCollector implements ICoverageCollector {
  private readonly log: Logger;
  private startTime: number = 0;

  constructor(logger: Logger) {
    this.log = logger;
  }

  public async init(): Promise<void> {
    this.log.debug('Initializing MutantCoverageCollector');
    // Set up global hooks for coverage collection
    this.setupGlobalHooks();
  }

  public startCoverage(): void {
    this.log.debug('Starting coverage collection');
    this.startTime = Date.now();
    
    // Don't overwrite Stryker's instrumentation, just ensure the object exists
    const global = globalThis as Record<string, unknown>;
    if (!global.__stryker__) {
      global.__stryker__ = {};
    }
    
    // Reset coverage for this run
    const strykerGlobal = global.__stryker__ as Record<string, unknown>;
    strykerGlobal.mutantCoverage = {
      static: {},
      perTest: {}
    };
    strykerGlobal.currentTestId = null;
  }

  public stopCoverage(): CoverageResult {
    this.log.debug('Stopping coverage collection');
    
    const elapsedMs = Date.now() - this.startTime;
    
    // Read coverage data from Stryker's global
    const global = globalThis as Record<string, unknown>;
    const strykerGlobal = global.__stryker__ as Record<string, unknown>;
    
    let coverage: BunCoverageData = {
      perTest: {},
      executedLines: {}
    };
    
    if (strykerGlobal && strykerGlobal.mutantCoverage) {
      const mutantCoverage = strykerGlobal.mutantCoverage as { static: Record<string, number>; perTest: Record<string, Record<string, number>> };
      
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

  public async dispose(): Promise<void> {
    this.log.debug('Disposing MutantCoverageCollector');
    // Clean up any remaining global state
    const global = globalThis as Record<string, unknown>;
    const strykerGlobal = global.__stryker__ as Record<string, unknown>;
    if (strykerGlobal) {
      delete strykerGlobal.mutantCoverage;
      delete strykerGlobal.currentTestId;
    }
  }

  private setupGlobalHooks(): void {
    // This function sets up the global hooks that will be injected into the test environment
    // The actual implementation will be injected via test runner configuration
    this.log.debug('Setting up global coverage hooks');
    
    // Note: The actual hook is created in BunTestAdapter.createCoverageHookFile()
    // This is just documentation of what the hook does:
    /*
    const coverageHook = `
      // Hook to track test execution and mutant coverage
      if (typeof globalThis.__stryker__ !== 'undefined' && globalThis.__stryker__.mutantCoverage) {
        const originalTest = globalThis.test || globalThis.it;
        if (originalTest) {
          const wrappedTest = function(name, fn) {
            return originalTest(name, async function(...args) {
              const testId = name; // Use test name as ID for simplicity
              globalThis.__stryker__.currentTestId = testId;
              
              // Initialize coverage set for this test if not exists
              if (!globalThis.__stryker__.mutantCoverage.perTest[testId]) {
                globalThis.__stryker__.mutantCoverage.perTest[testId] = new Set();
              }
              
              try {
                // Run the actual test
                const result = await fn.apply(this, args);
                return result;
              } finally {
                globalThis.__stryker__.currentTestId = null;
              }
            });
          };
          
          // Copy properties from original test
          Object.setPrototypeOf(wrappedTest, originalTest);
          Object.getOwnPropertyNames(originalTest).forEach(prop => {
            if (prop !== 'length' && prop !== 'name' && prop !== 'prototype') {
              wrappedTest[prop] = originalTest[prop];
            }
          });
          
          // Replace global test function
          if (globalThis.test) globalThis.test = wrappedTest;
          if (globalThis.it) globalThis.it = wrappedTest;
        }
      }
    `;
    */
  }

  /**
   * Track mutant execution (called from mutated code)
   */
  public static trackMutant(mutantId: string): void {
    const global = globalThis as Record<string, unknown>;
    const strykerGlobal = global.__stryker__ as Record<string, unknown>;
    if (strykerGlobal && 
        strykerGlobal.mutantCoverage &&
        strykerGlobal.currentTestId) {
      const testId = strykerGlobal.currentTestId as string;
      const coverage = strykerGlobal.mutantCoverage as BunCoverageData;
      
      if (!coverage.perTest[testId]) {
        coverage.perTest[testId] = new Set();
      }
      
      coverage.perTest[testId].add(mutantId);
    }
  }
}