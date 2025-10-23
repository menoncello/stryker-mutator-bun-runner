/**
 * Process Execution Module
 *
 * Handles spawning and managing Bun processes for test execution.
 * Provides secure process management with proper cleanup.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import type { BunTestRunnerConfig } from '../config/index.js';
import { Logger } from '../utils/index.js';

// Constants for process management
const MAX_COMMAND_ARG_LENGTH = 1000;
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Test execution result interface
 */
export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * Process execution result interface
 */
export interface ProcessExecutionResult {
  stdout: string;
  stderr: string;
  status: number;
  exitCode: number | undefined;
  signal: string | undefined;
}

/**
 * Handles execution of Bun processes with proper security and cleanup
 */
export class ProcessExecutor {
  private readonly config: BunTestRunnerConfig;
  private readonly logger: Logger;
  private activeProcesses: Set<ChildProcess> = new Set();

  /**
   * Create a new ProcessExecutor
   *
   * @param config - Configuration object for the test runner
   * @param logger - Logger instance for logging operations
   * @returns A new ProcessExecutor instance
   */
  constructor(config: BunTestRunnerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Validate Bun installation
   * @returns Promise that resolves when Bun installation is validated
   */
  public async validateBunInstallation(): Promise<void> {
    this.logger.info('Validating Bun installation');

    try {
      const result = spawnSync('bun', ['--version'], {
        stdio: 'pipe',
        timeout: DEFAULT_TIMEOUT_MS,
      });

      if (result.status !== 0) {
        throw new Error(`Bun validation failed with exit code ${result.status}`);
      }

      const versionOutput = result.stdout?.toString().trim() || '';
      if (!versionOutput.includes('bun')) {
        throw new Error('Bun version command output does not appear valid');
      }

      this.logger.info('Bun installation validated successfully', {
        version: versionOutput,
      });
    } catch (error) {
      this.logger.error('Bun validation failed', error as Error);
      throw error;
    }
  }

  /**
   * Execute tests with given options
   *
   * @param options - Test execution options
   * @param options.testNames - Array of specific test names to run (optional)
   * @param options.timeout - Custom timeout for test execution in milliseconds (optional)
   * @param options.customArgs - Additional command line arguments for bun test (optional)
   * @returns Test execution results including test status and coverage
   */
  public async executeTests(options: {
    testNames?: string[];
    timeout?: number;
    customArgs?: string[];
  }): Promise<{
    tests: TestResult[];
    allTestsPassed: boolean;
    coverage?: unknown;
  }> {
    this.logger.info('Executing tests', {
      testNames: options.testNames,
      timeout: options.timeout || this.config.timeout,
    });

    const testCommand = this.buildTestCommand(options);

    try {
      const result = await this.executeCommand(testCommand);
      return this.parseTestResults(result);
    } catch (error) {
      this.logger.error('Test execution failed', error as Error);
      throw error;
    }
  }

  /**
   * Build test command with proper escaping and security validation
   * @param options - Test execution options
   * @param options.testNames - Array of specific test names to run (optional)
   * @param options.timeout - Custom timeout for test execution in milliseconds (optional)
   * @param options.customArgs - Additional command line arguments for bun test (optional)
   * @returns Built test command string with proper escaping
   */
  private buildTestCommand(options: {
    testNames?: string[];
    timeout?: number;
    customArgs?: string[];
  }): string {
    const { bunCommand, testCommand } = this.config;

    // Build argument array with validation
    const args: string[] = [];

    // Add test names if provided
    if (options.testNames && options.testNames.length > 0) {
      args.push(...options.testNames);
    } else {
      args.push(testCommand);
    }

    // Add custom arguments if provided
    if (options.customArgs && options.customArgs.length > 0) {
      // Filter dangerous patterns from custom args
      const safeArgs = this.validateCommandArgs(options.customArgs);
      if (safeArgs.isValid) {
        args.push(...safeArgs.args);
      } else {
        this.logger.warn('Custom arguments blocked due to security validation', {
          reason: safeArgs.reason,
        });
      }
    }

    // Escape arguments properly
    const escapedArgs = args.map(arg => this.escapeShellArg(arg));
    return `${bunCommand} test ${escapedArgs.join(' ')}`;
  }

  /**
   * Escape shell arguments to prevent injection
   * @param arg - The argument to escape
   * @returns The escaped argument safe for shell execution
   */
  private escapeShellArg(arg: string): string {
    // Basic shell escaping to prevent command injection
    return arg.replace(/'/g, "'\"'\"'").replace(/\\/g, '\\\\').replace(/ /g, '\\ ');
  }

  /**
   * Validate command arguments for security
   * @param args - Array of command arguments to validate
   * @returns Validation result with validity status, processed args, and optional reason for invalidation
   */
  private validateCommandArgs(args: string[]): {
    isValid: boolean;
    args: string[];
    reason?: string;
  } {
    const result: { isValid: boolean; args: string[]; reason?: string } = {
      isValid: true,
      args: [],
    };

    for (const arg of args) {
      // Check for dangerous patterns
      const dangerousPatterns = [
        /rm\s+-rf/i, // Recursive delete
        />\s*\/dev\/null/i, // Dev null device
        /\$\(/i, // Command substitution
        /&&.*rm/i, // Command chaining with delete
        /\|\s*nc\s+/i, // Netcat (potential reverse shell)
        /curl.*\|\s*sh/i, // Pipe to shell
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(arg)) {
          result.isValid = false;
          result.reason = `Dangerous command argument detected: ${arg}`;
          this.logger.warn('Dangerous command argument blocked', { arg });
          return result;
        }
      }

      // Check argument length
      if (arg.length > MAX_COMMAND_ARG_LENGTH) {
        this.logger.warn('Command argument length exceeds recommended maximum', { arg });
      }

      result.args.push(arg);
    }

    return result;
  }

  /**
   * Execute command safely with proper error handling
   * @param command - The shell command to execute
   * @returns Promise that resolves to the execution result with output, error, and status
   */
  private async executeCommand(command: string): Promise<ProcessExecutionResult> {
    return new Promise((resolve, reject) => {
      const timeoutMs = this.config.timeout;

      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Command timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      const child = spawn(command, {
        shell: true,
        stdio: ['pipe', 'pipe'],
        env: this.getSafeEnvironment(),
        detached: false,
      });

      this.activeProcesses.add(child);

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', data => {
        stdout += data;
      });

      child.stderr?.on('data', data => {
        stderr += data;
      });

      child.on('close', (code, signal) => {
        clearTimeout(timeoutHandle);
        this.activeProcesses.delete(child);

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          status: code || 0,
          exitCode: code || undefined,
          signal: signal || undefined,
        });
      });

