import {
  TestRunner,
  DryRunOptions,
  DryRunResult,
  MutantRunOptions,
  MutantRunResult,
  TestRunnerCapabilities,
  DryRunStatus,
  TestStatus,
  MutantRunStatus,
  CompleteDryRunResult,
  SurvivedMutantRunResult,
  TestResult,
  FailedTestResult,
  SkippedTestResult,
  SuccessTestResult
} from '@stryker-mutator/api/test-runner';
import { StrykerOptions, MutantCoverage } from '@stryker-mutator/api/core';
import { Logger } from '@stryker-mutator/api/logging';
import { tokens, commonTokens } from '@stryker-mutator/api/plugin';
import { execa } from 'execa';
import * as semver from 'semver';
import { BunTestRunnerOptions, BunRunOptions, StrykerBunOptions, BunTestResult, BunTestResultData } from './BunTestRunnerOptions.js';
import { BunTestAdapter } from './BunTestAdapter.js';
import { TestFilter, CoverageResult } from './coverage/index.js';

class Timer {
  private startTime: number = 0;
  reset(): void { this.startTime = Date.now(); }
  elapsedMs(): number { return Date.now() - this.startTime; }
}

export class BunTestRunner implements TestRunner {
  private static instanceCount = 0;
  private readonly instanceId: number;
  private readonly log: Logger;
  private readonly options: BunTestRunnerOptions;
  private readonly bunAdapter: BunTestAdapter;
  private readonly timer = new Timer();
  private mutantCoverage?: MutantCoverage;

  public static readonly inject = tokens(commonTokens.logger, commonTokens.options);
  
  /**
   * Reset the static instance counter - useful for testing and cleanup
   */
  public static resetInstanceCount(): void {
    BunTestRunner.instanceCount = 0;
  }

  constructor(logger: Logger, options: StrykerOptions) {
    this.instanceId = ++BunTestRunner.instanceCount;
    this.log = logger;
    this.log.debug(`BunTestRunner instance ${this.instanceId} created (total instances: ${BunTestRunner.instanceCount})`);
    const strykerBunOptions = options as StrykerBunOptions;
    this.options = {
      testFiles: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'],
      timeout: 10000,
      bail: false,
      ...strykerBunOptions.bun
    };
    this.bunAdapter = new BunTestAdapter(this.log, this.options);
  }

  public async init(): Promise<void> {
    this.log.debug('Initializing Bun test runner');
    await this.validateBunInstallation();
    await this.bunAdapter.init();
  }

  public async dryRun(options: DryRunOptions): Promise<DryRunResult> {
    this.log.debug('Starting dry run');
    this.timer.reset();

    try {
      const runOptions: BunRunOptions = {
        timeout: options.timeout,
        coverage: options.coverageAnalysis !== 'off'
      };

      const result = await this.bunAdapter.runTests([], runOptions);
      const tests = this.mapTestResults(result.tests);
      const completedResult = this.createCompleteResult(tests);

      if (options.coverageAnalysis !== 'off' && result.coverage) {
        this.processCoverageData(result.coverage, completedResult);
      }

      return completedResult;
    } catch (error: unknown) {
      return this.handleDryRunError(error, options);
    }
  }

  public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
    this.log.debug(`Running mutant ${options.activeMutant.id}`);
    this.timer.reset();

