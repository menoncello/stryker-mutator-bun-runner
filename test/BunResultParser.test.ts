import { describe, test, expect } from 'bun:test';
import { BunResultParser } from '../src/BunResultParser';
import { Logger } from '@stryker-mutator/api/logging';

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

describe('BunResultParser', () => {
  const parser = new BunResultParser(mockLogger);

  test('should parse successful test output', async () => {
    const output = `✓ should add numbers correctly (2ms)\n✓ should subtract numbers correctly (1ms)\n\n2 pass | 0 fail | 0 skip | 2 total (3ms)`;
    const result = await parser.parse(output);
    expect(result.total).toBe(2);
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.tests).toHaveLength(2);
  });

  test('should parse failed test output', async () => {
    const output = `✓ should work (1ms)\n✗ should fail\n\n1 pass | 1 fail | 0 skip | 2 total (10ms)`;
    const result = await parser.parse(output);
    expect(result.total).toBe(2);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.tests).toHaveLength(2);
    expect(result.tests[1].status).toBe('failed');
  });

  test('should parse skipped test output', async () => {
    const output = `✓ should pass (1ms)\n⏭ should skip this test\n\n1 pass | 0 fail | 1 skip | 2 total (1ms)`;
    const result = await parser.parse(output);
    expect(result.tests).toHaveLength(2);
    expect(result.tests[1]).toEqual({ name: 'should skip this test', status: 'skipped' });
  });

  test('should handle empty output', async () => {
    const result = await parser.parse('');
    expect(result.total).toBe(0);
    expect(result.passed).toBe(0);
    expect(result.failed).toBe(0);
    expect(result.tests).toHaveLength(0);
  });

  test('should parse test with no duration', async () => {
    const output = `✓ quick test\n✓ another test [5ms]\n\n2 pass | 0 fail | 0 skip | 2 total (5ms)`;
    const result = await parser.parse(output);
    expect(result.tests[0].duration).toBeUndefined();
    expect(result.tests[1].duration).toBe(5);
  });
});