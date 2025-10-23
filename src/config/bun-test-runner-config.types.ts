/**
 * Bun Test Runner Configuration Types
 *
 * TypeScript interfaces and types for the Bun Test Runner configuration.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

/**
 * Configuration options for the Bun Test Runner
 */
export interface BunTestRunnerOptions {
  /** Command to invoke Bun (default: 'bun') */
  bunCommand?: string;

  /** Test command to execute (default: 'test') */
  testCommand?: string;

  /** Timeout for test execution in milliseconds (default: 30000) */
  timeout?: number;

  /** Enable coverage collection (default: true) */
  enableCoverage?: boolean;

  /** Logging level (default: 'info') */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';

  /** Maximum number of concurrent mutants (default: 4) */
  maxConcurrentMutants?: number;

  /** Timeout for spawning Bun processes in milliseconds (default: 60000) */
  spawnTimeout?: number;

  /** Retry failed tests (default: false) */
  retryFailedTests?: boolean;

  /** Maximum number of retries for failed tests (default: 2) */
  maxRetries?: number;

  /** Clean temporary files after execution (default: true) */
  cleanTempFiles?: boolean;

  /** Security mode for process execution (default: 'sandbox') */
  securityMode?: 'sandbox' | 'restricted' | 'none';
}

/**
 * Runtime configuration with all required values resolved
 */
export interface BunTestRunnerConfig {
  /** Command to invoke Bun */
  readonly bunCommand: string;

  /** Test command to execute */
  readonly testCommand: string;

  /** Timeout for test execution in milliseconds */
  readonly timeout: number;

  /** Coverage collection enabled */
  readonly enableCoverage: boolean;

  /** Current logging level */
  readonly logLevel: 'debug' | 'info' | 'warn' | 'error';

  /** Maximum number of concurrent mutants */
  readonly maxConcurrentMutants: number;

  /** Timeout for spawning Bun processes in milliseconds */
  readonly spawnTimeout: number;

  /** Retry failed tests enabled */
  readonly retryFailedTests: boolean;

  /** Maximum number of retries for failed tests */
  readonly maxRetries: number;

  /** Clean temporary files after execution */
  readonly cleanTempFiles: boolean;

  /** Current security mode */
  readonly securityMode: 'sandbox' | 'restricted' | 'none';
}