    try {
      const runOptions = this.createMutantRunOptions(options);
      const filteredTests = this.getFilteredTests(options);
      
      if (filteredTests.shouldSkip) {
        return this.createSurvivedResult(0);
      }

      if (filteredTests.testNamePattern) {
        runOptions.testNamePattern = filteredTests.testNamePattern;
      }

      const result = await this.bunAdapter.runTests([], runOptions);
      return this.processMutantResult(result);
    } catch (error: unknown) {
      return this.handleMutantRunError(error, options);
    }
  }

  public async dispose(): Promise<void> { 
    this.log.debug(`BunTestRunner instance ${this.instanceId} disposing`);
    await this.bunAdapter.dispose(); 
  }
  public capabilities(): TestRunnerCapabilities { return { reloadEnvironment: true }; }

  private mapTestResults(tests: BunTestResultData[]): TestResult[] {
    return tests.map((test, index) => {
      const baseProps = {
        id: test.id || index.toString(),
        name: test.name,
        timeSpentMs: test.duration || 0
      };
      
      switch (test.status) {
        case 'passed':
          return { ...baseProps, status: TestStatus.Success } as SuccessTestResult;
        case 'failed':
          return { ...baseProps, status: TestStatus.Failed, failureMessage: test.error || 'Test failed' } as FailedTestResult;
        case 'skipped':
          return { ...baseProps, status: TestStatus.Skipped } as SkippedTestResult;
        default:
          return { ...baseProps, status: TestStatus.Failed, failureMessage: 'Unknown test status' } as FailedTestResult;
      }
    });
  }

  private createCompleteResult(tests: TestResult[]): CompleteDryRunResult {
    return { status: DryRunStatus.Complete, tests };
  }

  private processCoverageData(coverage: CoverageResult, result: CompleteDryRunResult): void {
    this.log.debug('Processing coverage data');
    const mutantCoverage = this.bunAdapter.getCoverageCollector().toMutantCoverage(coverage.coverage);
    
    result.mutantCoverage = mutantCoverage;
    this.mutantCoverage = mutantCoverage;
    this.log.debug(`Collected coverage for ${Object.keys(mutantCoverage.perTest).length} tests`);
  }

  private handleDryRunError(error: unknown, options: DryRunOptions): DryRunResult {
    this.log.error('Dry run failed', error);
    if (error && typeof error === 'object' && 'timedOut' in error && error.timedOut) {
      return { status: DryRunStatus.Timeout, reason: `Dry run timed out after ${options.timeout}ms` };
    }
    return { status: DryRunStatus.Error, errorMessage: (error as { message?: string }).message || 'Unknown error during dry run' };
  }

  private createMutantRunOptions(options: MutantRunOptions): BunRunOptions {
    return { 
      timeout: options.timeout, 
      bail: true, 
      activeMutant: parseInt(options.activeMutant.id, 10), 
      env: { __STRYKER_ACTIVE_MUTANT__: options.activeMutant.id.toString() } 
    };
  }

  private getFilteredTests(options: MutantRunOptions): { testNamePattern?: string; shouldSkip?: boolean } {
    if (this.mutantCoverage && options.testFilter) {
      const testNamePattern = TestFilter.createTestNamePattern(options.testFilter);
      this.log.debug(`Using test filter for ${options.testFilter.length} tests`);
      return { testNamePattern };
    }
    
    if (this.mutantCoverage) {
      return this.filterTestsByCoverage(options);
    }
    
    return {};
  }

  private filterTestsByCoverage(options: MutantRunOptions): { testNamePattern?: string; shouldSkip?: boolean } {
    const coveringTests = TestFilter.getTestsForMutant(options.activeMutant, this.mutantCoverage!);
    
    if (coveringTests.length > 0) {
      const testNamePattern = TestFilter.createTestNamePattern(coveringTests);
      this.log.debug(`Mutant ${options.activeMutant.id} is covered by ${coveringTests.length} tests`);
      return { testNamePattern };
    }
    
    if (!TestFilter.shouldRunAllTests(options.activeMutant, this.mutantCoverage!)) {
      this.log.debug(`Mutant ${options.activeMutant.id} is not covered by any test`);
      return { shouldSkip: true };
    }
    
    return {};
  }

  private processMutantResult(result: BunTestResult): MutantRunResult {
    if (result.failed > 0) {
      return {
        status: MutantRunStatus.Killed,
        failureMessage: result.failedTests?.[0]?.error || 'Test failed',
        killedBy: result.failedTests?.map((t) => t.id || t.name) || [],
        nrOfTests: result.total
      };
    }

    return this.createSurvivedResult(result.total);
  }

  private createSurvivedResult(nrOfTests: number): SurvivedMutantRunResult {
    return { status: MutantRunStatus.Survived, nrOfTests };
  }

  private handleMutantRunError(error: unknown, options: MutantRunOptions): MutantRunResult {
    this.log.debug('Mutant run failed', error);
    if (error && typeof error === 'object' && 'timedOut' in error && error.timedOut) {
      return { status: MutantRunStatus.Timeout, reason: `Mutant run timed out after ${options.timeout}ms` };
    }
    throw error;
  }

  private async validateBunInstallation(): Promise<void> {
    try {
      const { stdout } = await execa('bun', ['--version']);
      const version = stdout.trim();
      this.log.debug(`Found Bun version: ${version}`);
      
      if (!semver.gte(version.replace('bun ', ''), '1.0.0')) {
        throw new Error('Bun version 1.0.0 or higher is required');
      }
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        throw new Error('Bun not found. Please install Bun: https://bun.sh');
      }
      throw error;
    }
  }
}