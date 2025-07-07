import { Logger } from '@stryker-mutator/api/logging';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';

export interface PooledProcess {
  id: string;
  process: ChildProcess;
  busy: boolean;
  lastUsed: number;
}

interface WorkerMessage {
  type: 'run' | 'result' | 'error' | 'ready';
  id?: string;
  data?: unknown;
  error?: string;
}

/**
 * Manages the lifecycle of Bun worker processes
 * Handles process creation, communication, and termination
 */
export class WorkerManager extends EventEmitter {
  private readonly log: Logger;
  private readonly processes: Map<string, PooledProcess> = new Map();
  private nextWorkerId = 0;
  private readonly workerStartupTimeout: number;

  /**
   * Creates a new WorkerManager instance
   * @param logger - Logger instance for debug output
   * @param workerStartupTimeout - Timeout in ms for worker startup (default: 5000)
   */
  constructor(logger: Logger, workerStartupTimeout = 5000) {
    super();
    this.log = logger;
    this.workerStartupTimeout = workerStartupTimeout;
  }

  /**
   * Gets the current map of worker processes
   * @returns Map of worker ID to PooledProcess
   */
  public getProcesses(): Map<string, PooledProcess> {
    return this.processes;
  }

  /**
   * Creates a new Bun worker process
   * @returns Promise resolving to the created PooledProcess
   * @throws Error if maximum worker limit is reached or startup fails
   */
  public async createWorker(): Promise<PooledProcess> {
    // Safety check to prevent too many processes
    if (this.processes.size >= 8) {
      throw new Error('Maximum number of worker processes (8) reached');
    }

    const workerId = `worker-${this.nextWorkerId++}`;
    this.log.debug(`Creating new Bun worker: ${workerId}`);

    const workerPath = new URL('./BunWorker.js', import.meta.url).pathname;
    const workerProcess = spawn('bun', [workerPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, WORKER_ID: workerId },
      detached: false // Ensure process is killed when parent dies
    });

    const pooled: PooledProcess = {
      id: workerId,
      process: workerProcess,
      busy: true,
      lastUsed: Date.now()
    };

    this.processes.set(workerId, pooled);

    workerProcess.on('message', (message: WorkerMessage) => {
      this.handleWorkerMessage(workerId, message);
    });

    workerProcess.on('error', (error: Error) => {
      this.log.error(`Worker ${workerId} error:`, error);
      this.handleWorkerError(workerId, error);
    });

    workerProcess.on('exit', (code: number | null, signal: string | null) => {
      this.log.debug(`Worker ${workerId} exited with code ${code}, signal ${signal}`);
      this.processes.delete(workerId);
    });

    // Wait for worker to be ready
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Kill the process if it fails to start
        workerProcess.kill('SIGKILL');
        this.processes.delete(workerId);
        reject(new Error(`Worker ${workerId} failed to start`));
      }, this.workerStartupTimeout);

      this.once(`ready-${workerId}`, () => {
        clearTimeout(timeout);
        resolve(pooled);
      });
    });
  }

  /**
   * Terminates a worker process gracefully
   * @param pooled - The PooledProcess to terminate
   * @returns Promise that resolves when the process is terminated
   */
  public async terminateProcess(pooled: PooledProcess): Promise<void> {
    return new Promise(resolve => {
      const cleanup = (): void => {
        this.processes.delete(pooled.id);
        resolve();
      };

      pooled.process.once('exit', cleanup);

      // Try SIGTERM first
      pooled.process.kill('SIGTERM');

      // Force kill after shorter timeout in production
      setTimeout(() => {
        if (!pooled.process.killed) {
          pooled.process.removeListener('exit', cleanup);
          pooled.process.kill('SIGKILL');
          cleanup();
        }
      }, 1000); // Reduced from 5000ms to 1000ms
    });
  }

  private handleWorkerMessage(workerId: string, message: WorkerMessage): void {
    const pooled = this.processes.get(workerId);
    if (!pooled) return;

    switch (message.type) {
      case 'ready':
        this.emit(`ready-${workerId}`);
        break;

      case 'result':
        if (message.id) {
          pooled.busy = false;
          pooled.lastUsed = Date.now();
          this.emit(`result-${message.id}`, message.data);
        }
        break;

      case 'error':
        if (message.id) {
          pooled.busy = false;
          pooled.lastUsed = Date.now();
          this.emit(`error-${message.id}`, message.error);
        }
        break;
    }
  }

  private handleWorkerError(workerId: string, error: Error): void {
    // Remove the failed worker
    this.processes.delete(workerId);
    // Emit error event for handling by parent
    this.emit('worker-error', workerId, error);
  }
}
