import { Logger } from '@stryker-mutator/api/logging';
import { execa } from 'execa';
import { glob } from 'glob';
import { BunTestRunnerOptions, BunRunOptions, BunTestResult } from './BunTestRunnerOptions.js';
import { BunResultParser } from './BunResultParser.js';
import { MutantCoverageCollector, CoverageResult, CoverageHookGenerator } from './coverage/index.js';

export class BunTestAdapter {
  private readonly log: Logger;
  private readonly options: BunTestRunnerOptions;
  private readonly parser: BunResultParser;
  private readonly coverageCollector: MutantCoverageCollector;
  private readonly coverageHookGenerator: CoverageHookGenerator;
  private coverageHookPath?: string;

  constructor(logger: Logger, options: BunTestRunnerOptions) {
    this.log = logger;
    this.options = options;
    this.parser = new BunResultParser(logger);
    this.coverageCollector = new MutantCoverageCollector(logger);
    this.coverageHookGenerator = new CoverageHookGenerator();
  }

  public async init(): Promise<void> {
    await this.coverageCollector.init();
    
    // Create coverage hook file if coverage is enabled
    if (this.options.coverageAnalysis !== 'off') {
      await this.createCoverageHookFile();
    }
  }

  public async runTests(testFiles: string[], runOptions: BunRunOptions): Promise<BunTestResult> {
    const args = await this.buildBunArgs(testFiles, runOptions);
    const env = this.buildEnvironment(runOptions);

    // Start coverage collection if enabled
    let coverageResult: CoverageResult | undefined;
    if (runOptions.coverage) {
      this.coverageCollector.startCoverage();
    }

    this.log.debug(`Running bun with args: ${args.join(' ')}`);
    this.log.debug(`Environment variables: ${JSON.stringify(env)}`);
    this.log.debug(`Current working directory: ${process.cwd()}`);
    this.log.debug(`Test files config: ${JSON.stringify(this.options.testFiles)}`);

    try {
      const { stdout, stderr } = await execa('bun', args, {
        env,
        timeout: runOptions.timeout,
        reject: false // Don't reject on non-zero exit code
      });

      if (stderr) {
        this.log.debug(`Bun stderr: ${stderr}`);
      }
      
      if (stdout) {
        this.log.debug(`Bun stdout: ${stdout}`);
      }

      // Bun outputs test results to stderr when BUN_TEST_QUIET=1
      // So we need to parse stderr instead of stdout
      const outputToParse = stderr || stdout;
      const result = this.parser.parse(outputToParse);

      // Stop coverage collection if it was started
      if (runOptions.coverage) {
        coverageResult = this.coverageCollector.stopCoverage();
        result.coverage = coverageResult;
      }

      return result;
    } catch (error: unknown) {
      // Make sure to stop coverage collection on error
      if (runOptions.coverage) {
        this.coverageCollector.stopCoverage();
      }

      const errorObj = error as { timedOut?: boolean; message?: string };
      if (errorObj.timedOut) {
        errorObj.timedOut = true;
        throw error;
      }

      this.log.error('Failed to run bun tests', error);
      const message = errorObj.message || 'Unknown error';
      throw new Error(`Failed to run bun tests: ${message}`);
    }
  }

  public async dispose(): Promise<void> {
    await this.coverageCollector.dispose();
    
    // CoverageHookGenerator already handles errors internally in cleanup()
    // so we don't need to wrap this in try-catch
    await this.coverageHookGenerator.cleanup();
  }

  public getCoverageCollector(): MutantCoverageCollector {
    return this.coverageCollector;
  }

  private async createCoverageHookFile(): Promise<void> {
    this.coverageHookPath = await this.coverageHookGenerator.createHookFile();
    this.log.debug(`Created coverage hook file at ${this.coverageHookPath}`);
  }

  private buildEnvironment(options: BunRunOptions): Record<string, string> {
    const env: Record<string, string> = { ...process.env, NODE_ENV: 'test', ...this.options.env, ...options.env };
    if (options.activeMutant !== undefined) { env.__STRYKER_ACTIVE_MUTANT__ = options.activeMutant.toString(); }
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
  }

  private addNodeArgs(args: string[]): void {
    if (this.options.nodeArgs) {
      args.push(...this.options.nodeArgs);
    }
  }

}