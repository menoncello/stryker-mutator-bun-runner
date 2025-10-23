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
  exitCode?: number;
  signal?: string;
}

/**
 * Test execution options interface
 */
export interface TestExecutionOptions {
  testNames?: string[];
  timeout?: number;
  customArgs?: string[];
  coverage?: unknown;
}
