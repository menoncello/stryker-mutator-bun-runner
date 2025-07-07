import { Logger } from '@stryker-mutator/api/logging';
import { execa } from 'execa';
import { glob } from 'glob';
import { BunTestRunnerOptions, BunRunOptions, BunTestResult } from './BunTestRunnerOptions.js';
import { BunResultParser } from './BunResultParser.js';
import { MutantCoverageCollector, CoverageHookGenerator } from './coverage';
import { BunProcessPool } from './process/BunProcessPool.js';
import { ProcessPoolSingleton } from './process/ProcessPoolSingleton.js';

class TimeoutError extends Error {
  public timedOut = true;

  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Adapter class that manages communication with the Bun test runner process.
 * Handles test execution, result parsing, and coverage collection.
 */
export class BunTestAdapter {
  private readonly log: Logger;
  private readonly options: BunTestRunnerOptions;
  private readonly parser: BunResultParser;
  private readonly coverageCollector: MutantCoverageCollector;
  private readonly coverageHookGenerator: CoverageHookGenerator;
  private coverageHookPath?: string;
  private readonly processPool?: BunProcessPool;

  /**
   * Creates an instance of BunTestAdapter.
   * @param logger - StrykerJS logger for debug output
   * @param options - Configuration options for the Bun test runner
   */
  constructor(logger: Logger, options: BunTestRunnerOptions) {
    this.log = logger;
    this.options = options;
    this.parser = new BunResultParser(logger);
    this.coverageCollector = new MutantCoverageCollector(logger);
    this.coverageHookGenerator = new CoverageHookGenerator();

    // Initialize process pool if enabled (using singleton)
    // Stryker disable next-line all
    if (options.processPool) {
      logger.debug(`BunTestAdapter: Creating process pool (processPool: ${options.processPool})`);
      // Stryker disable next-line all
      this.processPool = ProcessPoolSingleton.getInstance(logger, {
        maxWorkers: options.maxWorkers || 8, // Default to 8 workers
        timeout: options.timeout,
        idleTimeout: 5000, // Reduce idle timeout to 5 seconds
        watchMode: options.watchMode
      });
    } else {
      logger.debug('BunTestAdapter: Process pool disabled');
    }
  }

  /**
   * Initializes the adapter and sets up coverage collection if enabled.
   * @returns Promise that resolves when initialization is complete
   */
  public async init(): Promise<void> {
    await this.coverageCollector.init();

    // Create coverage hook file if coverage is enabled
    if (this.options.coverageAnalysis !== 'off') {
      await this.createCoverageHookFile();
    }
  }

  /**
   * Executes tests using Bun and collects results.
   * @param testFiles - Array of test file paths to run (empty array runs all tests)
   * @param runOptions - Options for the test run including timeout, coverage, and environment
   * @returns Promise with test results including pass/fail counts and optional coverage data
   * @throws Error if test execution fails or times out
   */
  public async runTests(testFiles: string[], runOptions: BunRunOptions): Promise<BunTestResult> {
    const args = await this.buildBunArgs(testFiles, runOptions);
    const env = this.buildEnvironment(runOptions);
    const coverageTracker = this.initializeCoverage(runOptions);

    this.logDebugInfo(args, env);

    try {
      const execResult = await this.executeTests(args, env, runOptions);
      this.checkTimeout(execResult);
      this.logOutput(execResult);

      const result = await this.parseResults(execResult);
      return this.attachCoverageResults(result, coverageTracker);
    } catch (error: unknown) {
      this.cleanupCoverage(coverageTracker);
      return this.handleTestExecutionError(error);
    }
  }

  private initializeCoverage(runOptions: BunRunOptions): { enabled: boolean } {
    if (runOptions.coverage) {
      this.coverageCollector.startCoverage();
      return { enabled: true };
    }
    return { enabled: false };
  }

  private logDebugInfo(args: string[], env: Record<string, string>): void {
    this.log.debug(`Running bun with args: ${args.join(' ')}`);
    this.log.debug(`Environment variables: ${JSON.stringify(env)}`);
    this.log.debug(`Current working directory: ${process.cwd()}`);
    this.log.debug(`Test files config: ${JSON.stringify(this.options.testFiles)}`);
  }

  private async executeTests(
    args: string[],
    env: Record<string, string>,
    runOptions: BunRunOptions
  ): Promise<{ stdout: string; stderr: string; timedOut?: boolean }> {
    if (this.processPool) {
      this.log.debug('Using process pool for test execution');
      const result = await this.processPool.runTests(args, env);
      return this.validateExecResult(result);
    }

    const execaResult = await execa('bun', args, {
      env,
      timeout: runOptions.timeout,
      reject: false,
      cleanup: true
    });

    return {
      stdout: execaResult.stdout,
      stderr: execaResult.stderr,
      timedOut: execaResult.timedOut
    };
  }

  private validateExecResult(result: unknown): { stdout: string; stderr: string; timedOut?: boolean } {
    if (
      result &&
      typeof result === 'object' &&
      'stdout' in result &&
      typeof result.stdout === 'string' &&
      'stderr' in result &&
      typeof result.stderr === 'string'
    ) {
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        timedOut: 'timedOut' in result ? Boolean(result.timedOut) : undefined
      };
    }
    throw new Error('Invalid execution result from process pool');
  }

  private checkTimeout(execResult: { timedOut?: boolean }): void {
    if (execResult.timedOut) {
      throw new TimeoutError('Test execution timed out');
    }
  }

