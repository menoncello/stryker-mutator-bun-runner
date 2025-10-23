/**
 * Bun Test Runner for Stryker
 *
 * Main TestRunner implementation that integrates Bun's test execution
 * capabilities with Stryker's mutation testing framework.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

import {
  DryRunStatus,
  MutantRunStatus,
  TestResult,
  type TestRunner,
  type DryRunOptions,
  type MutantRunOptions,
  type DryRunResult,
  type MutantRunResult,
  type TestRunnerCapabilities,
} from '@stryker-mutator/api/test-runner';
import { BunTestRunnerConfig, type BunTestRunnerOptions } from './config/index.js';
import { CoverageAnalyzer } from './coverage/index.js';
import { MutationActivator } from './mutation/index.js';
import { ProcessExecutor } from './process/index.js';
import { SecurityManager } from './security/index.js';
import { Logger } from './utils/index.js';

/**
 * Main TestRunner implementation for Bun
 *
 * Implements the Stryker TestRunner interface to provide mutation testing
 * capabilities using Bun as the underlying test execution engine.
 */
export class BunTestRunner implements TestRunner {
  private readonly config: BunTestRunnerConfig;
  private readonly processExecutor: ProcessExecutor;
  private readonly coverageAnalyzer: CoverageAnalyzer;
  private readonly mutationActivator: MutationActivator;
  private readonly securityManager: SecurityManager;
  private readonly logger: Logger;

  /**
   * Create a new BunTestRunner instance
   *
   * @param options - Configuration options for the test runner
   * @returns A new BunTestRunner instance
   */
  constructor(options: BunTestRunnerOptions) {
    this.config = new BunTestRunnerConfig(options);
    this.logger = new Logger(this.config.logLevel);
    this.processExecutor = new ProcessExecutor(this.config, this.logger);
    this.coverageAnalyzer = new CoverageAnalyzer(this.config, this.logger);
    this.mutationActivator = new MutationActivator(this.config, this.logger);
    this.securityManager = new SecurityManager(this.config, this.logger);
  }

  /**
   * Get the capabilities of this test runner
   *
   * @returns Promise resolving to test runner capabilities
   */
  public async capabilities(): Promise<TestRunnerCapabilities> {
    return {
      reloadEnvironment: true,
    };
  }

  /**
   * Initialize the test runner
   *
   * Sets up the test environment and validates configuration.
   * @returns Promise that resolves when initialization is complete
   */
  public async init(): Promise<void> {
    this.logger.info('Initializing Bun Test Runner for Stryker');

    // Validate configuration
    await this.config.validate();

    // Initialize security manager
    await this.securityManager.init();

    // Validate Bun installation
    await this.processExecutor.validateBunInstallation();

    this.logger.info('Bun Test Runner initialized successfully');
  }

  /**
   * Perform a dry run to collect baseline test results
   *
   * @param options - Dry run configuration options
   * @returns Promise resolving to dry run results
   */
  public async dryRun(options: DryRunOptions): Promise<DryRunResult> {
    this.logger.info('Starting dry run to collect baseline test results');

    try {
      const processResult = await this.processExecutor.executeTests(options);
      await this.analyzeCoverageIfNeeded(options); // Run coverage analysis if needed
      return this.createDryRunResult(processResult);
    } catch (error) {
      this.logger.error('Dry run failed', error as Error);
      throw error;
    }
  }

  /**
   * Analyze coverage if enabled in configuration
   *
   * @param _options - Dry run configuration options
   * @returns Promise resolving to coverage data or undefined
   */
  private async analyzeCoverageIfNeeded(_options: DryRunOptions): Promise<unknown> {
    if (!this.config.enableCoverage) {
      return undefined;
    }
    return this.coverageAnalyzer.analyzeCoverage();
  }

  /**
   * Create dry run result based on process execution outcome
   *
   * @param processResult - Result of test execution containing test status and results
   * @param processResult.allTestsPassed - Whether all tests passed successfully
   * @param processResult.tests - Array of test results from execution
   * @returns Dry run result with test status and coverage information
   */
  private createDryRunResult(processResult: {
    allTestsPassed: boolean;
    tests: unknown[];
  }): DryRunResult {
    if (processResult.allTestsPassed) {
      const result: DryRunResult = {
        status: DryRunStatus.Complete,
        tests: processResult.tests as TestResult[],
      } as DryRunResult; // Type assertion for skeleton implementation
      this.logger.info(`Dry run completed: ${processResult.tests.length} tests executed`);
      return result;
    }

    const result: DryRunResult = {
      status: DryRunStatus.Error,
      errorMessage: 'Tests failed during dry run',
    };
    this.logger.info('Dry run completed with errors');
    return result;
  }

  /**
   * Run tests against a specific mutant
   *
   * @param options - Mutant run configuration options
   * @returns Promise resolving to mutant run results
   */
  public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
    const mutantId = `${options.activeMutant.id}`;
    this.logger.debug(
      `Running mutant ${mutantId}: ${options.activeMutant.fileName}:${options.activeMutant.location.start.line}`
    );

    try {
      await this.mutationActivator.activateMutation(options.activeMutant);
      const processResult = await this.processExecutor.executeTests(options);
      return this.createMutantResult(mutantId, processResult);
    } catch (error) {
      this.logger.error(`Mutant run failed for ${mutantId}`, error as Error);
      throw error;
    } finally {
      await this.mutationActivator.deactivateMutation(options.activeMutant);
    }
  }

  /**
   * Create mutant result based on process execution outcome
   *
   * @param mutantId - Identifier for the mutant
   * @param processResult - Result of test execution
   * @param processResult.allTestsPassed - Whether all tests passed
   * @param processResult.tests - Array of test results
   * @returns Mutant run result
   */
  private createMutantResult(
    mutantId: string,
    processResult: { allTestsPassed: boolean; tests: unknown[] }
  ): MutantRunResult {
    if (processResult.allTestsPassed) {
      const result: MutantRunResult = {
        status: MutantRunStatus.Survived,
        nrOfTests: processResult.tests.length,
      };
      this.logger.debug(`Mutant ${mutantId} ${result.status}`);
      return result;
    }

    const result: MutantRunResult = {
      status: MutantRunStatus.Killed,
      killedBy: ['test-runner'],
      failureMessage: 'Mutant killed by test execution',
      nrOfTests: processResult.tests.length,
    };
    this.logger.debug(`Mutant ${mutantId} ${result.status}`);
    return result;
  }

  /**
   * Dispose of the test runner and clean up resources
   * @returns Promise that resolves when resources are disposed
   */
  public async dispose(): Promise<void> {
    this.logger.info('Disposing Bun Test Runner');

    try {
      // Clean up resources
      await this.processExecutor.dispose();
      await this.coverageAnalyzer.dispose();
      await this.mutationActivator.dispose();
      await this.securityManager.dispose();

      this.logger.info('Bun Test Runner disposed successfully');
    } catch (error) {
      this.logger.error('Error during disposal', error as Error);
      throw error;
    }
  }
}
