import { Logger } from '@stryker-mutator/api/logging';
import { WorkerManager, PooledProcess } from './WorkerManager.js';

export interface ProcessPoolOptions {
  maxWorkers?: number;
  timeout?: number;
  idleTimeout?: number;
  watchMode?: boolean;
}

interface WorkerMessage {
  type: 'run' | 'result' | 'error' | 'ready';
  id?: string;
  data?: unknown;
  error?: string;
}

/**
 * Manages a pool of Bun worker processes for efficient test execution
 * Reuses processes across multiple test runs to improve performance
 */
export class BunProcessPool {
  private readonly log: Logger;
  private readonly options: Required<ProcessPoolOptions>;
  private readonly workerManager: WorkerManager;
  private readonly pendingRequests: Map<string, (result: unknown) => void> = new Map();
  private readonly pendingErrors: Map<string, (error: Error) => void> = new Map();
  private idleCheckInterval?: NodeJS.Timeout;

  /**
   * Creates a new BunProcessPool instance
   * @param logger - Logger instance for debug output
   * @param options - Pool configuration options
   */
  constructor(logger: Logger, options: ProcessPoolOptions = {}) {
    this.log = logger;
    this.options = {
      maxWorkers: options.maxWorkers || 4, // Default to 4 workers, no hard limit
      timeout: options.timeout || 60000,
      idleTimeout: options.idleTimeout || 30000,
      watchMode: options.watchMode || false
    };

    this.workerManager = new WorkerManager(logger);
    this.setupWorkerEvents();
    this.startIdleCheck();
  }

