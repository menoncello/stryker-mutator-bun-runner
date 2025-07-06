import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { ProcessPoolSingleton } from '../../src/process/ProcessPoolSingleton.js';
import { BunProcessPool } from '../../src/process/BunProcessPool.js';
import { Logger } from '@stryker-mutator/api/logging';

describe('ProcessPoolSingleton', () => {
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      fatal: mock(() => {}),
      trace: mock(() => {}),
      isDebugEnabled: () => true,
      isInfoEnabled: () => true,
      isWarnEnabled: () => true,
      isErrorEnabled: () => true,
      isFatalEnabled: () => true,
      isTraceEnabled: () => true
    };
    
    // Reset singleton state before each test
    ProcessPoolSingleton.reset();
  });

  afterEach(async () => {
    // Clean up any remaining instance
    await ProcessPoolSingleton.forceDispose();
  });

  test('should create a singleton instance on first call', () => {
    const pool1 = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    
    expect(pool1).toBeInstanceOf(BunProcessPool);
    expect(mockLogger.debug).toHaveBeenCalledWith('Creating singleton process pool instance');
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 1');
  });

  test('should return the same instance on subsequent calls', () => {
    const pool1 = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    const pool2 = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 8 });
    
    expect(pool1).toBe(pool2);
    expect(mockLogger.debug).toHaveBeenCalledWith('Creating singleton process pool instance');
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 1');
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 2');
  });

  test('should increment reference count on each getInstance call', () => {
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 1');
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 2');
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 3');
  });

  test('should decrement reference count on release', async () => {
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    
    await ProcessPoolSingleton.release(mockLogger);
    
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count after release: 1');
  });

  test('should dispose the instance when reference count reaches 0', async () => {
    const pool = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    const disposeSpy = mock(pool.dispose.bind(pool));
    pool.dispose = disposeSpy;
    
    await ProcessPoolSingleton.release(mockLogger);
    
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count after release: 0');
    expect(mockLogger.debug).toHaveBeenCalledWith('Disposing singleton process pool');
    expect(disposeSpy).toHaveBeenCalled();
  });

  test('should not dispose the instance when reference count is still positive', async () => {
    const pool = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    const disposeSpy = mock(pool.dispose.bind(pool));
    pool.dispose = disposeSpy;
    
    await ProcessPoolSingleton.release(mockLogger);
    
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count after release: 1');
    expect(disposeSpy).not.toHaveBeenCalled();
  });

  test('should force dispose the instance regardless of reference count', async () => {
    const pool = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    
    const disposeSpy = mock(pool.dispose.bind(pool));
    pool.dispose = disposeSpy;
    
    await ProcessPoolSingleton.forceDispose();
    
    expect(disposeSpy).toHaveBeenCalled();
    
    // Should create a new instance after force dispose
    const newPool = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    expect(newPool).not.toBe(pool);
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 1');
  });

  test('should handle forceDispose when no instance exists', async () => {
    // Should not throw
    await expect(ProcessPoolSingleton.forceDispose()).resolves.toBeUndefined();
  });

  test('should reset singleton state', () => {
    const pool1 = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    
    ProcessPoolSingleton.reset();
    
    const pool2 = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    expect(pool2).not.toBe(pool1);
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 1');
  });

  test('should use default maxWorkers of 8 when not specified', () => {
    const pool = ProcessPoolSingleton.getInstance(mockLogger, {});
    
    // Access the private instance to check the options
    const privateInstance = (ProcessPoolSingleton as unknown as { instance: BunProcessPool }).instance;
    const options = (privateInstance as unknown as { options: { maxWorkers: number } }).options;
    
    expect(options.maxWorkers).toBe(8);
  });

  test('should respect provided maxWorkers option', () => {
    const pool = ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 12 });
    
    // Access the private instance to check the options
    const privateInstance = (ProcessPoolSingleton as unknown as { instance: BunProcessPool }).instance;
    const options = (privateInstance as unknown as { options: { maxWorkers: number } }).options;
    
    expect(options.maxWorkers).toBe(12);
  });

  test('should handle concurrent getInstance calls correctly', () => {
    const promises = Array.from({ length: 5 }, (_, i) => 
      Promise.resolve(ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 }))
    );
    
    return Promise.all(promises).then(pools => {
      // All should be the same instance
      const firstPool = pools[0];
      pools.forEach(pool => {
        expect(pool).toBe(firstPool);
      });
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count: 5');
    });
  });

  test('should handle release after reset correctly', async () => {
    ProcessPoolSingleton.getInstance(mockLogger, { maxWorkers: 4 });
    ProcessPoolSingleton.reset();
    
    // Release should not throw even though instance was reset
    await expect(ProcessPoolSingleton.release(mockLogger)).resolves.toBeUndefined();
    expect(mockLogger.debug).toHaveBeenCalledWith('Process pool reference count after release: -1');
  });
});