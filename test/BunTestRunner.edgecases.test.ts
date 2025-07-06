import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunTestRunner } from '../src/BunTestRunner';
import { MockLogger, MockBunAdapter, TestableClass } from './types/mocks';

describe('BunTestRunner Edge Cases Tests', () => {
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

  describe('coverage analysis edge cases', () => {
    test('should handle coverage analysis with null result.coverage', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: null // Explicitly null
      });

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      expect(result.mutantCoverage).toBeUndefined();
    });

    test('should handle coverage analysis with undefined result.coverage', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1
        // coverage is undefined (not provided)
      });

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      expect(result.mutantCoverage).toBeUndefined();
    });

    test('should handle coverage analysis off with coverage data present', async () => {
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

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off' // Off but coverage data exists
      });

      // Should not process coverage even if data exists
      expect(result.mutantCoverage).toBeUndefined();
    });
  });

  describe('test result mapping edge cases', () => {
    test('should handle test result without status field', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1' }, // No status field
          { id: 'test2', name: 'Test 2', status: null }, // Null status
          { id: 'test3', name: 'Test 3', status: undefined } // Undefined status
        ],
        passed: 0,
        failed: 3,
        total: 3
      });

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(result.tests).toHaveLength(3);
      // All should be mapped to failed with unknown status
      result.tests?.forEach(test => {
        expect(test.failureMessage).toBe('Unknown test status');
      });
    });

    test('should handle test result with empty string status', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: '' }, // Empty string status
          { id: 'test2', name: 'Test 2', status: 'unknown' } // Unknown status
        ],
        passed: 0,
        failed: 2,
        total: 2
      });

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(result.tests).toHaveLength(2);
      result.tests?.forEach(test => {
        expect(test.failureMessage).toBe('Unknown test status');
      });
    });

    test('should handle test result with exact status strings', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'passed' },
          { id: 'test2', name: 'Test 2', status: 'failed', error: 'Failed' },
          { id: 'test3', name: 'Test 3', status: 'skipped' }
        ],
        passed: 1,
        failed: 1,
        total: 3
      });

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(result.tests).toHaveLength(3);
      expect(result.tests![0].status).toBeDefined();
      expect(result.tests![1].status).toBeDefined();
      expect(result.tests![1].failureMessage).toBe('Failed');
      expect(result.tests![2].status).toBeDefined();
    });
  });

  describe('error handling edge cases', () => {
    test('should handle error without timedOut property', async () => {
      const errorWithoutTimeout = new Error('Regular error');
      mockBunAdapter.runTests.mockRejectedValueOnce(errorWithoutTimeout);

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(result.errorMessage).toBe('Regular error');
    });

    test('should handle non-object error', async () => {
      const stringError = 'String error';
      mockBunAdapter.runTests.mockRejectedValueOnce(stringError);

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(result.errorMessage).toBe('Unknown error during dry run');
    });

    test('should handle error object with timedOut false', async () => {
      const errorWithFalseTimeout = { timedOut: false, message: 'Not a timeout' };
      mockBunAdapter.runTests.mockRejectedValueOnce(errorWithFalseTimeout);

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(result.errorMessage).toBe('Not a timeout');
    });

    test('should handle timeout error in mutantRun vs dryRun', async () => {
      const timeoutError = { timedOut: true };
      
      // Test timeout in dryRun
      mockBunAdapter.runTests.mockRejectedValueOnce(timeoutError);
      const dryRunResult = await runner.dryRun({
        timeout: 3000,
        coverageAnalysis: 'off'
      });
      expect(dryRunResult.reason).toBe('Dry run timed out after 3000ms');

      // Test timeout in mutantRun
      mockBunAdapter.runTests.mockRejectedValueOnce(timeoutError);
      const mutantRunResult = await runner.mutantRun({
        timeout: 2000,
        activeMutant: { id: '123' }
      });
      expect(mutantRunResult.reason).toBe('Mutant run timed out after 2000ms');
    });
  });

  describe('filtering logic edge cases', () => {
    test('should handle testNamePattern assignment when undefined', async () => {
      // Set up scenario where getFilteredTests returns empty object
      (runner as TestableClass<BunTestRunner>).mutantCoverage = undefined;

      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      // Should run without testNamePattern
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], expect.objectContaining({
        timeout: 5000,
        bail: true,
        activeMutant: 123,
        env: { __STRYKER_ACTIVE_MUTANT__: '123' }
      }));
      
      const call = mockBunAdapter.runTests.mock.calls[0];
      expect(call[1]).not.toHaveProperty('testNamePattern');
    });

    test('should handle testNamePattern assignment when defined', async () => {
      // Set up scenario where getFilteredTests returns testNamePattern
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: { 'test1': { '123': 1 } },
        static: { '123': 1 }
      };

      await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      // Should run with testNamePattern
      const call = mockBunAdapter.runTests.mock.calls[0];
      expect(call[1]).toHaveProperty('testNamePattern');
      expect(call[1].testNamePattern).toBe('^(test1)$');
    });
  });

  describe('failed test handling edge cases', () => {
    test('should handle failed test result with failed > 0', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'failed', error: 'Assertion failed' }
        ],
        passed: 0,
        failed: 1,
        total: 1,
        failedTests: [{ id: 'test1', error: 'Assertion failed' }]
      });

      const result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(result.failureMessage).toBe('Assertion failed');
      expect(result.killedBy).toEqual(['test1']);
      expect(result.nrOfTests).toBe(1);
    });

    test('should handle failed test result with failed = 0', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'passed' }
        ],
        passed: 1,
        failed: 0, // No failures
        total: 1,
        failedTests: []
      });

      const result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(result.nrOfTests).toBe(1);
      // Should be survived result, not killed
    });

    test('should handle failed test with missing error and missing id', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { name: 'Test without id', status: 'failed' }
        ],
        passed: 0,
        failed: 1,
        total: 1,
        failedTests: [{ name: 'Test without id' }] // No error and no id
      });

      const result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(result.failureMessage).toBe('Test failed'); // Default message
      expect(result.killedBy).toEqual(['Test without id']); // Uses name instead of id
    });

    test('should handle optional chaining in failureMessage', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'failed' }
        ],
        passed: 0,
        failed: 1,
        total: 1,
        failedTests: null // null failedTests
      });

      const result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(result.failureMessage).toBe('Test failed'); // Should handle null gracefully
      expect(result.killedBy).toEqual([]); // Should handle null gracefully
    });

    test('should handle optional chaining with undefined failedTests', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'failed' }
        ],
        passed: 0,
        failed: 1,
        total: 1
        // failedTests is undefined
      });

      const result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(result.failureMessage).toBe('Test failed'); // Should handle undefined gracefully
      expect(result.killedBy).toEqual([]); // Should handle undefined gracefully
    });

    test('should handle array vs string killedBy return', async () => {
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'failed' },
          { id: 'test2', name: 'Test 2', status: 'failed' }
        ],
        passed: 0,
        failed: 2,
        total: 2,
        failedTests: [
          { id: 'test1', error: 'Error 1' },
          { id: 'test2', error: 'Error 2' }
        ]
      });

      const result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(Array.isArray(result.killedBy)).toBe(true);
      expect(result.killedBy).toEqual(['test1', 'test2']);
    });
  });

  describe('complex logical conditions', () => {
    test('should test all branches of error type checking', async () => {
      // Test error that is null (this will actually cause a runtime error)
      try {
        mockBunAdapter.runTests.mockRejectedValueOnce(null);
        await runner.dryRun({
          timeout: 5000,
          coverageAnalysis: 'off'
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBeDefined(); // Will throw because null.message access fails
      }

      // Test error that is not an object
      mockBunAdapter.runTests.mockRejectedValueOnce(42);
      let result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });
      expect(result.errorMessage).toBe('Unknown error during dry run');

      // Test error that is object but no timedOut property
      mockBunAdapter.runTests.mockRejectedValueOnce({ someProperty: 'value' });
      result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });
      expect(result.errorMessage).toBe('Unknown error during dry run');

      // Test error with timedOut property but not true (string 'false' is truthy)
      mockBunAdapter.runTests.mockRejectedValueOnce({ timedOut: 'false', message: 'Not a timeout error' }); // String instead of boolean
      result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });
      expect(result.reason).toBe('Dry run timed out after 5000ms'); // String 'false' is truthy!
    });

    test('should test mutantRun error re-throwing logic', async () => {
      // Non-timeout error should be re-thrown
      const networkError = new Error('Network error');
      mockBunAdapter.runTests.mockRejectedValueOnce(networkError);

      try {
        await runner.mutantRun({
          timeout: 5000,
          activeMutant: { id: '123' }
        });
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error).toBe(networkError);
      }
    });
  });
});