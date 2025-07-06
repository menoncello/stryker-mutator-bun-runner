import { execa } from 'execa';

interface WorkerMessage {
  type: 'run' | 'result' | 'error' | 'ready';
  id?: string;
  data?: unknown;
  error?: string;
}

interface RunData {
  args: string[];
  env: Record<string, string>;
}

// Worker process that stays alive and executes tests on demand
class BunWorker {
  constructor() {
    this.setupMessageHandler();
    this.sendReady();
  }

  private setupMessageHandler(): void {
    process.on('message', async (message: WorkerMessage) => {
      if (message.type === 'run' && message.id) {
        await this.handleRun(message.id, message.data);
      }
    });
  }

  private async handleRun(requestId: string, data: unknown): Promise<void> {
    const runData = data as RunData;
    try {
      const result = await execa('bun', runData.args, {
        env: runData.env,
        reject: false,
        all: true
      });

      const response: WorkerMessage = {
        type: 'result',
        id: requestId,
        data: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
          failed: result.failed,
          timedOut: result.timedOut
        }
      };

      process.send!(response);
    } catch (error: unknown) {
      const errorResponse: WorkerMessage = {
        type: 'error',
        id: requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      process.send!(errorResponse);
    }
  }

  private sendReady(): void {
    const message: WorkerMessage = {
      type: 'ready'
    };
    process.send!(message);
  }
}

// Start the worker
new BunWorker();