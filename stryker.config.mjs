/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  testRunner: 'bun',
  plugins: ['@stryker-mutator/bun-runner'],
  
  // Files to mutate
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/index.ts' // Entry point, usually just exports
  ],
  
  // Coverage analysis
  coverageAnalysis: 'perTest',
  
  // Timeout configuration
  timeoutMS: 30000, // 30 seconds base timeout
  timeoutFactor: 3, // Multiply timeout by 3 for mutant runs
  
  // Bun-specific configuration
  bun: {
    testFiles: ['test/**/*.test.ts'],
    timeout: 10000, // 10 seconds per test
    bail: true, // Stop on first failure for mutants
    processPool: true, // Enable process pooling
    maxWorkers: 4, // Number of worker processes
    env: {
      NODE_ENV: 'test'
    }
  },
  
  // Logging
  logLevel: 'info',
  fileLogLevel: 'debug',
  
  // Thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Performance
  concurrency: 4,
  
  // Temp directory
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  
  // Disable sandbox entirely since the test runner will handle running tests
  checkers: [],
  disableTypeChecks: true,
  sandbox: { fileHeaders: {} },
  
  // Reports
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html'
  }
};