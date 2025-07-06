import { MutantCoverage } from '@stryker-mutator/api/core';

/**
 * Represents coverage information collected during test execution
 */
export interface BunCoverageData {
  /**
   * Map of test ID to the mutant IDs it covers
   */
  perTest: Record<string, Set<string>>;
  
  /**
   * Map of file paths to line numbers that were executed
   */
  executedLines?: Record<string, Set<number>>;
}

/**
 * Options for coverage collection
 */
export interface CoverageOptions {
  /**
   * Whether to collect coverage data
   */
  enabled: boolean;
  
  /**
   * Type of coverage analysis
   */
  coverageAnalysis: 'off' | 'all' | 'perTest';
}

/**
 * Result of coverage collection
 */
export interface CoverageResult {
  /**
   * The collected coverage data
   */
  coverage: BunCoverageData;
  
  /**
   * Time taken to collect coverage in ms
   */
  elapsedMs: number;
}

/**
 * Interface for coverage collectors
 */
export interface ICoverageCollector {
  /**
   * Initialize the coverage collector
   */
  init(): Promise<void>;
  
  /**
   * Start collecting coverage
   */
  startCoverage(): void;
  
  /**
   * Stop collecting coverage and return results
   */
  stopCoverage(): CoverageResult;
  
  /**
   * Convert Bun coverage to Stryker mutant coverage format
   */
  toMutantCoverage(_coverageData: BunCoverageData): MutantCoverage;
  
  /**
   * Clean up resources
   */
  dispose(): Promise<void>;
}