  /**
   * Runs tests using an available worker from the pool
   * @param args - Command line arguments for the test run
   * @param env - Environment variables for the test process
   * @returns Promise resolving to the test execution result
   */
  public async runTests(args: string[], env: Record<string, string>): Promise<unknown> {
    const worker = await this.getAvailableWorker();
    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      this.setupPendingRequest(requestId, resolve, reject);
      const effectiveTimeout = this.calculateEffectiveTimeout(args);
      const timeoutHandle = this.setupTimeout(requestId, worker, effectiveTimeout, resolve);

      this.sendWorkerMessage({ worker, requestId, args, env, timeoutHandle, reject });
      this.setupResponseHandlers(requestId, timeoutHandle, resolve, reject);
    });
  }

  /**
   * Disposes of all worker processes in the pool
   * @returns Promise that resolves when all workers are terminated
   */
  public async dispose(): Promise<void> {
    this.log.debug('Disposing process pool');

    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
    }

    const processes = this.workerManager.getProcesses();
    const disposePromises = Array.from(processes.values()).map(pooled => {
      return this.workerManager.terminateProcess(pooled);
    });

    await Promise.all(disposePromises);
    processes.clear();
  }

  private async getAvailableWorker(): Promise<PooledProcess> {
    const processes = this.workerManager.getProcesses();

    // Log current state for debugging
    this.log.debug(`Process pool state: ${processes.size} workers, looking for available`);

    // Find idle worker
    for (const pooled of processes.values()) {
      if (!pooled.busy) {
        pooled.busy = true;
        pooled.lastUsed = Date.now();
        this.log.debug(`Found idle worker: ${pooled.id}`);
        return pooled;
      }
    }

    // Create new worker if under limit
    /* istanbul ignore next - mutation here can cause infinite process creation */
    if (processes.size < this.options.maxWorkers) {
      try {
        const newWorker = await this.workerManager.createWorker();
        newWorker.busy = true;
        newWorker.lastUsed = Date.now();
        return newWorker;
      } catch (error) {
        this.log.error('Failed to create new worker:', error);
        throw error;
      }
    }

    // Wait for a worker to become available with timeout
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 300; // 30 seconds max wait

      const checkAvailable = (): void => {
        attempts++;

        if (attempts > maxAttempts) {
          reject(new Error('Timeout waiting for available worker'));
          return;
        }

        const currentProcesses = this.workerManager.getProcesses();
        for (const pooled of currentProcesses.values()) {
          if (!pooled.busy) {
            pooled.busy = true;
            pooled.lastUsed = Date.now();
            resolve(pooled);
            return;
          }
        }

        setTimeout(checkAvailable, 100);
      };
      checkAvailable();
    });
  }

  /**
   * Starts the idle check interval to clean up unused workers
   */
  private startIdleCheck(): void {
    this.idleCheckInterval = setInterval(() => {
      const now = Date.now();
      const processes = this.workerManager.getProcesses();

      for (const [workerId, pooled] of processes) {
        if (!pooled.busy && now - pooled.lastUsed > this.options.idleTimeout) {
          this.log.debug(`Terminating idle worker: ${workerId}`);
          void this.workerManager
            .terminateProcess(pooled)
            .then(() => {
              processes.delete(workerId);
              return undefined;
            })
            .catch((error: unknown) => {
              this.log.warn(`Failed to terminate idle worker ${workerId}:`, error);
            });
        }
      }
    }, 5000); // Check every 5 seconds instead of 10
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  private setupPendingRequest(
    requestId: string,
    resolve: (value: unknown) => void,
    reject: (reason: Error) => void
  ): void {
    this.pendingRequests.set(requestId, resolve);
    this.pendingErrors.set(requestId, reject);
  }

  private calculateEffectiveTimeout(args: string[]): number {
    const timeoutArgIndex = args.indexOf('--timeout');
    if (timeoutArgIndex !== -1 && timeoutArgIndex + 1 < args.length) {
      const timeoutArg = args[timeoutArgIndex + 1];
      if (timeoutArg) {
        const argTimeout = parseInt(timeoutArg, 10);
        if (!isNaN(argTimeout)) {
          return Math.max(argTimeout * 1.2, this.options.timeout);
        }
      }
    }
    return this.options.timeout;
  }

  private setupTimeout(
    requestId: string,
    worker: PooledProcess,
    timeout: number,
    resolve: (value: unknown) => void
  ): NodeJS.Timeout {
    return setTimeout(() => {
      this.pendingRequests.delete(requestId);
      this.pendingErrors.delete(requestId);
      worker.busy = false;
      resolve({ stdout: '', stderr: '', timedOut: true });
    }, timeout);
  }

  private sendWorkerMessage(options: {
    worker: PooledProcess;
    requestId: string;
    args: string[];
    env: Record<string, string>;
    timeoutHandle: NodeJS.Timeout;
    reject: (reason: Error) => void;
  }): void {
    const { worker, requestId, args, env, timeoutHandle, reject } = options;
    const message: WorkerMessage = {
      type: 'run',
      id: requestId,
      data: {
        args,
        env,
        watchMode: this.options.watchMode
      }
    };
    worker.process.send(message, error => {
      if (error) {
        clearTimeout(timeoutHandle);
        this.pendingRequests.delete(requestId);
        this.pendingErrors.delete(requestId);
        worker.busy = false;
        reject(error);
      }
    });
  }

  private setupResponseHandlers(
    requestId: string,
    timeoutHandle: NodeJS.Timeout,
    resolve: (value: unknown) => void,
    reject: (reason: Error) => void
  ): void {
    const cleanup = (): void => {
      clearTimeout(timeoutHandle);
      this.pendingRequests.delete(requestId);
      this.pendingErrors.delete(requestId);
    };

    this.workerManager.once(`result-${requestId}`, result => {
      cleanup();
      resolve(result);
    });

    this.workerManager.once(`error-${requestId}`, error => {
      cleanup();
      reject(new Error(error));
    });
  }

  private setupWorkerEvents(): void {
    this.workerManager.on('worker-error', (workerId: string, error: Error) => {
      this.log.error(`Worker ${workerId} error:`, error);
      // Reject all pending requests for this worker only
      const processes = this.workerManager.getProcesses();
      const failedWorker = processes.get(workerId);

      if (failedWorker) {
        // Mark worker as not busy to prevent hanging
        failedWorker.busy = false;
      }

      // Clear pending requests that might be stuck
      this.pendingRequests.clear();
      this.pendingErrors.clear();
    });
  }
}
