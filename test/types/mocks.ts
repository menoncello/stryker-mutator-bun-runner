import { Mock } from 'bun:test';
import { Logger } from '@stryker-mutator/api/logging';

export interface MockFunction extends Mock<(...args: unknown[]) => unknown> {}

export interface MockLogger extends Partial<Logger> {
  debug: MockFunction;
  info: MockFunction;
  warn: MockFunction;
  error: MockFunction;
  fatal: MockFunction;
  trace: MockFunction;
  isDebugEnabled?: MockFunction;
  isInfoEnabled?: MockFunction;
  isWarnEnabled?: MockFunction;
  isErrorEnabled?: MockFunction;
  isFatalEnabled?: MockFunction;
  isTraceEnabled?: MockFunction;
}

export interface MockBunAdapter {
  init: MockFunction;
  dispose: MockFunction;
  runTests: MockFunction;
  getCoverageCollector: MockFunction;
}

export interface MockCoverageCollector {
  init: MockFunction;
  startCoverage: MockFunction;
  stopCoverage: MockFunction;
  dispose: MockFunction;
  toMutantCoverage: MockFunction;
}

export interface MockBunResultParser {
  parse: MockFunction;
}

export interface MockExecaResult {
  stdout: string;
  stderr: string;
}

export interface MockError extends Error {
  timedOut?: boolean;
  code?: string;
}

// Type for accessing private methods in tests
export type TestableClass<T> = T & Record<string, unknown>;