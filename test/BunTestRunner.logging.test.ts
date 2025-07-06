import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunTestRunner } from '../src/BunTestRunner';
import { MockLogger, MockBunAdapter, TestableClass } from './types/mocks';

describe('BunTestRunner Logging Tests', () => {
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
      trace: mock(() => {})
    };

    mockBunAdapter = {
      init: mock(async () => {}),
      dispose: mock(async () => {}),
      runTests: mock(async () => ({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'passed', duration: 10 }
        ],
        passed: 1,
        failed: 0,
        total: 1
      })),
      getCoverageCollector: mock(() => ({
        toMutantCoverage: mock((data: unknown) => {
          const coverage = data as { perTest?: Record<string, unknown>; static?: Record<string, unknown> } | null;
          return {
            perTest: coverage?.perTest || {},
            static: coverage?.static || {}
          };
        })
      }))
    };

    runner = new BunTestRunner(mockLogger, {});
    (runner as TestableClass<BunTestRunner>).bunAdapter = mockBunAdapter;
    (runner as TestableClass<BunTestRunner>).validateBunInstallation = mock(async () => {});
  });

  describe('debug logging', () => {
    test('should log debug messages in dryRun', async () => {
      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Starting dry run');
    });

    test('should log debug messages in mutantRun', async () => {
      const mutantId = '123';
      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: mutantId }
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(`Running mutant ${mutantId}`);
    });

    test('should log debug messages with test filter information', async () => {
      // Set up coverage to trigger test filter logging
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: { 'test1': { '123': 1 } },
        static: { '123': 1 }
      };

      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' },
        testFilter: ['test1', 'test2', 'test3']
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Using test filter for 3 tests');
    });

    test('should log debug messages with coverage information', async () => {
      // Set up coverage
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: { 'test1': { '123': 1 }, 'test2': { '123': 1 } },
        static: { '123': 1 }
      };

      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Mutant 123 is covered by 2 tests');
    });

    test('should log debug messages when mutant is not covered', async () => {
      // Set up coverage where mutant is not covered
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {},
        static: {} // No coverage for mutant 123
      };

      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Mutant 123 is not covered by any test');
    });

    test('should log debug message in coverage processing', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: {
          coverage: {
            coverage: {
              perTest: { 'test1': { '123': 1 } },
              static: { '123': 1 }
            }
          }
        }
      });

      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      expect(mockLogger.debug).toHaveBeenCalledWith('Processing coverage data');
    });

    test('should log debug message when mutant run fails', async () => {
      const error = new Error('Test execution failed');
      mockBunAdapter.runTests.mockRejectedValueOnce(error);

      try {
        await runner.mutantRun({
          timeout: 5000,
          activeMutant: { id: '123' }
        });
      } catch {
        // Expected to throw
      }

      expect(mockLogger.debug).toHaveBeenCalledWith('Mutant run failed', error);
    });

    test('should log initialization debug message', async () => {
      await runner.init();

      expect(mockLogger.debug).toHaveBeenCalledWith('Initializing Bun test runner');
    });
  });

  describe('info logging', () => {
    test('should log info message for coverage collection', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: {
          coverage: {
            perTest: { 'test1': { '123': 1 }, 'test2': { '456': 1 } },
            static: { '123': 1, '456': 1 }
          },
          elapsedMs: 10
        }
      });

      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Collected coverage for 2 tests');
    });

    test('should log info message for zero coverage tests', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: {
          coverage: {
            perTest: {},
            static: {}
          },
          elapsedMs: 10
        }
      });

      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      expect(mockLogger.info).toHaveBeenCalledWith('Collected coverage for 0 tests');
    });
  });

  describe('error logging', () => {
    test('should log error when dry run fails', async () => {
      const error = new Error('Execution failed');
      mockBunAdapter.runTests.mockRejectedValueOnce(error);

      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Dry run failed', error);
    });

    test('should log error when dry run times out', async () => {
      const timeoutError = { timedOut: true };
      mockBunAdapter.runTests.mockRejectedValueOnce(timeoutError);

      await runner.dryRun({
        timeout: 3000,
        coverageAnalysis: 'off'
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Dry run failed', timeoutError);
    });

    test('should log error with unknown error object', async () => {
      const unknownError = { someProperty: 'unknown' };
      mockBunAdapter.runTests.mockRejectedValueOnce(unknownError);

      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(mockLogger.error).toHaveBeenCalledWith('Dry run failed', unknownError);
    });
  });

  describe('logger method usage validation', () => {
    test('should use specific logger methods appropriately', async () => {
      // Test that debug is called but not info for init
      await runner.init();
      
      expect(mockLogger.debug).toHaveBeenCalled();
      expect(mockLogger.info).not.toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test('should use debug for routine operations', async () => {
      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      // Debug should be called for starting dry run
      expect(mockLogger.debug).toHaveBeenCalledWith('Starting dry run');
      
      // No warnings or errors for successful operation
      expect(mockLogger.warn).not.toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    test('should use info for important information', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: {
          coverage: {
            perTest: { 'test1': { '123': 1 } },
            static: { '123': 1 }
          },
          elapsedMs: 10
        }
      });

      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      // Info should be called for coverage results
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Collected coverage for'));
      
      // Debug should also be called for processing
      expect(mockLogger.debug).toHaveBeenCalledWith('Processing coverage data');
    });

    test('should validate logger call counts and parameters', async () => {
      // Set up a complex scenario
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: { 'test1': { '123': 1 } },
        static: { '123': 1 }
      };

      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' },
        testFilter: ['test1']
      });

      // Verify specific debug calls
      expect(mockLogger.debug).toHaveBeenCalledWith('Running mutant 123');
      expect(mockLogger.debug).toHaveBeenCalledWith('Using test filter for 1 tests');
      
      // Should not have logged coverage messages in this case
      expect(mockLogger.debug).not.toHaveBeenCalledWith(expect.stringContaining('is covered by'));
      expect(mockLogger.debug).not.toHaveBeenCalledWith(expect.stringContaining('is not covered'));
    });

    test('should validate empty string logging patterns', async () => {
      // This test ensures that log messages are not empty
      await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      // Verify that debug was called with actual message, not empty string
      const debugCalls = mockLogger.debug.mock.calls;
      expect(debugCalls.length).toBeGreaterThan(0);
      
      // Check that none of the debug calls have empty strings
      for (const call of debugCalls) {
        expect(call[0]).not.toBe('');
        expect(call[0]).not.toBe('`');
        expect(typeof call[0]).toBe('string');
        expect(call[0].length).toBeGreaterThan(0);
      }
    });

    test('should test template literal logging patterns', async () => {
      // Set up scenario to trigger template literal logs
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: { 'test1': { '42': 1 }, 'test2': { '42': 1 } },
        static: { '42': 1 }
      };

      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '42' }
      });

      // Verify the template literal was properly formatted
      expect(mockLogger.debug).toHaveBeenCalledWith('Running mutant 42');
      expect(mockLogger.debug).toHaveBeenCalledWith('Mutant 42 is covered by 2 tests');
      
      // Verify these are not empty template literals
      const debugCalls = mockLogger.debug.mock.calls;
      const mutantCalls = debugCalls.filter(call => call[0].includes('Mutant 42'));
      expect(mutantCalls.length).toBeGreaterThan(0);
      
      for (const call of mutantCalls) {
        expect(call[0]).toContain('42');
        expect(call[0]).not.toBe('Mutant  is covered by  tests');
      }
    });
  });
});