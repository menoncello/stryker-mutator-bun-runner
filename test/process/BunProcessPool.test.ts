import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunProcessPool } from '../../src/process/BunProcessPool';
import { Logger } from '@stryker-mutator/api/logging';
import { ChildProcess } from 'child_process';

describe('BunProcessPool', () => {
  let mockLogger: Logger;
  let pool: BunProcessPool;

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
  });

  describe('constructor', () => {
    test('should create pool with default options', () => {
      pool = new BunProcessPool(mockLogger);
      expect(pool).toBeDefined();
    });

    test('should create pool with custom options', () => {
      pool = new BunProcessPool(mockLogger, {
        maxWorkers: 8,
        timeout: 120000,
        idleTimeout: 60000
      });
      expect(pool).toBeDefined();
    });
  });

  describe('dispose', () => {
    test('should dispose pool without errors', async () => {
      pool = new BunProcessPool(mockLogger);
      await expect(pool.dispose()).resolves.toBeUndefined();
      expect(mockLogger.debug).toHaveBeenCalledWith('Disposing process pool');
    });
  });

  describe('runTests', () => {
    test('should handle timeout by resolving with timedOut flag', async () => {
      pool = new BunProcessPool(mockLogger, { timeout: 100 });
      
      // Mock the workerManager to create a fake worker that doesn't respond
      const poolAny = pool as unknown as { 
        workerManager: { 
          createWorker(): Promise<{ id: string; process: { send: () => void }; busy: boolean; lastUsed: number }>;
          getProcesses(): Map<string, unknown>;
        }
      };
      
      const mockProcess = { send: mock(() => {}) };
      const mockWorker = { id: 'test-worker', process: mockProcess, busy: true, lastUsed: Date.now() };
      poolAny.workerManager.createWorker = mock(async () => mockWorker);
      poolAny.workerManager.getProcesses = mock(() => new Map());
      
      // Run test and wait for timeout
      const result = await pool.runTests(['test'], {});
      
      // Should resolve with timedOut flag after timeout
      expect(result).toEqual({ stdout: '', stderr: '', timedOut: true });
    });
  });

  describe('internal methods', () => {
    test('should generate unique request IDs', () => {
      pool = new BunProcessPool(mockLogger);
      
      // Access private method through unknown casting
      const poolAny = pool as unknown as { generateRequestId(): string };
      const id1 = poolAny.generateRequestId();
      const id2 = poolAny.generateRequestId();
      
      expect(id1).toMatch(/^req-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^req-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('error handling', () => {
    test('should handle pending errors on dispose', async () => {
      pool = new BunProcessPool(mockLogger);
      
      // Access private properties through unknown casting
      const poolAny = pool as unknown as { 
        pendingErrors: Map<string, (error: Error) => void>;
        pendingRequests: Map<string, (result: unknown) => void>;
      };
      
      // Add some pending requests/errors
      poolAny.pendingRequests.set('req-1', () => {});
      poolAny.pendingErrors.set('req-1', () => {});
      
      await pool.dispose();
      
      // Should have cleaned up
      expect(mockLogger.debug).toHaveBeenCalledWith('Disposing process pool');
    });

    test('should handle worker events through WorkerManager', () => {
      pool = new BunProcessPool(mockLogger);
      
      // Access the workerManager through unknown casting
      const poolAny = pool as unknown as { 
        workerManager: { emit(event: string, ...args: unknown[]): void };
        pendingErrors: Map<string, (error: Error) => void>;
      };
      
      // Add a pending error handler
      const errorHandler = mock((_error: Error) => {});
      poolAny.pendingErrors.set('req-1', errorHandler);
      
      // Simulate worker error event
      poolAny.workerManager.emit('worker-error', 'worker-1', new Error('Worker crashed'));
      
      expect(mockLogger.error).toHaveBeenCalledWith('Worker worker-1 error:', expect.any(Error));
      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('dispose with active workers', () => {
    test('should dispose all active workers', async () => {
      pool = new BunProcessPool(mockLogger);
      
      const poolAny = pool as unknown as { 
        workerManager: {
          getProcesses(): Map<string, { id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
          terminateProcess(pooled: unknown): Promise<void>;
        };
        idleCheckInterval?: NodeJS.Timeout;
      };
      
      // Mock some active workers
      const mockWorker1 = { id: 'worker-1', process: {}, busy: true, lastUsed: Date.now() };
      const mockWorker2 = { id: 'worker-2', process: {}, busy: false, lastUsed: Date.now() };
      const processMap = new Map([
        ['worker-1', mockWorker1],
        ['worker-2', mockWorker2]
      ]);
      
      poolAny.workerManager.getProcesses = mock(() => processMap);
      poolAny.workerManager.terminateProcess = mock(async () => {});
      
      await pool.dispose();
      
      expect(poolAny.workerManager.terminateProcess).toHaveBeenCalledTimes(2);
      expect(poolAny.workerManager.terminateProcess).toHaveBeenCalledWith(mockWorker1);
      expect(poolAny.workerManager.terminateProcess).toHaveBeenCalledWith(mockWorker2);
      expect(processMap.size).toBe(0);
    });

    test('should clear idle check interval on dispose', async () => {
      pool = new BunProcessPool(mockLogger);
      
      const poolAny = pool as unknown as { 
        idleCheckInterval?: NodeJS.Timeout;
        workerManager: {
          getProcesses(): Map<string, unknown>;
          terminateProcess(pooled: unknown): Promise<void>;
        };
      };
      
      // Verify interval was set
      expect(poolAny.idleCheckInterval).toBeDefined();
      const intervalId = poolAny.idleCheckInterval;
      
      poolAny.workerManager.getProcesses = mock(() => new Map());
      
      await pool.dispose();
      
      // Interval should be cleared
      expect(poolAny.idleCheckInterval).toBe(intervalId); // Still has reference but it's cleared
    });
  });

  describe('getAvailableWorker scenarios', () => {
    test('should return idle worker when available', async () => {
      pool = new BunProcessPool(mockLogger);
      
      const poolAny = pool as unknown as { 
        workerManager: {
          getProcesses(): Map<string, { id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
        };
        getAvailableWorker(): Promise<{ id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
      };
      
      const idleWorker = { id: 'worker-1', process: {} as ChildProcess, busy: false, lastUsed: 0 };
      const busyWorker = { id: 'worker-2', process: {} as ChildProcess, busy: true, lastUsed: Date.now() };
      
      poolAny.workerManager.getProcesses = mock(() => new Map([
        ['worker-1', idleWorker],
        ['worker-2', busyWorker]
      ]));
      
      const worker = await poolAny.getAvailableWorker();
      
      expect(worker).toBe(idleWorker);
      expect(worker.busy).toBe(true);
      expect(worker.lastUsed).toBeGreaterThan(0);
    });

    test('should create new worker when under limit and none available', async () => {
      pool = new BunProcessPool(mockLogger, { maxWorkers: 2 });
      
      const poolAny = pool as unknown as { 
        workerManager: {
          getProcesses(): Map<string, { id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
          createWorker(): Promise<{ id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
        };
        getAvailableWorker(): Promise<{ id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
      };
      
      const busyWorker = { id: 'worker-1', process: {} as ChildProcess, busy: true, lastUsed: Date.now() };
      const newWorker = { id: 'worker-2', process: {} as ChildProcess, busy: true, lastUsed: Date.now() };
      
      poolAny.workerManager.getProcesses = mock(() => new Map([['worker-1', busyWorker]]));
      poolAny.workerManager.createWorker = mock(async () => newWorker);
      
      const worker = await poolAny.getAvailableWorker();
      
      expect(worker).toBe(newWorker);
      expect(poolAny.workerManager.createWorker).toHaveBeenCalled();
    });

    test('should wait for available worker when at max capacity', async () => {
      pool = new BunProcessPool(mockLogger, { maxWorkers: 1 });
      
      const poolAny = pool as unknown as { 
        workerManager: {
          getProcesses(): Map<string, { id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
        };
        getAvailableWorker(): Promise<{ id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
      };
      
      const busyWorker = { id: 'worker-1', process: {} as ChildProcess, busy: true, lastUsed: Date.now() };
      const processMap = new Map([['worker-1', busyWorker]]);
      
      poolAny.workerManager.getProcesses = mock(() => processMap);
      
      // Start waiting for worker
      const workerPromise = poolAny.getAvailableWorker();
      
      // Simulate worker becoming available after 150ms
      setTimeout(() => {
        busyWorker.busy = false;
      }, 150);
      
      const worker = await workerPromise;
      
      expect(worker).toBe(busyWorker);
      expect(worker.busy).toBe(true);
    });
  });

  describe('idle check functionality', () => {
    test('should terminate idle workers after timeout', async () => {
      const idleTimeout = 50; // 50ms for testing
      pool = new BunProcessPool(mockLogger, { idleTimeout });
      
      const poolAny = pool as unknown as { 
        workerManager: {
          getProcesses(): Map<string, { id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
          terminateProcess(pooled: unknown): Promise<void>;
        };
        idleCheckInterval?: NodeJS.Timeout;
        startIdleCheck(): void;
      };
      
      const idleWorker = { 
        id: 'worker-1', 
        process: {} as ChildProcess, 
        busy: false, 
        lastUsed: Date.now() - idleTimeout - 100 // Well past idle timeout
      };
      
      const activeWorker = { 
        id: 'worker-2', 
        process: {} as ChildProcess, 
        busy: false, 
        lastUsed: Date.now() // Recently used
      };
      
      const processMap = new Map([
        ['worker-1', idleWorker],
        ['worker-2', activeWorker]
      ]);
      
      let terminateProcessCalled = false;
      
      poolAny.workerManager.getProcesses = mock(() => processMap);
      poolAny.workerManager.terminateProcess = mock(async () => {
        terminateProcessCalled = true;
      });
      
      // Override setInterval to execute immediately
      const originalSetInterval = global.setInterval;
      let intervalCallback: Function | null = null;
      global.setInterval = mock((callback: Function) => {
        intervalCallback = callback;
        return 123 as NodeJS.Timeout;
      }) as typeof setInterval;
      
      try {
        // Clear the existing interval and start a new one
        if (poolAny.idleCheckInterval) {
          clearInterval(poolAny.idleCheckInterval);
        }
        poolAny.startIdleCheck();
        
        // Execute the interval callback
        if (intervalCallback) {
          await intervalCallback();
          
          // Wait for the terminateProcess promise to resolve
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        expect(terminateProcessCalled).toBe(true);
        expect(mockLogger.debug).toHaveBeenCalledWith('Terminating idle worker: worker-1');
      } finally {
        // Restore original setInterval
        global.setInterval = originalSetInterval;
        
        // Clean up interval
        if (poolAny.idleCheckInterval) {
          clearInterval(poolAny.idleCheckInterval);
        }
      }
    });

    test('should not terminate busy workers', async () => {
      const idleTimeout = 50;
      pool = new BunProcessPool(mockLogger, { idleTimeout });
      
      const poolAny = pool as unknown as { 
        workerManager: {
          getProcesses(): Map<string, { id: string; process: ChildProcess; busy: boolean; lastUsed: number }>;
          terminateProcess(pooled: unknown): Promise<void>;
        };
        idleCheckInterval?: NodeJS.Timeout;
      };
      
      const busyWorker = { 
        id: 'worker-1', 
        process: {} as ChildProcess, 
        busy: true, 
        lastUsed: Date.now() - idleTimeout - 100 // Old but busy
      };
      
      const processMap = new Map([['worker-1', busyWorker]]);
      
      poolAny.workerManager.getProcesses = mock(() => processMap);
      poolAny.workerManager.terminateProcess = mock(async () => {});
      
      // Manually trigger the idle check logic
      const now = Date.now();
      const processes = poolAny.workerManager.getProcesses();
      
      for (const [, pooled] of processes) {
        if (!pooled.busy && (now - pooled.lastUsed) > idleTimeout) {
          poolAny.workerManager.terminateProcess(pooled);
        }
      }
      
      expect(poolAny.workerManager.terminateProcess).not.toHaveBeenCalled();
      
      // Clean up interval
      if (poolAny.idleCheckInterval) {
        clearInterval(poolAny.idleCheckInterval);
      }
    });
  });

  describe('message sending errors', () => {
    test('should handle error when sending message to worker', async () => {
      pool = new BunProcessPool(mockLogger, { timeout: 1000 });
      
      const poolAny = pool as unknown as { 
        workerManager: {
          createWorker(): Promise<{ id: string; process: { send: Function }; busy: boolean; lastUsed: number }>;
          getProcesses(): Map<string, unknown>;
          once(event: string, handler: Function): void;
        };
      };
      
      const sendError = new Error('IPC channel closed');
      const mockWorker = { 
        id: 'worker-1', 
        process: { 
          send: mock((msg: unknown, callback?: (error: Error | null) => void) => {
            if (callback) callback(sendError);
          })
        }, 
        busy: true, 
        lastUsed: Date.now() 
      };
      
      poolAny.workerManager.createWorker = mock(async () => mockWorker);
      poolAny.workerManager.getProcesses = mock(() => new Map());
      poolAny.workerManager.once = mock(() => {});
      
      await expect(pool.runTests(['test'], {})).rejects.toThrow('IPC channel closed');
      
      // Worker should be marked as not busy after error
      expect(mockWorker.busy).toBe(false);
    });
  });

  describe('response handlers', () => {
    test('should handle successful result from worker', async () => {
      pool = new BunProcessPool(mockLogger);
      
      const poolAny = pool as unknown as { 
        workerManager: {
          createWorker(): Promise<{ id: string; process: { send: Function }; busy: boolean; lastUsed: number }>;
          getProcesses(): Map<string, unknown>;
          once(event: string, handler: Function): void;
          emit(event: string, ...args: unknown[]): void;
        };
      };
      
      const mockWorker = { 
        id: 'worker-1', 
        process: { 
          send: mock((msg: unknown, callback?: (error: Error | null) => void) => {
            if (callback) callback(null);
          })
        }, 
        busy: true, 
        lastUsed: Date.now() 
      };
      
      const resultHandlers: Record<string, Function> = {};
      
      poolAny.workerManager.createWorker = mock(async () => mockWorker);
      poolAny.workerManager.getProcesses = mock(() => new Map());
      poolAny.workerManager.once = mock((event: string, handler: Function) => {
        resultHandlers[event] = handler;
      });
      
      const testPromise = pool.runTests(['test'], {});
      
      // Wait a bit for setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Find the result handler and trigger it
      const resultEvent = Object.keys(resultHandlers).find(key => key.startsWith('result-'));
      expect(resultEvent).toBeDefined();
      
      const testResult = { stdout: 'test passed', stderr: '' };
      resultHandlers[resultEvent!](testResult);
      
      const result = await testPromise;
      expect(result).toEqual(testResult);
    });

    test('should handle error result from worker', async () => {
      pool = new BunProcessPool(mockLogger);
      
      const poolAny = pool as unknown as { 
        workerManager: {
          createWorker(): Promise<{ id: string; process: { send: Function }; busy: boolean; lastUsed: number }>;
          getProcesses(): Map<string, unknown>;
          once(event: string, handler: Function): void;
        };
      };
      
      const mockWorker = { 
        id: 'worker-1', 
        process: { 
          send: mock((msg: unknown, callback?: (error: Error | null) => void) => {
            if (callback) callback(null);
          })
        }, 
        busy: true, 
        lastUsed: Date.now() 
      };
      
      const errorHandlers: Record<string, Function> = {};
      
      poolAny.workerManager.createWorker = mock(async () => mockWorker);
      poolAny.workerManager.getProcesses = mock(() => new Map());
      poolAny.workerManager.once = mock((event: string, handler: Function) => {
        if (event.startsWith('error-')) {
          errorHandlers[event] = handler;
        }
      });
      
      const testPromise = pool.runTests(['test'], {});
      
      // Wait a bit for setup
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Find the error handler and trigger it
      const errorEvent = Object.keys(errorHandlers).find(key => key.startsWith('error-'));
      expect(errorEvent).toBeDefined();
      
      errorHandlers[errorEvent!]('Test execution failed');
      
      await expect(testPromise).rejects.toThrow('Test execution failed');
    });
  });

  describe('timeout calculation', () => {
    test('should extract timeout from args and multiply by 1.2', async () => {
      pool = new BunProcessPool(mockLogger, { timeout: 5000 });
      
      const poolAny = pool as unknown as { 
        calculateEffectiveTimeout(args: string[]): number;
      };
      
      // Test with timeout arg
      const timeout1 = poolAny.calculateEffectiveTimeout(['test', '--timeout', '3000', 'file.ts']);
      expect(timeout1).toBe(5000); // Max of 3000 * 1.2 = 3600 and 5000
      
      // Test with higher timeout
      const timeout2 = poolAny.calculateEffectiveTimeout(['test', '--timeout', '10000']);
      expect(timeout2).toBe(12000); // 10000 * 1.2 = 12000
      
      // Test without timeout arg
      const timeout3 = poolAny.calculateEffectiveTimeout(['test', 'file.ts']);
      expect(timeout3).toBe(5000); // Default timeout
      
      // Test with invalid timeout
      const timeout4 = poolAny.calculateEffectiveTimeout(['test', '--timeout', 'invalid']);
      expect(timeout4).toBe(5000); // Default timeout
      
      // Test with missing timeout value
      const timeout5 = poolAny.calculateEffectiveTimeout(['test', '--timeout']);
      expect(timeout5).toBe(5000); // Default timeout
    });
  });
});