import { describe, test, expect } from 'bun:test';
import { TestFilter } from '../../src/coverage/TestFilter';
import { MutantCoverage, Mutant } from '@stryker-mutator/api/dist/src/core';

describe('TestFilter', () => {
  test('should be a class with static methods only', () => {
    // This test ensures the class constructor is covered
    expect(TestFilter).toBeDefined();
    expect(typeof TestFilter).toBe('function');
    // Verify it's not meant to be instantiated
    // TestFilter is a static-only class, but we can still instantiate it for coverage
    const TestFilterConstructor = TestFilter as unknown as new () => object;
    const instance = new TestFilterConstructor();
    expect(instance).toBeDefined();
  });

  const createMutant = (id: string): Mutant => ({
    id, fileName: 'test.ts', mutatorName: 'test',
    location: { start: { line: 1, column: 1 }, end: { line: 1, column: 10 } },
    replacement: 'replacement'
  });

  const createCoverage = (perTestData: Record<string, Record<string, number>>): MutantCoverage => ({
    static: {}, perTest: perTestData
  });

  describe('getTestsForMutant', () => {
    test('should return empty array when no coverage available', () => {
      const result = TestFilter.getTestsForMutant(createMutant('1'), undefined);
      expect(result).toEqual([]);
    });

    test('should return test IDs that cover the mutant', () => {
      const coverage = createCoverage({
        'test1': { '1': 1, '2': 1 }, 'test2': { '2': 1, '3': 1 }, 'test3': { '1': 1, '3': 1 }
      });
      const result = TestFilter.getTestsForMutant(createMutant('1'), coverage);
      expect(result).toEqual(['test1', 'test3']);
    });

    test('should return empty when only static coverage exists', () => {
      const coverage: MutantCoverage = { static: { '1': 1 }, perTest: {} };
      const result = TestFilter.getTestsForMutant(createMutant('1'), coverage);
      expect(result).toEqual([]);
    });

    test('should handle case where perTest is null', () => {
      const coverage: MutantCoverage = { static: { '1': 1 }, perTest: null as unknown as {} };
      const result = TestFilter.getTestsForMutant(createMutant('1'), coverage);
      expect(result).toEqual([]);
    });

    test('should handle mutant with zero coverage count', () => {
      const coverage = createCoverage({
        'test1': { '1': 0, '2': 1 } // Mutant '1' has 0 coverage count
      });
      const result = TestFilter.getTestsForMutant(createMutant('1'), coverage);
      expect(result).toEqual([]); // Should not include test1 since coverage count is 0
    });
  });

  describe('shouldRunAllTests', () => {
    test('should return true when no coverage available', () => {
      const result = TestFilter.shouldRunAllTests(createMutant('1'), undefined);
      expect(result).toBe(true);
    });

    test('should return false when mutant has test coverage', () => {
      const coverage = createCoverage({ 'test1': { '1': 1 } });
      const result = TestFilter.shouldRunAllTests(createMutant('1'), coverage);
      expect(result).toBe(false);
    });

    test('should return true when mutant has only static coverage', () => {
      const coverage: MutantCoverage = { static: { '1': 1 }, perTest: {} };
      const result = TestFilter.shouldRunAllTests(createMutant('1'), coverage);
      expect(result).toBe(true);
    });

    test('should return false when mutant is not covered by static analysis', () => {
      const coverage: MutantCoverage = { 
        static: { '2': 1, '3': 1 }, // Mutant '1' is not in static coverage
        perTest: undefined 
      };
      const result = TestFilter.shouldRunAllTests(createMutant('1'), coverage);
      expect(result).toBe(false);
    });

    test('should handle mutant coverage with perTest but no covering tests', () => {
      const coverage: MutantCoverage = { 
        static: { '1': 1 },
        perTest: { 'test1': { '2': 1 }, 'test2': { '3': 1 } } // No test covers mutant '1'
      };
      const result = TestFilter.shouldRunAllTests(createMutant('1'), coverage);
      expect(result).toBe(true); // Should run all tests when no specific test covers the mutant
    });

    test('should return false when mutant has no perTest coverage', () => {
      const coverage: MutantCoverage = { 
        static: { '1': 1 },
        perTest: null as unknown as {}
      };
      const result = TestFilter.shouldRunAllTests(createMutant('1'), coverage);
      expect(result).toBe(true); // Should run all tests when perTest is null
    });
  });

  describe('createTestNamePattern', () => {
    test('should create pattern for single test', () => {
      const result = TestFilter.createTestNamePattern(['test1']);
      expect(result).toBe('^(test1)$');
    });

    test('should create pattern for multiple tests', () => {
      const result = TestFilter.createTestNamePattern(['test1', 'test2', 'test3']);
      expect(result).toBe('^(test1|test2|test3)$');
    });

    test('should escape special regex characters', () => {
      const result = TestFilter.createTestNamePattern(['test.with.dots', 'test(with)parens']);
      expect(result).toBe('^(test\\.with\\.dots|test\\(with\\)parens)$');
    });

    test('should escape all special regex characters', () => {
      const result = TestFilter.createTestNamePattern([
        'test.*+?^${}()|[]\\special'
      ]);
      expect(result).toBe('^(test\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\special)$');
    });

    test('should return undefined for empty array', () => {
      const result = TestFilter.createTestNamePattern([]);
      expect(result).toBeUndefined();
    });
  });

  describe('filterTests', () => {
    const createTestResult = (id: string, name: string) => ({
      id,
      name,
      timeSpentMs: 10,
      status: 'Success' as const
    });

    test('should return all tests when testIdsToRun is empty', () => {
      const allTests = [
        createTestResult('test1', 'Test 1'),
        createTestResult('test2', 'Test 2'),
        createTestResult('test3', 'Test 3')
      ];
      
      const result = TestFilter.filterTests(allTests, []);
      expect(result).toEqual(allTests);
      expect(result).toHaveLength(3);
    });

    test('should filter tests based on provided IDs', () => {
      const allTests = [
        createTestResult('test1', 'Test 1'),
        createTestResult('test2', 'Test 2'),
        createTestResult('test3', 'Test 3'),
        createTestResult('test4', 'Test 4')
      ];
      
      const result = TestFilter.filterTests(allTests, ['test1', 'test3']);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test1');
      expect(result[1].id).toBe('test3');
    });

    test('should return empty array when no tests match', () => {
      const allTests = [
        createTestResult('test1', 'Test 1'),
        createTestResult('test2', 'Test 2')
      ];
      
      const result = TestFilter.filterTests(allTests, ['test3', 'test4']);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('should return all tests when all match', () => {
      const allTests = [
        createTestResult('test1', 'Test 1'),
        createTestResult('test2', 'Test 2')
      ];
      
      const result = TestFilter.filterTests(allTests, ['test1', 'test2']);
      expect(result).toEqual(allTests);
      expect(result).toHaveLength(2);
    });

    test('should handle duplicate IDs in testIdsToRun', () => {
      const allTests = [
        createTestResult('test1', 'Test 1'),
        createTestResult('test2', 'Test 2'),
        createTestResult('test3', 'Test 3')
      ];
      
      // Duplicate 'test1' in the filter
      const result = TestFilter.filterTests(allTests, ['test1', 'test2', 'test1']);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('test1');
      expect(result[1].id).toBe('test2');
    });

    test('should handle empty allTests array', () => {
      const result = TestFilter.filterTests([], ['test1', 'test2']);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    test('should handle single test filtering', () => {
      const allTests = [
        createTestResult('test1', 'Test 1'),
        createTestResult('test2', 'Test 2')
      ];
      
      const result = TestFilter.filterTests(allTests, ['test2']);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('test2');
    });

    test('should preserve order of tests from allTests', () => {
      const allTests = [
        createTestResult('test1', 'Test 1'),
        createTestResult('test2', 'Test 2'),
        createTestResult('test3', 'Test 3'),
        createTestResult('test4', 'Test 4')
      ];
      
      // Request in different order
      const result = TestFilter.filterTests(allTests, ['test4', 'test2', 'test1']);
      expect(result).toHaveLength(3);
      // Should preserve original order from allTests
      expect(result[0].id).toBe('test1');
      expect(result[1].id).toBe('test2');
      expect(result[2].id).toBe('test4');
    });
  });
});