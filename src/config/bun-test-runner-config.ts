/**
 * Bun Test Runner Configuration
 *
 * Configuration management for the Bun Test Runner plugin.
 * Handles validation, defaults, and environment-specific settings.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

import type { BunTestRunnerOptions } from './bun-test-runner-config.types.js';

/**
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  bunCommand: 'bun',
  testCommand: 'test',
  timeout: 30000,
  enableCoverage: true,
  logLevel: 'info' as const,
  maxConcurrentMutants: 4,
  spawnTimeout: 60000,
  retryFailedTests: false,
  maxRetries: 2,
  cleanTempFiles: true,
  securityMode: 'sandbox' as const,
};

/**
 * Bun Test Runner configuration class
 *
 * Manages configuration for the test runner including validation,
 * defaults, and environment-specific overrides.
 */
export class BunTestRunnerConfig {
  public readonly bunCommand: string;
  public readonly testCommand: string;
  public readonly timeout: number;
  public readonly enableCoverage: boolean;
  public readonly logLevel: 'debug' | 'info' | 'warn' | 'error';
  public readonly maxConcurrentMutants: number;
  public readonly spawnTimeout: number;
  public readonly retryFailedTests: boolean;
  public readonly maxRetries: number;
  public readonly cleanTempFiles: boolean;
  public readonly securityMode: 'sandbox' | 'restricted' | 'none';

  /**
   * Create a new Bun Test Runner configuration
   *
   * @param options - Partial configuration options to override defaults
   * @returns A new BunTestRunnerConfig instance with merged defaults and options
   */
  constructor(options: Partial<BunTestRunnerOptions> = {}) {
    // Merge options with defaults
    const config = { ...DEFAULT_CONFIG, ...options };

    this.bunCommand = config.bunCommand;
    this.testCommand = config.testCommand;
    this.timeout = config.timeout;
    this.enableCoverage = config.enableCoverage;
    this.logLevel = config.logLevel;
    this.maxConcurrentMutants = config.maxConcurrentMutants;
    this.spawnTimeout = config.spawnTimeout;
    this.retryFailedTests = config.retryFailedTests;
    this.maxRetries = config.maxRetries;
    this.cleanTempFiles = config.cleanTempFiles;
    this.securityMode = config.securityMode;
  }

  /**
   * Validate the configuration
   *
   * @throws Error if configuration is invalid
   * @returns Promise that resolves when validation is complete
   */
  public async validate(): Promise<void> {
    if (this.timeout <= 0) {
      throw new Error('Timeout must be a positive number');
    }

    if (this.maxConcurrentMutants <= 0) {
      throw new Error('Max concurrent mutants must be a positive number');
    }

    if (this.spawnTimeout <= 0) {
      throw new Error('Spawn timeout must be a positive number');
    }

    if (this.maxRetries < 0) {
      throw new Error('Max retries cannot be negative');
    }

    // Validate security mode
    const validSecurityModes = ['sandbox', 'restricted', 'none'] as const;
    if (!validSecurityModes.includes(this.securityMode)) {
      throw new Error(`Invalid security mode: ${this.securityMode}`);
    }

    // Validate log level
    const validLogLevels = ['debug', 'info', 'warn', 'error'] as const;
    if (!validLogLevels.includes(this.logLevel)) {
      throw new Error(`Invalid log level: ${this.logLevel}`);
    }
  }

  /**
   * Get test command arguments
   *
   * @returns Array of command arguments for Bun test execution
   */
  public getTestCommandArgs(): string[] {
    const args: string[] = [this.testCommand];

    if (this.enableCoverage) {
      args.push('--coverage');
    }

    return args;
  }

  /**
   * Get environment variables for test execution
   *
   * @returns Environment variables object
   */
  public getTestEnvironment(): Record<string, string> {
    return {
      NODE_ENV: 'test',
      STRYKER_MUTATOR: 'true',
      STRYKER_BUN_RUNNER: 'true',
    };
  }
}

/**
 * Export configuration types for external use
 */
export type { BunTestRunnerOptions } from './bun-test-runner-config.types.js';
