/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  testRunner: 'command',
  plugins: [],
  
  // Files to mutate
  mutate: [
    'src/**/*.ts',
  ],

  commandRunner: {
    command: 'bun test'
  },

// Coverage analysis
  coverageAnalysis: 'perTest',
  
  // Timeout configuration
  timeoutMS: 30000, // 30 seconds base timeout
  timeoutFactor: 3, // Multiply timeout by 3 for mutant runs

  // Logging
  logLevel: 'info',
  fileLogLevel: 'debug',
  
  // Thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Performance - reduced to prevent process explosion
  concurrency: 8,
  
  // Temp directory
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  
  // Disable type checking
  checkers: [],
  disableTypeChecks: true,
  
  // Reports
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html'
  }
};