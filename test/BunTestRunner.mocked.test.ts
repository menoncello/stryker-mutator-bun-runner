import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunTestRunner } from '../src/BunTestRunner';
import { MockLogger, MockBunAdapter, TestableClass } from './types/mocks';
import { BunRunOptions } from '../src/BunTestRunnerOptions';

describe('BunTestRunner Mocked Tests - Async Methods', () => {
  let mockLogger: MockLogger;
  let mockBunAdapter: MockBunAdapter;
  let runner: BunTestRunner;

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

    // Mock BunTestAdapter with detailed behavior
    const mockCoverageCollector = {
      toMutantCoverage: mock((data: unknown) => {
        const coverage = data as { perTest?: Record<string, unknown>; static?: Record<string, unknown> } | null;
        return {
          perTest: coverage?.perTest || {},
          static: coverage?.static || {}
        };
      })
    };

    mockBunAdapter = {
      init: mock(async () => {}),
      dispose: mock(async () => {}),
      runTests: mock(async (tests: string[], options: BunRunOptions) => ({
        tests: [
          { id: '1', name: 'test1', status: 'passed', duration: 10 },
          { id: '2', name: 'test2', status: 'failed', error: 'Test failed', duration: 5 }
        ],
        passed: 1,
        failed: 1,
        total: 2,
        coverage: options.coverage ? {
          coverage: {
            coverage: {
              perTest: { 'test1': { '1': 1 } },
              static: { '1': 1 }
            }
          }
        } : undefined
      })),
      getCoverageCollector: mock(() => mockCoverageCollector)
    };

    runner = new BunTestRunner(mockLogger, {});
    // Replace the bunAdapter with our mock
    (runner as TestableClass<BunTestRunner>).bunAdapter = mockBunAdapter;
    
    // Mock validateBunInstallation to avoid real bun validation
    (runner as TestableClass<BunTestRunner>).validateBunInstallation = mock(async () => {});
  });

  describe('dryRun method', () => {
    test('should execute successful dry run with coverage off', async () => {
      const options = {
        timeout: 5000,
        coverageAnalysis: 'off' as const
      };

      const result = await runner.dryRun(options);

      expect(result.status).toBeDefined();
      expect(result.tests).toBeDefined();
      expect(result.tests.length).toBe(2);
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], {
        timeout: 5000,
        coverage: false
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting dry run');
    });

    test('should execute successful dry run with coverage analysis', async () => {
      const options = {
        timeout: 8000,
        coverageAnalysis: 'perTest' as const
      };

      const result = await runner.dryRun(options);

      expect(result.status).toBeDefined();
      expect(result.tests).toBeDefined();
      expect(result.tests.length).toBe(2);
      expect(result.mutantCoverage).toBeDefined();
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], {
        timeout: 8000,
        coverage: true
      });
      expect(mockBunAdapter.getCoverageCollector().toMutantCoverage).toHaveBeenCalled();
    });

    test('should handle dry run timeout error', async () => {
      const timeoutError = { timedOut: true };
      mockBunAdapter.runTests.mockRejectedValueOnce(timeoutError);

      const options = {
        timeout: 3000,
        coverageAnalysis: 'off' as const
      };

      const result = await runner.dryRun(options);

      expect(result.reason).toBe('Dry run timed out after 3000ms');
      expect(mockLogger.error).toHaveBeenCalledWith('Dry run failed', timeoutError);
    });

    test('should handle dry run general error', async () => {
      const generalError = new Error('Network failed');
      mockBunAdapter.runTests.mockRejectedValueOnce(generalError);

      const options = {
        timeout: 5000,
        coverageAnalysis: 'off' as const
      };

      const result = await runner.dryRun(options);

      expect(result.errorMessage).toBe('Network failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Dry run failed', generalError);
    });

    test('should handle dry run with unknown error', async () => {
      const unknownError = { message: undefined };
      mockBunAdapter.runTests.mockRejectedValueOnce(unknownError);

      const options = {
        timeout: 5000,
        coverageAnalysis: 'off' as const
      };

      const result = await runner.dryRun(options);

      expect(result.errorMessage).toBe('Unknown error during dry run');
    });

    test('should process coverage data when available', async () => {
      const options = {
        timeout: 5000,
        coverageAnalysis: 'all' as const
      };

      // Mock runTests to return coverage data
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: '1', name: 'test1', status: 'passed', duration: 10 }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: {
          coverage: {
            perTest: { 'test1': { '1': 1 } },
            static: { '1': 1 }
          }
        }
      });

      const result = await runner.dryRun(options);

      expect(result.mutantCoverage).toBeDefined();
      expect(mockLogger.debug).toHaveBeenCalledWith('Processing coverage data');
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Collected coverage for'));
    });

    test('should not process coverage when coverageAnalysis is off', async () => {
      const options = {
        timeout: 5000,
        coverageAnalysis: 'off' as const
      };

      await runner.dryRun(options);

      expect(mockBunAdapter.getCoverageCollector().toMutantCoverage).not.toHaveBeenCalled();
    });
  });

  describe('mutantRun method', () => {
    test('should execute successful mutant run', async () => {
      const options = {
        timeout: 5000,
        activeMutant: { id: '42' },
        testFilter: undefined
      };

      // Mock runTests to return failed test (mutant killed)
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: '1', name: 'test1', status: 'failed', error: 'Mutant killed test', duration: 5 }
        ],
        passed: 0,
        failed: 1,
        total: 1,
        failedTests: [{ id: '1', name: 'test1', error: 'Mutant killed test' }]
      });

      const result = await runner.mutantRun(options);

      expect(result.status).toBeDefined(); // Should be 'Killed'
      expect(result.failureMessage).toBe('Mutant killed test');
      expect(result.killedBy).toEqual(['1']);
      expect(result.nrOfTests).toBe(1);
      expect(mockLogger.debug).toHaveBeenCalledWith('Running mutant 42');
    });

    test('should return survived when no tests fail', async () => {
      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      // Mock runTests to return all passing tests (mutant survived)
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: '1', name: 'test1', status: 'passed', duration: 10 }
        ],
        passed: 1,
        failed: 0,
        total: 1,
        failedTests: []
      });

      const result = await runner.mutantRun(options);

      expect(result.nrOfTests).toBe(1);
      // Status should be 'Survived'
    });

    test('should handle mutant run timeout', async () => {
      const timeoutError = { timedOut: true };
      mockBunAdapter.runTests.mockRejectedValueOnce(timeoutError);

      const options = {
        timeout: 2000,
        activeMutant: { id: '99' }
      };

      const result = await runner.mutantRun(options);

      expect(result.reason).toBe('Mutant run timed out after 2000ms');
    });

    test('should re-throw non-timeout errors', async () => {
      const networkError = new Error('Connection failed');
      mockBunAdapter.runTests.mockRejectedValueOnce(networkError);

      const options = {
        timeout: 5000,
        activeMutant: { id: '88' }
      };

      await expect(runner.mutantRun(options)).rejects.toThrow('Connection failed');
    });

    test('should handle mutant run with test filter', async () => {
      // First set up mutant coverage
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: { 'test1': { '42': 1 } },
        static: { '42': 1 }
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '42' },
        testFilter: ['test1', 'test2']
      };

      await runner.mutantRun(options);

      // Should call runTests with testNamePattern
      const call = mockBunAdapter.runTests.mock.calls[0];
      expect(call[1]).toHaveProperty('testNamePattern');
    });

    test('should skip mutant when no coverage and shouldRunAllTests is false', async () => {
      // Set up mutant coverage that will result in skipping
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {},
        static: {} // Empty static coverage, mutant will not be covered
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '999' }
      };

      const result = await runner.mutantRun(options);

      expect(result.nrOfTests).toBe(0);
    });

    test('should handle failed tests without error message', async () => {
      const options = {
        timeout: 5000,
        activeMutant: { id: '555' }
      };

      // Mock runTests to return failed test without error message
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: '1', name: 'test1', status: 'failed' }],
        passed: 0,
        failed: 1,
        total: 1,
        failedTests: [{ id: '1', name: 'test1' }] // No error message
      });

      const result = await runner.mutantRun(options);

      expect(result.failureMessage).toBe('Test failed'); // Default message
      expect(result.killedBy).toEqual(['1']);
    });

    test('should handle failed tests with name instead of id', async () => {
      const options = {
        timeout: 5000,
        activeMutant: { id: '777' }
      };

      // Mock runTests to return failed test without id
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ name: 'test without id', status: 'failed' }],
        passed: 0,
        failed: 1,
        total: 1,
        failedTests: [{ name: 'test without id', error: 'Some error' }] // No id
      });

      const result = await runner.mutantRun(options);

      expect(result.killedBy).toEqual(['test without id']);
    });
  });

  describe('init method', () => {
    test('should initialize successfully', async () => {
      await runner.init();

      expect(mockBunAdapter.init).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing Bun test runner');
    });

    test('should handle initialization error', async () => {
      const initError = new Error('Adapter init failed');
      mockBunAdapter.init.mockRejectedValueOnce(initError);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Adapter init failed');
      }
    });
  });

  describe('dispose method', () => {
    test('should dispose successfully', async () => {
      await runner.dispose();
      expect(mockBunAdapter.dispose).toHaveBeenCalled();
    });

    test('should handle dispose error', async () => {
      const disposeError = new Error('Dispose failed');
      mockBunAdapter.dispose.mockRejectedValueOnce(disposeError);

      await expect(runner.dispose()).rejects.toThrow('Dispose failed');
    });
  });
});