/**
 * Safe Stryker configuration that avoids process explosion
 * Use this when testing files that manage processes
 */
export default {
  testRunner: 'command',
  commandRunner: {
    command: 'npm test'
  },
  
  // Files to mutate - exclude process management files by default
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/process/BunProcessPool.ts', // Exclude by default - causes process explosion
    '!src/process/WorkerManager.ts',  // Exclude by default - manages processes
    '!src/process/ProcessPoolSingleton.ts' // Exclude by default - singleton pattern
  ],

  // Mutation configuration
  mutator: {
    excludedMutations: [
      'ConditionalExpression', // if/else mutations can cause infinite loops
      'LogicalOperator',       // && || mutations can break process limits
      'EqualityOperator',      // < > mutations can break limit checks
    ]
  },

  // Coverage analysis
  coverageAnalysis: 'off', // Turn off to avoid process overhead
  
  // Timeout configuration
  timeoutMS: 20000,
  timeoutFactor: 2,

  // Logging
  logLevel: 'info',
  fileLogLevel: 'debug',
  
  // Thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50
  },
  
  // Performance settings
  concurrency: 2,
  
  // Temp directory
  tempDirName: '.stryker-tmp',
  cleanTempDir: true,
  
  // Disable type checking for speed
  checkers: [],
  disableTypeChecks: true,
  
  // Reports
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html'
  }
};

// To test process files specifically, use:
// npx stryker run -c stryker-safe.config.mjs --mutate "src/process/BunProcessPool.ts"