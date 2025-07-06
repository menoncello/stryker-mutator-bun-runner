import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test';
import { WorkerManager } from '../../src/process/WorkerManager';
import { Logger } from '@stryker-mutator/api/logging';
import { EventEmitter } from 'events';
import * as child_process from 'child_process';

// Create a mock ChildProcess class
class MockChildProcess extends EventEmitter {
  public killed = false;
  public send = mock((message: unknown, callback?: (error: Error | null) => void) => {
    if (callback) callback(null);
  });
  public kill = mock((signal?: string) => {
    this.killed = true;
    // Simulate process exit after kill
    setTimeout(() => this.emit('exit', 0, signal), 10);
    return true;
  });
}

describe('WorkerManager', () => {
  let mockLogger: Logger;
  let workerManager: WorkerManager;
  let mockSpawn: ReturnType<typeof mock>;
  let mockProcess: MockChildProcess;

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

    // Reset mocks
    mockProcess = new MockChildProcess();
    mockSpawn = spyOn(child_process, 'spawn').mockReturnValue(mockProcess as unknown as ChildProcess);
  });

  describe('constructor', () => {
    test('should create WorkerManager instance', () => {
      workerManager = new WorkerManager(mockLogger);
      expect(workerManager).toBeDefined();
      expect(workerManager).toBeInstanceOf(EventEmitter);
    });
  });

  describe('getProcesses', () => {
    test('should return empty map initially', () => {
      workerManager = new WorkerManager(mockLogger);
      const processes = workerManager.getProcesses();
      expect(processes).toBeInstanceOf(Map);
      expect(processes.size).toBe(0);
    });

    test('should return processes map after creating workers', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      // Emit ready message after a short delay
      setTimeout(() => mockProcess.emit('message', { type: 'ready' }), 10);

      await workerManager.createWorker();
      
      const processes = workerManager.getProcesses();
      expect(processes.size).toBe(1);
    });
  });

  describe('createWorker', () => {
    test('should create worker successfully', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      // Simulate worker ready message
      setTimeout(() => mockProcess.emit('message', { type: 'ready' }), 10);
      
      const worker = await workerManager.createWorker();
      
      expect(worker).toBeDefined();
      expect(worker.id).toBe('worker-0');
      expect(worker.busy).toBe(true);
      expect(worker.process).toBe(mockProcess);
      
      expect(mockSpawn).toHaveBeenCalledWith(
        'bun',
        [expect.stringContaining('BunWorker.js')],
        expect.objectContaining({
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          env: expect.objectContaining({ WORKER_ID: 'worker-0' })
        })
      );
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Creating new Bun worker: worker-0');
    });

    test('should handle worker ready timeout', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      // Mock setTimeout to execute immediately for testing
      const originalSetTimeout = global.setTimeout;
      let timeoutCallback: Function | null = null;
      global.setTimeout = mock((callback: Function, ms: number) => {
        if (ms === 100) {
          timeoutCallback = callback;
          return 123 as unknown as NodeJS.Timeout; // Return a fake timeout ID
        }
        return originalSetTimeout(callback, ms);
      }) as typeof setTimeout;
      
      try {
        // Start creating worker
        const createWorkerPromise = workerManager.createWorker();
        
        // Wait a bit to ensure the worker is set up
        await new Promise(resolve => originalSetTimeout(resolve, 10));
        
        // Trigger the timeout callback
        if (timeoutCallback) {
          timeoutCallback();
        }
        
        // Should reject with timeout error
        await expect(createWorkerPromise).rejects.toThrow('Worker worker-0 failed to start');
        
        // Verify the worker was added to processes
        expect(mockSpawn).toHaveBeenCalled();
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
      }
    });

    test('should handle worker spawn error', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      // Emit ready first to avoid timeout
      setTimeout(() => mockProcess.emit('message', { type: 'ready' }), 10);
      
      // Emit error after worker is created
      setTimeout(() => {
        mockProcess.emit('error', new Error('Spawn failed'));
      }, 20);
      
      const worker = await workerManager.createWorker();
      
      // Wait a bit for error event to be processed
      await new Promise(resolve => setTimeout(resolve, 30));
      
      expect(worker).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith('Worker worker-0 error:', expect.any(Error));
    });

    test('should handle worker exit', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      // Emit ready first
      setTimeout(() => mockProcess.emit('message', { type: 'ready' }), 10);
      
      await workerManager.createWorker();
      const processes = workerManager.getProcesses();
      expect(processes.size).toBe(1);
      
      // Simulate worker exit
      mockProcess.emit('exit', 1, 'SIGTERM');
      
      expect(mockLogger.debug).toHaveBeenCalledWith('Worker worker-0 exited with code 1, signal SIGTERM');
      expect(processes.size).toBe(0);
    });

    test('should increment worker ID for multiple workers', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      // Create first worker
      setTimeout(() => mockProcess.emit('message', { type: 'ready' }), 10);
      const worker1 = await workerManager.createWorker();
      expect(worker1.id).toBe('worker-0');
      
      // Create new mock for second worker
      const mockProcess2 = new MockChildProcess();
      mockSpawn.mockReturnValue(mockProcess2 as unknown as ChildProcess);
      
      // Create second worker
      setTimeout(() => mockProcess2.emit('message', { type: 'ready' }), 10);
      const worker2 = await workerManager.createWorker();
      expect(worker2.id).toBe('worker-1');
    });
  });

  describe('terminateProcess', () => {
    test('should terminate process gracefully', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      const pooledProcess = {
        id: 'test-worker',
        process: mockProcess,
        busy: false,
        lastUsed: Date.now()
      };
      
      const terminatePromise = workerManager.terminateProcess(pooledProcess);
      
      // Process should be killed with SIGTERM
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
      
      await terminatePromise;
      expect(mockProcess.killed).toBe(true);
    });

    test('should force kill after timeout', async () => {
      workerManager = new WorkerManager(mockLogger);
      
      // Mock process that doesn't exit on SIGTERM
      const stubbornProcess = new MockChildProcess();
      stubbornProcess.killed = false;
      
      // Override kill to not emit exit on SIGTERM
      stubbornProcess.kill = mock((signal?: string) => {
        if (signal === 'SIGTERM') {
          // Don't emit exit event, simulating a stuck process
          return true;
        } else if (signal === 'SIGKILL') {
          stubbornProcess.killed = true;
          // Emit exit after SIGKILL
          stubbornProcess.emit('exit', 9, 'SIGKILL');
          return true;
        }
        return false;
      });
      
      // Mock setTimeout to control timing
      const originalSetTimeout = global.setTimeout;
      let forceKillCallback: Function | null = null;
      global.setTimeout = mock((callback: Function, ms: number) => {
        if (ms === 5000) {
          forceKillCallback = callback;
          return 456 as unknown as NodeJS.Timeout; // Return a fake timeout ID
        }
        return originalSetTimeout(callback, ms);
      }) as typeof setTimeout;
      
      try {
        const pooledProcess = {
          id: 'test-worker',
          process: stubbornProcess,
          busy: false,
          lastUsed: Date.now()
        };
        
        // Start termination
        const terminatePromise = workerManager.terminateProcess(pooledProcess);
        
        // Wait a bit
        await new Promise(resolve => originalSetTimeout(resolve, 10));
        
        // Process should have been sent SIGTERM
        expect(stubbornProcess.kill).toHaveBeenCalledWith('SIGTERM');
        
        // Trigger the force kill timeout
        if (forceKillCallback) {
          forceKillCallback();
        }
        
        // Wait for termination to complete
        await terminatePromise;
        
        // Should have attempted SIGKILL
        expect(stubbornProcess.kill).toHaveBeenCalledWith('SIGKILL');
        expect(stubbornProcess.killed).toBe(true);
      } finally {
        // Restore original setTimeout
        global.setTimeout = originalSetTimeout;
      }
    });
  });

  describe('message handling', () => {
    test('should handle ready message', async () => {
      workerManager = new WorkerManager(mockLogger);
      interface WorkerManagerWithPrivates {
        processes: Map<string, PooledProcess>;
        handleWorkerMessage(workerId: string, message: unknown): void;
        handleWorkerError(workerId: string, error: Error): void;
      }
      const workerManagerWithPrivates = workerManager as unknown as WorkerManagerWithPrivates;
      
      // Set up a mock worker
      const pooled = {
        id: 'worker-0',
        process: mockProcess,
        busy: true,
        lastUsed: Date.now()
      };
      workerManagerWithPrivates.processes.set('worker-0', pooled);
      
      let readyEmitted = false;
      workerManager.once('ready-worker-0', () => {
        readyEmitted = true;
      });
      
      // Handle ready message
      workerManagerWithPrivates.handleWorkerMessage('worker-0', { type: 'ready' });
      
      expect(readyEmitted).toBe(true);
    });

    test('should handle result message', () => {
      workerManager = new WorkerManager(mockLogger);
      interface WorkerManagerWithPrivates {
        processes: Map<string, PooledProcess>;
        handleWorkerMessage(workerId: string, message: unknown): void;
        handleWorkerError(workerId: string, error: Error): void;
      }
      const workerManagerWithPrivates = workerManager as unknown as WorkerManagerWithPrivates;
      
      const pooled = {
        id: 'worker-0',
        process: mockProcess,
        busy: true,
        lastUsed: Date.now()
      };
      workerManagerWithPrivates.processes.set('worker-0', pooled);
      
      let resultData: unknown;
      workerManager.once('result-req-123', (data) => {
        resultData = data;
      });
      
      const testResult = { stdout: 'test output', stderr: '' };
      workerManagerWithPrivates.handleWorkerMessage('worker-0', {
        type: 'result',
        id: 'req-123',
        data: testResult
      });
      
      expect(resultData).toEqual(testResult);
      expect(pooled.busy).toBe(false);
      expect(pooled.lastUsed).toBeGreaterThan(0);
    });

    test('should handle error message', () => {
      workerManager = new WorkerManager(mockLogger);
      interface WorkerManagerWithPrivates {
        processes: Map<string, PooledProcess>;
        handleWorkerMessage(workerId: string, message: unknown): void;
        handleWorkerError(workerId: string, error: Error): void;
      }
      const workerManagerWithPrivates = workerManager as unknown as WorkerManagerWithPrivates;
      
      const pooled = {
        id: 'worker-0',
        process: mockProcess,
        busy: true,
        lastUsed: Date.now()
      };
      workerManagerWithPrivates.processes.set('worker-0', pooled);
      
      let errorMessage: string | undefined;
      workerManager.once('error-req-456', (error) => {
        errorMessage = error;
      });
      
      workerManagerWithPrivates.handleWorkerMessage('worker-0', {
        type: 'error',
        id: 'req-456',
        error: 'Test failed'
      });
      
      expect(errorMessage).toBe('Test failed');
      expect(pooled.busy).toBe(false);
    });

    test('should ignore messages from unknown workers', () => {
      workerManager = new WorkerManager(mockLogger);
      interface WorkerManagerWithPrivates {
        processes: Map<string, PooledProcess>;
        handleWorkerMessage(workerId: string, message: unknown): void;
        handleWorkerError(workerId: string, error: Error): void;
      }
      const workerManagerWithPrivates = workerManager as unknown as WorkerManagerWithPrivates;
      
      // No worker in processes map
      let eventEmitted = false;
      workerManager.once('result-req-789', () => {
        eventEmitted = true;
      });
      
      workerManagerWithPrivates.handleWorkerMessage('unknown-worker', {
        type: 'result',
        id: 'req-789',
        data: {}
      });
      
      expect(eventEmitted).toBe(false);
    });

    test('should ignore messages without id for result/error types', () => {
      workerManager = new WorkerManager(mockLogger);
      interface WorkerManagerWithPrivates {
        processes: Map<string, PooledProcess>;
        handleWorkerMessage(workerId: string, message: unknown): void;
        handleWorkerError(workerId: string, error: Error): void;
      }
      const workerManagerWithPrivates = workerManager as unknown as WorkerManagerWithPrivates;
      
      const pooled = {
        id: 'worker-0',
        process: mockProcess,
        busy: true,
        lastUsed: Date.now()
      };
      workerManagerWithPrivates.processes.set('worker-0', pooled);
      
      const initialBusy = pooled.busy;
      const initialLastUsed = pooled.lastUsed;
      
      // Result without id
      workerManagerWithPrivates.handleWorkerMessage('worker-0', {
        type: 'result',
        data: {}
      });
      
      expect(pooled.busy).toBe(initialBusy);
      expect(pooled.lastUsed).toBe(initialLastUsed);
      
      // Error without id
      workerManagerWithPrivates.handleWorkerMessage('worker-0', {
        type: 'error',
        error: 'Some error'
      });
      
      expect(pooled.busy).toBe(initialBusy);
      expect(pooled.lastUsed).toBe(initialLastUsed);
    });
  });

  describe('error handling', () => {
    test('should handle worker errors and emit event', () => {
      workerManager = new WorkerManager(mockLogger);
      interface WorkerManagerWithPrivates {
        processes: Map<string, PooledProcess>;
        handleWorkerMessage(workerId: string, message: unknown): void;
        handleWorkerError(workerId: string, error: Error): void;
      }
      const workerManagerWithPrivates = workerManager as unknown as WorkerManagerWithPrivates;
      
      // Add worker to processes
      workerManagerWithPrivates.processes.set('worker-0', {
        id: 'worker-0',
        process: mockProcess,
        busy: false,
        lastUsed: Date.now()
      });
      
      let emittedWorkerId: string | undefined;
      let emittedError: Error | undefined;
      workerManager.on('worker-error', (workerId, error) => {
        emittedWorkerId = workerId;
        emittedError = error;
      });
      
      const testError = new Error('Worker crashed');
      workerManagerWithPrivates.handleWorkerError('worker-0', testError);
      
      expect(emittedWorkerId).toBe('worker-0');
      expect(emittedError).toBe(testError);
      expect(workerManagerWithPrivates.processes.has('worker-0')).toBe(false);
    });

    test('should remove failed worker from processes', () => {
      workerManager = new WorkerManager(mockLogger);
      interface WorkerManagerWithPrivates {
        processes: Map<string, PooledProcess>;
        handleWorkerMessage(workerId: string, message: unknown): void;
        handleWorkerError(workerId: string, error: Error): void;
      }
      const workerManagerWithPrivates = workerManager as unknown as WorkerManagerWithPrivates;
      
      // Add multiple workers
      workerManagerWithPrivates.processes.set('worker-0', {
        id: 'worker-0',
        process: mockProcess,
        busy: false,
        lastUsed: Date.now()
      });
      workerManagerWithPrivates.processes.set('worker-1', {
        id: 'worker-1',
        process: new MockChildProcess(),
        busy: false,
        lastUsed: Date.now()
      });
      
      expect(workerManagerWithPrivates.processes.size).toBe(2);
      
      workerManagerWithPrivates.handleWorkerError('worker-0', new Error('Failed'));
      
      expect(workerManagerWithPrivates.processes.size).toBe(1);
      expect(workerManagerWithPrivates.processes.has('worker-0')).toBe(false);
      expect(workerManagerWithPrivates.processes.has('worker-1')).toBe(true);
    });
  });
});