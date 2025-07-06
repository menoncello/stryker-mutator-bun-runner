/**
 * Stryker configuration for testing the plugin itself
 * Uses command runner to avoid recursive process creation
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  testRunner: 'command',
  // Don't load the plugin when testing itself
  plugins: [],
  
  // Files to mutate
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts'
  ],

  // Command runner configuration for self-testing
  commandRunner: {
    command: 'npm test'
  },

  // Coverage analysis
  coverageAnalysis: 'perTest',
  
  // Timeout configuration
  timeoutMS: 30000,
  timeoutFactor: 3,

  // Logging
  logLevel: 'info',
  fileLogLevel: 'debug',
  
  // Thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Performance - reduce concurrency to limit process creation
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