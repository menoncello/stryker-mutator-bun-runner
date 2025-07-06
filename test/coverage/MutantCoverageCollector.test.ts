import { describe, test, expect, beforeEach } from 'bun:test';
import { MutantCoverageCollector } from '../../src/coverage/MutantCoverageCollector';
import { Logger } from '@stryker-mutator/api/dist/src/logging';

// Mock logger
const mockLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
  fatal: () => {},
  trace: () => {},
  isDebugEnabled: () => false,
  isInfoEnabled: () => true,
  isWarnEnabled: () => true,
  isErrorEnabled: () => true,
  isFatalEnabled: () => true,
  isTraceEnabled: () => false
};

// Helper functions
function getStrykerGlobal() {
  return (globalThis as Record<string, unknown>).__stryker__;
}

function createTestCoverage() {
  const strykerGlobal = getStrykerGlobal();
  if (strykerGlobal?.mutantCoverage) {
    // Use Stryker's format: Record<string, Record<string, number>>
    strykerGlobal.mutantCoverage.perTest = {
      'test1': { 'mutant1': 1, 'mutant2': 1 },
      'test2': { 'mutant2': 1, 'mutant3': 1 }
    };
  }
}

describe('MutantCoverageCollector', () => {
  let collector: MutantCoverageCollector;

  beforeEach(() => {
    collector = new MutantCoverageCollector(mockLogger);
    const global = globalThis as Record<string, unknown>;
    if (global.__stryker__) { delete global.__stryker__; }
  });

  test('should initialize collector', async () => {
    await collector.init();
  });

  test('should start coverage collection', () => {
    collector.startCoverage();
    const strykerGlobal = getStrykerGlobal();
    expect(strykerGlobal).toBeDefined();
    expect(strykerGlobal.mutantCoverage).toBeDefined();
    const coverage = strykerGlobal.mutantCoverage as { perTest: Record<string, unknown> };
    expect(coverage.perTest).toEqual({});
  });

  test('should stop coverage collection and return results', () => {
    collector.startCoverage();
    createTestCoverage();
    const result = collector.stopCoverage();
    expect(result.coverage.perTest['test1']).toEqual(new Set(['mutant1', 'mutant2']));
    expect(result.coverage.perTest['test2']).toEqual(new Set(['mutant2', 'mutant3']));
    expect(result.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  test('should convert coverage to MutantCoverage format', () => {
    const bunCoverage = {
      perTest: { 'test1': new Set(['1', '2']), 'test2': new Set(['2', '3']) },
      executedLines: {}
    };
    const mutantCoverage = collector.toMutantCoverage(bunCoverage);
    expect(mutantCoverage.perTest).toEqual({ 'test1': { '1': 1, '2': 1 }, 'test2': { '2': 1, '3': 1 } });
    expect(mutantCoverage.static).toEqual({ '1': 1, '2': 1, '3': 1 });
  });

  test('should track mutant execution', () => {
    collector.startCoverage();
    const strykerGlobal = getStrykerGlobal();
    strykerGlobal.currentTestId = 'test1';
    MutantCoverageCollector.trackMutant('mutant1');
    MutantCoverageCollector.trackMutant('mutant2');
    const coverage = strykerGlobal.mutantCoverage as { perTest: Record<string, Set<string>> };
    expect(coverage.perTest['test1']).toEqual(new Set(['mutant1', 'mutant2']));
  });

  test('should dispose collector', async () => {
    await collector.dispose();
  });
});