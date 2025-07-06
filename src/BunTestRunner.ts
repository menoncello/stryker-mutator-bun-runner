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
  ErrorDryRunResult,
  TimeoutDryRunResult,
  KilledMutantRunResult,
  SurvivedMutantRunResult,
  TimeoutMutantRunResult,
  TestResult,
  FailedTestResult,
  SkippedTestResult,
  SuccessTestResult
} from '@stryker-mutator/api/dist/src/test-runner';
import { StrykerOptions } from '@stryker-mutator/api/dist/src/core';
import { Logger } from '@stryker-mutator/api/dist/src/logging';
import { tokens, commonTokens } from '@stryker-mutator/api/dist/src/plugin';
import { execa } from 'execa';
import * as semver from 'semver';
import { BunTestRunnerOptions, BunRunOptions, StrykerBunOptions } from './BunTestRunnerOptions';
import { BunTestAdapter } from './BunTestAdapter';
import { TestFilter } from './coverage';
import { MutantCoverage } from '@stryker-mutator/api/dist/src/core';

class Timer {
  private startTime: number = 0;
  
  reset(): void {
    this.startTime = Date.now();
  }
  
  elapsedMs(): number {
    return Date.now() - this.startTime;
  }
}

export class BunTestRunner implements TestRunner {
  private readonly log: Logger;
  private readonly options: BunTestRunnerOptions;
  private readonly bunAdapter: BunTestAdapter;
  private timer = new Timer();
  private mutantCoverage?: MutantCoverage;

  public static inject = tokens(commonTokens.logger, commonTokens.options);

  constructor(logger: Logger, options: StrykerOptions) {
    this.log = logger;
    const strykerBunOptions = options as StrykerBunOptions;
    this.options = {
      testFiles: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'],
      timeout: 5000,
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
      
      const tests: TestResult[] = result.tests.map((test, index) => {
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

      const completedResult: CompleteDryRunResult = {
        status: DryRunStatus.Complete,
        tests
      };

      if (options.coverageAnalysis !== 'off' && result.coverage) {
        this.log.debug('Processing coverage data');
        const mutantCoverage = this.bunAdapter.getCoverageCollector()
          .toMutantCoverage(result.coverage.coverage);
        
        completedResult.mutantCoverage = mutantCoverage;
        this.mutantCoverage = mutantCoverage; // Store for use in mutantRun
        this.log.info(`Collected coverage for ${Object.keys(mutantCoverage.perTest).length} tests`);
      }

      return completedResult;
    } catch (error: unknown) {
      this.log.error('Dry run failed', error);
      
      if (error && typeof error === 'object' && 'timedOut' in error && error.timedOut) {
        const timeoutResult: TimeoutDryRunResult = {
          status: DryRunStatus.Timeout,
          reason: `Dry run timed out after ${options.timeout}ms`
        };
        return timeoutResult;
      }

      const errorResult: ErrorDryRunResult = {
        status: DryRunStatus.Error,
        errorMessage: (error as { message?: string }).message || 'Unknown error during dry run'
      };
      return errorResult;
    }
  }

  public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
    this.log.debug(`Running mutant ${options.activeMutant.id}`);
    this.timer.reset();

    try {
      const runOptions: BunRunOptions = {
        timeout: options.timeout,
        bail: true,
        activeMutant: parseInt(options.activeMutant.id, 10),
        env: {
          __STRYKER_ACTIVE_MUTANT__: options.activeMutant.id.toString()
        }
      };

      // Check if we should filter tests based on coverage
      const testFilesToRun: string[] = [];
      let testNamePattern: string | undefined;

      if (this.mutantCoverage && options.testFilter) {
        // Use provided test filter from Stryker
        testNamePattern = TestFilter.createTestNamePattern(options.testFilter);
        this.log.debug(`Using test filter for ${options.testFilter.length} tests`);
      } else if (this.mutantCoverage) {
        // Use our own filtering based on coverage
        const coveringTests = TestFilter.getTestsForMutant(options.activeMutant, this.mutantCoverage);
        
        if (coveringTests.length > 0) {
          testNamePattern = TestFilter.createTestNamePattern(coveringTests);
          this.log.debug(`Mutant ${options.activeMutant.id} is covered by ${coveringTests.length} tests`);
        } else if (!TestFilter.shouldRunAllTests(options.activeMutant, this.mutantCoverage)) {
          // Mutant is not covered by any test
          this.log.debug(`Mutant ${options.activeMutant.id} is not covered by any test`);
          const survivedResult: SurvivedMutantRunResult = {
            status: MutantRunStatus.Survived,
            nrOfTests: 0
          };
          return survivedResult;
        }
      }

      if (testNamePattern) {
        runOptions.testNamePattern = testNamePattern;
      }

      const result = await this.bunAdapter.runTests(testFilesToRun, runOptions);

      if (result.failed > 0) {
        const killedResult: KilledMutantRunResult = {
          status: MutantRunStatus.Killed,
          failureMessage: result.failedTests?.[0]?.error || 'Test failed',
          killedBy: result.failedTests?.map(t => t.id || t.name) || [],
          nrOfTests: result.total
        };
        return killedResult;
      }

      const survivedResult: SurvivedMutantRunResult = {
        status: MutantRunStatus.Survived,
        nrOfTests: result.total
      };
      return survivedResult;
    } catch (error: unknown) {
      this.log.debug('Mutant run failed', error);
      
      if (error && typeof error === 'object' && 'timedOut' in error && error.timedOut) {
        const timeoutResult: TimeoutMutantRunResult = {
          status: MutantRunStatus.Timeout,
          reason: `Mutant run timed out after ${options.timeout}ms`
        };
        return timeoutResult;
      }

      // Re-throw other errors
      throw error;
    }
  }

  public async dispose(): Promise<void> {
    this.log.debug('Disposing Bun test runner');
    await this.bunAdapter.dispose();
  }

  public capabilities(): TestRunnerCapabilities {
    return {
      reloadEnvironment: true
    };
  }

  private async validateBunInstallation(): Promise<void> {
    try {
      const { stdout } = await execa('bun', ['--version']);
      const version = stdout.trim();
      this.log.info(`Found Bun version: ${version}`);
      
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