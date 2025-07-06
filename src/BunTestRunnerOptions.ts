import { StrykerOptions } from '@stryker-mutator/api/core';
import { CoverageResult } from './coverage';

export interface BunTestRunnerOptions {
  /**
   * Pattern(s) of test files to run
   */
  testFiles?: string[];

  /**
   * Timeout per test in milliseconds
   */
  timeout?: number;

  /**
   * Stop running tests after the first failure
   */
  bail?: boolean;

  /**
   * Additional arguments to pass to the bun process
   */
  nodeArgs?: string[];

  /**
   * Environment variables to set when running tests
   */
  env?: Record<string, string>;

  /**
   * Custom command to run instead of 'bun test'
   * Useful for projects with custom test scripts
   */
  command?: string;

  /**
   * Coverage analysis setting
   */
  coverageAnalysis?: 'off' | 'all' | 'perTest';

  /**
   * Enable process pooling for better performance
   */
  processPool?: boolean;

  /**
   * Maximum number of worker processes in the pool
   */
  maxWorkers?: number;
}

export interface BunRunOptions {
  timeout?: number;
  bail?: boolean;
  env?: Record<string, string>;
  activeMutant?: number;
  coverage?: boolean;
  testNamePattern?: string;
  testFilter?: string[];
}

export interface BunTestResult {
  tests: BunTestResultData[];
  passed: number;
  failed: number;
  total: number;
  duration?: number;
  failedTests?: BunTestResultData[];
  coverage?: CoverageResult;
}

export interface BunTestResultData {
  id?: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
}

export interface StrykerBunOptions extends StrykerOptions {
  bun?: BunTestRunnerOptions;
}