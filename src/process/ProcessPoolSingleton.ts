import { Logger } from '@stryker-mutator/api/logging';
import { BunProcessPool, ProcessPoolOptions } from './BunProcessPool.js';

/**
 * Singleton manager for the process pool to prevent multiple instances
 */
export class ProcessPoolSingleton {
  private static instance?: BunProcessPool;
  private static refCount = 0;

  /**
   * Gets or creates the singleton process pool instance
   * @param logger - Logger instance for debug output
   * @param options - Process pool configuration options
   * @returns The singleton BunProcessPool instance
   */
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

  /**
   * Releases a reference to the process pool and disposes if no references remain
   * @param logger - Logger instance for debug output
   * @returns Promise that resolves when release is complete
   */
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

  /**
   * Forces disposal of the process pool regardless of reference count
   * @returns Promise that resolves when disposal is complete
   */
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
