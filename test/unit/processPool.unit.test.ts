import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { BunProcessPool } from '../../src/process/BunProcessPool.js';
import { Logger } from '@stryker-mutator/api/logging';

describe('BunProcessPool Unit Tests', () => {
  let processPool: BunProcessPool;
  let logger: Logger;
  
  beforeEach(() => {
    logger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {},
      trace: () => {},
      isDebugEnabled: () => false,
      isInfoEnabled: () => false,
      isWarnEnabled: () => false,
      isErrorEnabled: () => false,
      isFatalEnabled: () => false,
      isTraceEnabled: () => false
    };
  });
  
  afterEach(async () => {
    if (processPool) {
      await processPool.dispose();
    }
  });
  
  test('should create process pool with default options', () => {
    processPool = new BunProcessPool(logger);
    
    expect(processPool).toBeDefined();
  });
  
  test('should create process pool with custom options', () => {
    processPool = new BunProcessPool(logger, {
      maxWorkers: 2,
      timeout: 1000,
      idleTimeout: 5000
    });
    
    expect(processPool).toBeDefined();
  });
  
  test('should dispose process pool cleanly', async () => {
    processPool = new BunProcessPool(logger, {
      maxWorkers: 1
    });
    
    await processPool.dispose();
    
    // Should not throw
    expect(true).toBe(true);
  });
  
  test('should handle timeout correctly', async () => {
    processPool = new BunProcessPool(logger, {
      maxWorkers: 1,
      timeout: 50 // Very short timeout
    });
    
    // This will timeout because the worker won't start properly in test env
    const resultPromise = processPool.runTests(['test', '--version'], {});
    
    // Wait a bit for timeout
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const result = await resultPromise as unknown as { timedOut?: boolean };
    expect(result).toBeDefined();
    expect(result.timedOut).toBe(true);
  });
});