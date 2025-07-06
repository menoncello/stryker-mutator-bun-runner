import { Logger } from '@stryker-mutator/api/logging';
import { ChildProcess, spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';

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

export class WorkerManager extends EventEmitter {
  private readonly log: Logger;
  private readonly processes: Map<string, PooledProcess> = new Map();
  private nextWorkerId = 0;

  constructor(logger: Logger) {
    super();
    this.log = logger;
  }

  public getProcesses(): Map<string, PooledProcess> {
    return this.processes;
  }

  public async createWorker(): Promise<PooledProcess> {
    const workerId = `worker-${this.nextWorkerId++}`;
    this.log.debug(`Creating new Bun worker: ${workerId}`);
    
    const workerPath = path.join(__dirname, 'BunWorker.js');
    const workerProcess = spawn('bun', [workerPath], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, WORKER_ID: workerId }
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
        reject(new Error(`Worker ${workerId} failed to start`));
      }, 5000);
      
      this.once(`ready-${workerId}`, () => {
        clearTimeout(timeout);
        resolve(pooled);
      });
    });
  }

  public async terminateProcess(pooled: PooledProcess): Promise<void> {
    return new Promise((resolve) => {
      pooled.process.once('exit', () => resolve());
      pooled.process.kill('SIGTERM');
      
      setTimeout(() => {
        if (!pooled.process.killed) {
          pooled.process.kill('SIGKILL');
        }
        resolve();
      }, 5000);
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