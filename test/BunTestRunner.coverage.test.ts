import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunTestRunner } from '../src/BunTestRunner';
import { MockLogger, MockBunAdapter, TestableClass } from './types/mocks';

describe('BunTestRunner Coverage Integration Tests', () => {
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
          { id: 'test1', name: 'Test 1', status: 'passed', duration: 10 },
          { id: 'test2', name: 'Test 2', status: 'failed', error: 'Assertion failed', duration: 5 }
        ],
        passed: 1,
        failed: 1,
        total: 2
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

  describe('coverage states integration', () => {
    test('should handle mutant with no coverage data', async () => {
      // Set up empty coverage state
      (runner as TestableClass<BunTestRunner>).mutantCoverage = undefined;

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      await runner.mutantRun(options);

      // Should run tests normally without filtering
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], expect.objectContaining({
        timeout: 5000,
        bail: true,
        activeMutant: 123,
        env: { __STRYKER_ACTIVE_MUTANT__: '123' }
      }));
    });

    test('should handle mutant with empty perTest coverage', async () => {
      // Set up coverage with empty perTest
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {},
        static: { '123': 1 }
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      await runner.mutantRun(options);

      // Should run all tests since static coverage exists
      expect(mockBunAdapter.runTests).toHaveBeenCalled();
    });

    test('should handle mutant with specific test coverage', async () => {
      // Set up coverage with specific test covering the mutant
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {
          'test1': { '123': 1 },
          'test2': { '456': 1 }
        },
        static: { '123': 1, '456': 1 }
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      await runner.mutantRun(options);

      // Should run with test name pattern for test1 only
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], expect.objectContaining({
        testNamePattern: '^(test1)$'
      }));
    });

    test('should handle mutant with multiple test coverage', async () => {
      // Set up coverage with multiple tests covering the mutant
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {
          'test1': { '123': 1 },
          'test2': { '123': 1 },
          'test3': { '456': 1 }
        },
        static: { '123': 1, '456': 1 }
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      await runner.mutantRun(options);

      // Should run with test name pattern for both test1 and test2
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], expect.objectContaining({
        testNamePattern: '^(test1|test2)$'
      }));
    });

    test('should skip mutant not covered by any test when static coverage is empty', async () => {
      // Set up coverage where mutant is not covered
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {
          'test1': { '456': 1 }
        },
        static: { '456': 1 } // Mutant 123 not in static coverage
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      const result = await runner.mutantRun(options);

      // Should return survived with 0 tests
      expect(result.status).toBeDefined();
      expect(result.nrOfTests).toBe(0);
    });

    test('should handle test filter with existing coverage', async () => {
      // Set up coverage
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {
          'test1': { '123': 1 },
          'test2': { '123': 1 }
        },
        static: { '123': 1 }
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' },
        testFilter: ['test1', 'test3'] // test3 doesn't exist in coverage
      };

      await runner.mutantRun(options);

      // Should use provided test filter instead of coverage
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], expect.objectContaining({
        testNamePattern: '^(test1|test3)$'
      }));
    });

    test('should handle test names with special regex characters', async () => {
      // Set up coverage with test names containing special characters
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {
          'test.with.dots': { '123': 1 },
          'test-with-dashes': { '123': 1 },
          'test[with]brackets': { '123': 1 },
          'test(with)parentheses': { '123': 1 }
        },
        static: { '123': 1 }
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      await runner.mutantRun(options);

      // Should escape special regex characters
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], expect.objectContaining({
        testNamePattern: expect.stringContaining('test\\.with\\.dots')
      }));
    });

    test('should handle coverage analysis off vs perTest vs all', async () => {
      const coverageData = {
        coverage: {
          coverage: {
            perTest: { 'test1': { '123': 1 } },
            static: { '123': 1 }
          }
        }
      };

      // Test with coverage off
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1
      });

      let result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'off'
      });

      expect(result.mutantCoverage).toBeUndefined();
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], { timeout: 5000, coverage: false });

      // Test with coverage perTest
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: coverageData
      });

      result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      expect(result.mutantCoverage).toBeDefined();
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], { timeout: 5000, coverage: true });

      // Test with coverage all
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        coverage: coverageData
      });

      result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'all'
      });

      expect(result.mutantCoverage).toBeDefined();
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], { timeout: 5000, coverage: true });
    });

    test('should handle edge case with zero coverage count', async () => {
      // Set up coverage with zero count (should be treated as not covered)
      (runner as TestableClass<BunTestRunner>).mutantCoverage = {
        perTest: {
          'test1': { '123': 0 }, // Zero coverage
          'test2': { '123': 1 }  // Actual coverage
        },
        static: { '123': 1 }
      };

      const options = {
        timeout: 5000,
        activeMutant: { id: '123' }
      };

      await runner.mutantRun(options);

      // Should only include test2 (count > 0)
      expect(mockBunAdapter.runTests).toHaveBeenCalledWith([], expect.objectContaining({
        testNamePattern: '^(test2)$'
      }));
    });

    test('should handle mutant run with different result scenarios', async () => {
      // Test killed mutant
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'failed', error: 'Expected true but got false' }],
        passed: 0,
        failed: 1,
        total: 1,
        failedTests: [{ id: 'test1', error: 'Expected true but got false' }]
      });

      let result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(result.failureMessage).toBe('Expected true but got false');
      expect(result.killedBy).toEqual(['test1']);

      // Test survived mutant
      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [{ id: 'test1', name: 'Test 1', status: 'passed' }],
        passed: 1,
        failed: 0,
        total: 1,
        failedTests: []
      });

      result = await runner.mutantRun({
        timeout: 5000,
        activeMutant: { id: '123' }
      });

      expect(result.nrOfTests).toBe(1);
    });

    test('should handle complex coverage scenarios with logging', async () => {
      const coverageCollector = {
        toMutantCoverage: mock((data: unknown) => {
          const result = {
            perTest: data?.perTest || {},
            static: data?.static || {}
          };
          
          return result;
        })
      };

      mockBunAdapter.getCoverageCollector.mockReturnValue(coverageCollector);

      mockBunAdapter.runTests.mockResolvedValueOnce({
        tests: [
          { id: 'test1', name: 'Test 1', status: 'passed' },
          { id: 'test2', name: 'Test 2', status: 'passed' }
        ],
        passed: 2,
        failed: 0,
        total: 2,
        coverage: {
          coverage: {
            coverage: {
              perTest: {
                'test1': { '100': 1 },
                'test2': { '200': 1, '300': 1 }
              },
              static: { '100': 1, '200': 1, '300': 1 }
            }
          }
        }
      });

      const result = await runner.dryRun({
        timeout: 5000,
        coverageAnalysis: 'perTest'
      });

      expect(result.mutantCoverage).toBeDefined();
      expect(mockLogger.debug).toHaveBeenCalledWith('Processing coverage data');
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Collected coverage for'));
      expect(coverageCollector.toMutantCoverage).toHaveBeenCalled();
    });
  });
});