  private logOutput(execResult: { stdout: string; stderr: string }): void {
    if (execResult.stderr) {
      this.log.debug(`Bun stderr: ${execResult.stderr}`);
    }
    if (execResult.stdout) {
      this.log.debug(`Bun stdout: ${execResult.stdout}`);
    }
  }

  private async parseResults(execResult: { stdout: string; stderr: string }): Promise<BunTestResult> {
    const outputToParse = execResult.stderr || execResult.stdout;
    return this.parser.parse(outputToParse);
  }

  private attachCoverageResults(result: BunTestResult, coverageTracker: { enabled: boolean }): BunTestResult {
    if (coverageTracker.enabled) {
      const coverageResult = this.coverageCollector.stopCoverage();
      result.coverage = coverageResult;
    }
    return result;
  }

  private cleanupCoverage(coverageTracker: { enabled: boolean }): void {
    if (coverageTracker.enabled) {
      this.coverageCollector.stopCoverage();
    }
  }

  private handleTestExecutionError(error: unknown): never {
    if (error && typeof error === 'object') {
      if ('timedOut' in error && error.timedOut) {
        throw error;
      }
      this.log.error('Failed to run bun tests', error);
      const message = 'message' in error && typeof error.message === 'string' ? error.message : 'Unknown error';
      throw new Error(`Failed to run bun tests: ${message}`);
    }
    throw new Error('Failed to run bun tests: Unknown error');
  }

  /**
   * Cleans up resources used by the adapter.
   * @returns Promise that resolves when cleanup is complete
   */
  public async dispose(): Promise<void> {
    await this.coverageCollector.dispose();

    // Release process pool reference if it exists
    if (this.processPool) {
      await ProcessPoolSingleton.release(this.log);
    }

    // Dispose the parser to clean up source map consumers
    await this.parser.dispose();

    // CoverageHookGenerator already handles errors internally in cleanup()
    // so we don't need to wrap this in try-catch
    await this.coverageHookGenerator.cleanup();
  }

  /**
   * Gets the coverage collector instance for accessing coverage data.
   * @returns The MutantCoverageCollector instance
   */
  public getCoverageCollector(): MutantCoverageCollector {
    return this.coverageCollector;
  }

  private async createCoverageHookFile(): Promise<void> {
    this.coverageHookPath = await this.coverageHookGenerator.createHookFile();
    this.log.debug(`Created coverage hook file at ${this.coverageHookPath}`);
  }

  private buildEnvironment(options: BunRunOptions): Record<string, string> {
    const env: Record<string, string> = { ...process.env, NODE_ENV: 'test', ...this.options.env, ...options.env };
    if (options.activeMutant !== undefined) {
      env.__STRYKER_ACTIVE_MUTANT__ = options.activeMutant.toString();
    }
    env.BUN_TEST_QUIET = '1';
    return env;
  }

  private async buildBunArgs(testFiles: string[], options: BunRunOptions): Promise<string[]> {
    const args: string[] = [];

    this.addBaseCommand(args);
    this.addCoverageArgs(args, options);
    this.addTestOptions(args, options);
    this.addNodeArgs(args);
    await this.addTestFiles(args, testFiles);

    return args;
  }

  private addBaseCommand(args: string[]): void {
    if (this.options.command) {
      const commandParts = this.options.command.split(' ');
      args.push(...commandParts);
    } else {
      args.push('test');
    }
  }

  private addCoverageArgs(args: string[], options: BunRunOptions): void {
    if (options.coverage && this.coverageHookPath) {
      args.push('--preload', this.coverageHookPath);
    }
  }

  private async addTestFiles(args: string[], testFiles: string[]): Promise<void> {
    if (testFiles.length > 0) {
      args.push(...testFiles);
    } else if (this.options.testFiles && !this.options.command) {
      // Expand glob patterns to actual file paths
      const expandedFiles: string[] = [];

      for (const pattern of this.options.testFiles) {
        try {
          const matches = await glob(pattern, { cwd: process.cwd() });
          if (matches.length > 0) {
            expandedFiles.push(...matches);
            this.log.debug(`Expanded pattern "${pattern}" to ${matches.length} files`);
          } else {
            this.log.warn(`Pattern "${pattern}" did not match any files`);
          }
        } catch (error) {
          this.log.error(`Failed to expand pattern "${pattern}":`, error);
        }
      }

      if (expandedFiles.length > 0) {
        args.push(...expandedFiles);
      } else {
        // Fallback: pass the patterns directly if no files were found
        // This might happen in edge cases
        this.log.warn('No files found matching test patterns, passing patterns directly to Bun');
        args.push(...this.options.testFiles);
      }
    }
  }

  private addTestOptions(args: string[], options: BunRunOptions): void {
    if (this.options.command) return;

    if (options.testNamePattern) {
      args.push('--test-name-pattern', options.testNamePattern);
    }

    if (options.timeout) {
      // Bun expects an integer timeout value
      args.push('--timeout', Math.floor(options.timeout).toString());
    }

    if (options.bail) {
      args.push('--bail');
    }

    if (options.updateSnapshots || this.options.updateSnapshots) {
      args.push('--update-snapshots');
    }
  }

  private addNodeArgs(args: string[]): void {
    if (this.options.nodeArgs) {
      args.push(...this.options.nodeArgs);
    }
  }
}
