import { Logger } from '@stryker-mutator/api/logging';
import { BunProcessPool, ProcessPoolOptions } from './BunProcessPool.js';

/**
 * Singleton manager for the process pool to prevent multiple instances
 */
export class ProcessPoolSingleton {
  private static instance?: BunProcessPool;
  private static refCount = 0;
  
  public static getInstance(logger: Logger, options: ProcessPoolOptions): BunProcessPool {
    if (!ProcessPoolSingleton.instance) {
      logger.debug('Creating singleton process pool instance');
      ProcessPoolSingleton.instance = new BunProcessPool(logger, {
        ...options,
        maxWorkers: options.maxWorkers || 8 // Default to 8 workers, no hard limit
      });
    }
    ProcessPoolSingleton.refCount++;
    logger.debug(`Process pool reference count: ${ProcessPoolSingleton.refCount}`);
    return ProcessPoolSingleton.instance;
  }
  
  public static async release(logger: Logger): Promise<void> {
    ProcessPoolSingleton.refCount--;
    logger.debug(`Process pool reference count after release: ${ProcessPoolSingleton.refCount}`);
    
    if (ProcessPoolSingleton.refCount <= 0 && ProcessPoolSingleton.instance) {
      logger.debug('Disposing singleton process pool');
      await ProcessPoolSingleton.instance.dispose();
      ProcessPoolSingleton.instance = undefined;
      ProcessPoolSingleton.refCount = 0;
    }
  }
  
  public static async forceDispose(): Promise<void> {
    if (ProcessPoolSingleton.instance) {
      await ProcessPoolSingleton.instance.dispose();
      ProcessPoolSingleton.instance = undefined;
      ProcessPoolSingleton.refCount = 0;
    }
  }
  
  /**
   * Reset the singleton state - useful for testing and cleanup
   */
  public static reset(): void {
    ProcessPoolSingleton.instance = undefined;
    ProcessPoolSingleton.refCount = 0;
  }
}