      child.on('error', error => {
        clearTimeout(timeoutHandle);
        this.activeProcesses.delete(child);
        reject(error);
      });
    });
  }

  /**
   * Parse test results from command output
   * @param result - Process execution result containing stdout and status
   * @returns Parsed test results with test array and overall pass status
   */
  private parseTestResults(result: ProcessExecutionResult): {
    tests: TestResult[];
    allTestsPassed: boolean;
  } {
    // Parse output to determine test results
    const allPassed = result.status === 0 && !result.stderr;

    // Extract test information from output
    const outputLines = result.stdout
      .split('\n')
      .filter(line => line.trim())
      .filter(line => line.includes('✓') || line.includes('✗') || line.includes('✖'));

    const tests: TestResult[] = [];

    for (const line of outputLines) {
      if (line.includes('✓') || line.includes('✗') || line.includes('✖')) {
        const passed = line.includes('✓');
        const testName = line.replace(/[✓✖✗]/g, '').trim();

        tests.push({
          name: testName,
          passed,
        });
      }
    }

    return {
      tests,
      allTestsPassed: allPassed,
    };
  }

  /**
   * Get safe environment variables for process execution
   * @returns A record of safe environment variables for process execution
   */
  private getSafeEnvironment(): Record<string, string> {
    const env: Record<string, string> = {};

    // Copy safe environment variables
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        env[key] = value;
      }
    }

    // Ensure critical environment variables are set
    env.NODE_ENV = 'test';
    env.STRYKER_MUTATOR = 'true';
    if (process.env.PATH) {
      env.PATH = process.env.PATH;
    }

    // Remove potentially dangerous environment variables
    delete env.DANGEROUS_ENV_VAR;
    delete env.MALICIOUS_PAYLOAD;

    return env;
  }

  /**
   * Kill all active processes safely
   * @param process
   */
  private killProcess(process: ChildProcess): Promise<void> {
    return new Promise(resolve => {
      if (process.killed) {
        resolve();
      } else {
        process.kill('SIGTERM');

        // Give time for graceful shutdown
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
          resolve();
        }, DEFAULT_TIMEOUT_MS);
      }
    });
  }

  /**
   * Dispose of resources
   * @returns Promise that resolves when resources are disposed
   */
  public async dispose(): Promise<void> {
    this.logger.info('Disposing process executor');

    // Kill all active processes safely
    const killPromises = Array.from(this.activeProcesses).map(
      process =>
        new Promise<void>(resolve => {
          if (process.killed) {
            resolve();
          } else {
            process.kill('SIGTERM');
            setTimeout(() => {
              if (!process.killed) {
                process.kill('SIGKILL');
              }
              resolve();
            }, DEFAULT_TIMEOUT_MS);
          }
        })
    );

    await Promise.all(killPromises);
    this.activeProcesses.clear();

    this.logger.info('Process executor disposed successfully');
  }
}
