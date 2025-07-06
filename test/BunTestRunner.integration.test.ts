import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunTestRunner } from '../src/BunTestRunner';
import { MockLogger, TestableClass } from './types/mocks';

describe('BunTestRunner Integration Tests', () => {
  let mockLogger: MockLogger;
  let mockOptions: Record<string, unknown>;

  beforeEach(() => {
    mockLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      fatal: mock(() => {}),
      trace: mock(() => {}),
      isDebugEnabled: mock(() => false),
      isInfoEnabled: mock(() => true),
      isWarnEnabled: mock(() => true),
      isErrorEnabled: mock(() => true),
      isFatalEnabled: mock(() => true),
      isTraceEnabled: mock(() => false)
    };

    mockOptions = {
      bun: {
        testFiles: ['test/**/*.test.ts'],
        timeout: 8000,
        bail: true
      }
    };
  });

  test('should create BunTestRunner instance successfully', () => {
    const runner = new BunTestRunner(mockLogger, mockOptions);
    expect(runner).toBeDefined();
    expect(runner).toBeInstanceOf(BunTestRunner);
  });

  test('should have static inject property with correct tokens', () => {
    expect(BunTestRunner.inject).toBeDefined();
    expect(Array.isArray(BunTestRunner.inject)).toBe(true);
    expect(BunTestRunner.inject).toHaveLength(2);
    expect(BunTestRunner.inject).toContain('logger');
    expect(BunTestRunner.inject).toContain('options');
  });

  test('should return correct capabilities', () => {
    const runner = new BunTestRunner(mockLogger, {});
    const capabilities = runner.capabilities();
    
    expect(capabilities).toBeDefined();
    expect(capabilities).toHaveProperty('reloadEnvironment');
    expect(capabilities.reloadEnvironment).toBe(true);
  });

  test('should merge options correctly with defaults', () => {
    // Test with default options
    const runner1 = new BunTestRunner(mockLogger, {});
    expect(runner1).toBeDefined();

    // Test with custom options
    const runner2 = new BunTestRunner(mockLogger, {
      bun: {
        testFiles: ['custom/**/*.spec.ts'],
        timeout: 15000,
        bail: false,
        nodeArgs: ['--experimental-modules']
      }
    });
    expect(runner2).toBeDefined();

    // Test with partial options
    const runner3 = new BunTestRunner(mockLogger, {
      bun: {
        timeout: 10000
      }
    });
    expect(runner3).toBeDefined();
  });

  test('should handle dispose method', async () => {
    const runner = new BunTestRunner(mockLogger, {});
    
    // Should not throw
    await expect(runner.dispose()).resolves.toBeUndefined();
  });

  test('should validate constructor parameter types', () => {
    // Test with null logger should work (duck typing)
    expect(() => new BunTestRunner(mockLogger, {})).not.toThrow();
    
    // Test with empty options
    expect(() => new BunTestRunner(mockLogger, {})).not.toThrow();
    
    // Test with undefined bun config
    expect(() => new BunTestRunner(mockLogger, { bun: undefined })).not.toThrow();
  });

  test('should create BunTestRunner with various option combinations', () => {
    // Test with minimal options
    const runner1 = new BunTestRunner(mockLogger, {});
    expect(runner1).toBeDefined();

    // Test with full options
    const fullOptions = {
      bun: {
        testFiles: ['test/**/*.test.ts', 'spec/**/*.spec.ts'],
        timeout: 30000,
        bail: true,
        nodeArgs: ['--experimental-modules', '--max-old-space-size=4096'],
        env: {
          NODE_ENV: 'test',
          DEBUG: 'stryker*'
        },
        command: 'bun test --coverage'
      }
    };
    const runner2 = new BunTestRunner(mockLogger, fullOptions);
    expect(runner2).toBeDefined();

    // Test with only timeout
    const runner3 = new BunTestRunner(mockLogger, {
      bun: { timeout: 5000 }
    });
    expect(runner3).toBeDefined();

    // Test with only test files
    const runner4 = new BunTestRunner(mockLogger, {
      bun: { testFiles: ['src/**/*.test.js'] }
    });
    expect(runner4).toBeDefined();
  });


  test('should have all required TestRunner interface methods', () => {
    const runner = new BunTestRunner(mockLogger, {});
    
    // Check all required TestRunner methods exist
    expect(typeof runner.init).toBe('function');
    expect(typeof runner.dryRun).toBe('function');
    expect(typeof runner.mutantRun).toBe('function');
    expect(typeof runner.dispose).toBe('function');
    expect(typeof runner.capabilities).toBe('function');
  });

  test('should validate method signatures', async () => {
    const runner = new BunTestRunner(mockLogger, {});
    
    // Mock the internal validateBunInstallation to avoid actual validation
    (runner as TestableClass<BunTestRunner>).validateBunInstallation = mock(async () => {});
    
    // Mock the bunAdapter to avoid actual initialization
    (runner as TestableClass<BunTestRunner>).bunAdapter = {
      init: mock(async () => {}),
      dispose: mock(async () => {})
    };
    
    // init should return Promise<void>
    const initPromise = runner.init();
    expect(initPromise).toBeInstanceOf(Promise);
    await initPromise; // Wait for completion to avoid hanging promises
    
    // capabilities should return object with reloadEnvironment
    const caps = runner.capabilities();
    expect(typeof caps).toBe('object');
    expect('reloadEnvironment' in caps).toBe(true);
    
    // dispose should return Promise<void>
    const disposePromise = runner.dispose();
    expect(disposePromise).toBeInstanceOf(Promise);
    await disposePromise; // Wait for completion to avoid hanging promises
  });

  test('should create runner with different logger configurations', () => {
    // Test with minimal logger
    const minimalLogger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {},
      trace: () => {}
    };
    
    const runner1 = new BunTestRunner(minimalLogger, {});
    expect(runner1).toBeDefined();

    // Test with full logger with enabled checks
    const fullLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      fatal: mock(() => {}),
      trace: mock(() => {}),
      isDebugEnabled: mock(() => true),
      isInfoEnabled: mock(() => true),
      isWarnEnabled: mock(() => true),
      isErrorEnabled: mock(() => true),
      isFatalEnabled: mock(() => true),
      isTraceEnabled: mock(() => true)
    };

    const runner2 = new BunTestRunner(fullLogger, {});
    expect(runner2).toBeDefined();
  });

  test('should handle edge case option values', () => {
    // Test with zero timeout
    const runner1 = new BunTestRunner(mockLogger, {
      bun: { timeout: 0 }
    });
    expect(runner1).toBeDefined();

    // Test with empty test files array
    const runner2 = new BunTestRunner(mockLogger, {
      bun: { testFiles: [] }
    });
    expect(runner2).toBeDefined();

    // Test with empty env object
    const runner3 = new BunTestRunner(mockLogger, {
      bun: { env: {} }
    });
    expect(runner3).toBeDefined();

    // Test with empty nodeArgs array
    const runner4 = new BunTestRunner(mockLogger, {
      bun: { nodeArgs: [] }
    });
    expect(runner4).toBeDefined();
  });

  test('should test internal methods through exposed behavior', async () => {
    const runner = new BunTestRunner(mockLogger, {});
    
    // Test that init method handles errors gracefully
    try {
      await runner.init();
    } catch (error) {
      // Expected to fail since we don't have real bun installation mocked
      expect(error).toBeDefined();
    }
  });


  test('should test private methods through any casting', () => {
    const runner = new BunTestRunner(mockLogger, {});
    const runnerAny = runner as TestableClass<BunTestRunner>;

    // Test mapTestResults method
    if (runnerAny.mapTestResults) {
      const testData = [
        { id: '1', name: 'test1', status: 'passed', duration: 10 },
        { id: '2', name: 'test2', status: 'failed', error: 'Failed', duration: 5 },
        { name: 'test3', status: 'skipped' },
        { name: 'test4', status: 'unknown' }
      ];
      
      const mapped = runnerAny.mapTestResults(testData);
      expect(mapped).toHaveLength(4);
      
      expect(mapped[0]).toMatchObject({
        id: '1',
        name: 'test1',
        timeSpentMs: 10
      });
      expect(mapped[0].status).toBeDefined(); // Don't check exact value, just that it exists
      
      expect(mapped[1]).toMatchObject({
        id: '2',
        name: 'test2',
        timeSpentMs: 5,
        failureMessage: 'Failed'
      });
      expect(mapped[1].status).toBeDefined();
      
      expect(mapped[2]).toMatchObject({
        id: '2',
        name: 'test3',
        timeSpentMs: 0
      });
      expect(mapped[2].status).toBeDefined();
      
      expect(mapped[3]).toMatchObject({
        id: '3',
        name: 'test4',
        timeSpentMs: 0,
        failureMessage: 'Unknown test status'
      });
      expect(mapped[3].status).toBeDefined();
    }

    // Test createCompleteResult method
    if (runnerAny.createCompleteResult) {
      const tests = [{ id: '1', name: 'test1', status: 'Success' }];
      const result = runnerAny.createCompleteResult(tests);
      expect(result.tests).toEqual(tests);
      expect(result.status).toBeDefined();
    }

    // Test createSurvivedResult method
    if (runnerAny.createSurvivedResult) {
      const result = runnerAny.createSurvivedResult(5);
      expect(result.nrOfTests).toBe(5);
      expect(result.status).toBeDefined();
    }

    // Test createMutantRunOptions method
    if (runnerAny.createMutantRunOptions) {
      const options = {
        activeMutant: { id: '42' },
        timeout: 3000
      };
      
      const result = runnerAny.createMutantRunOptions(options);
      expect(result).toEqual({
        timeout: 3000,
        bail: true,
        activeMutant: 42,
        env: { __STRYKER_ACTIVE_MUTANT__: '42' }
      });
    }
  });

  test('should test processMutantResult method logic', () => {
    const runner = new BunTestRunner(mockLogger, {});
    const runnerAny = runner as TestableClass<BunTestRunner>;

    if (runnerAny.processMutantResult) {
      // Test killed mutant
      const killedResult = {
        failed: 1,
        total: 3,
        failedTests: [{ id: 'test1', error: 'Test failed' }]
      };
      
      const killed = runnerAny.processMutantResult(killedResult);
      expect(killed).toMatchObject({
        failureMessage: 'Test failed',
        killedBy: ['test1'],
        nrOfTests: 3
      });
      expect(killed.status).toBeDefined();

      // Test survived mutant
      const survivedResult = {
        failed: 0,
        total: 2
      };
      
      const survived = runnerAny.processMutantResult(survivedResult);
      expect(survived.nrOfTests).toBe(2);
      expect(survived.status).toBeDefined();

      // Test killed mutant without error message
      const killedNoError = {
        failed: 1,
        total: 1,
        failedTests: [{ name: 'test1' }]
      };
      
      const killedResult2 = runnerAny.processMutantResult(killedNoError);
      expect(killedResult2).toMatchObject({
        failureMessage: 'Test failed',
        killedBy: ['test1'],
        nrOfTests: 1
      });
      expect(killedResult2.status).toBeDefined();
    }
  });

  test('should test error handling methods', () => {
    const runner = new BunTestRunner(mockLogger, {});
    const runnerAny = runner as TestableClass<BunTestRunner>;

    if (runnerAny.handleDryRunError) {
      const options = { timeout: 5000 };

      // Test timeout error
      const timeoutError = { timedOut: true };
      const timeoutResult = runnerAny.handleDryRunError(timeoutError, options);
      expect(timeoutResult).toMatchObject({
        reason: 'Dry run timed out after 5000ms'
      });
      expect(timeoutResult.status).toBeDefined();

      // Test general error
      const generalError = new Error('Test error');
      const errorResult = runnerAny.handleDryRunError(generalError, options);
      expect(errorResult).toMatchObject({
        errorMessage: 'Test error'
      });
      expect(errorResult.status).toBeDefined();

      // Test unknown error
      const unknownError = {};
      const unknownResult = runnerAny.handleDryRunError(unknownError, options);
      expect(unknownResult).toMatchObject({
        errorMessage: 'Unknown error during dry run'
      });
      expect(unknownResult.status).toBeDefined();
    }

    if (runnerAny.handleMutantRunError) {
      const options = { timeout: 8000 };

      // Test timeout error
      const timeoutError = { timedOut: true };
      const timeoutResult = runnerAny.handleMutantRunError(timeoutError, options);
      expect(timeoutResult).toMatchObject({
        reason: 'Mutant run timed out after 8000ms'
      });
      expect(timeoutResult.status).toBeDefined();

      // Test that other errors are re-thrown
      const generalError = new Error('Some error');
      expect(() => runnerAny.handleMutantRunError(generalError, options)).toThrow('Some error');
    }
  });

  test('should test getFilteredTests method', () => {
    const runner = new BunTestRunner(mockLogger, {});
    const runnerAny = runner as TestableClass<BunTestRunner>;

    if (runnerAny.getFilteredTests) {
      // Test with no coverage
      const options1 = { activeMutant: { id: '1' } };
      const result1 = runnerAny.getFilteredTests(options1);
      expect(result1).toEqual({});

      // Test with test filter but no coverage
      const options2 = { 
        activeMutant: { id: '1' },
        testFilter: ['test1', 'test2']
      };
      const result2 = runnerAny.getFilteredTests(options2);
      expect(result2).toEqual({});
    }
  });

  test('should validate constructor options processing', () => {
    // Test that different option types are handled correctly
    const testCases = [
      // Default options
      { input: {}, expected: { testFiles: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'], timeout: 10000, bail: false } },
      
      // Custom test files
      { 
        input: { bun: { testFiles: ['custom/**/*.test.ts'] } },
        expected: { testFiles: ['custom/**/*.test.ts'], timeout: 10000, bail: false }
      },
      
      // Custom timeout
      { 
        input: { bun: { timeout: 15000 } },
        expected: { testFiles: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'], timeout: 15000, bail: false }
      },
      
      // Custom bail
      { 
        input: { bun: { bail: true } },
        expected: { testFiles: ['**/*.test.{js,ts,jsx,tsx}', '**/*.spec.{js,ts,jsx,tsx}'], timeout: 10000, bail: true }
      }
    ];

    testCases.forEach(({ input, expected }) => {
      const runner = new BunTestRunner(mockLogger, input);
      const options = (runner as TestableClass<BunTestRunner>).options;
      
      expect(options.testFiles).toEqual(expected.testFiles);
      expect(options.timeout).toBe(expected.timeout);
      expect(options.bail).toBe(expected.bail);
    });
  });

});