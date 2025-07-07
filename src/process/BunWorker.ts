import {execa} from 'execa';

interface WorkerMessage {
    type: 'run' | 'result' | 'error' | 'ready' | 'watch-start' | 'watch-stop';
    id?: string;
    data?: unknown;
    error?: string;
}

interface RunData {
    args: string[];
    env: Record<string, string>;
    watchMode?: boolean;
}

// Worker process that stays alive and executes tests on demand
class BunWorker {
    private watchProcess?: ReturnType<typeof execa>;
    private currentRequestId?: string;
    private outputBuffer: string = '';

    constructor() {
        this.setupMessageHandler();
        this.sendReady();
    }

    private setupMessageHandler(): void {
        process.on('message', async (message: WorkerMessage) => {
            switch (message.type) {
                case 'run':
                    if (message.id) {
                        await this.handleRun(message.id, message.data);
                    }
                    break;
                case 'watch-stop':
                    this.stopWatchMode();
                    break;
            }
        });
    }

    private async handleRun(requestId: string, data: unknown): Promise<void> {
        const runData = data as RunData;

        if (runData.watchMode && !this.watchProcess) {
            await this.startWatchMode(requestId, runData);
        } else if (runData.watchMode && this.watchProcess) {
            // Watch mode already running, just update the request ID
            this.currentRequestId = requestId;
            // Trigger a test run by sending a newline to the watch process
            if (this.watchProcess.stdin) {
                this.watchProcess.stdin.write('\n');
            }
        } else {
            // Normal (non-watch) mode
            await this.runNormalMode(requestId, runData);
        }
    }

    private async runNormalMode(requestId: string, runData: RunData): Promise<void> {
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

            if (process.send) {
                process.send(response);
            }
        } catch (error: unknown) {
            const errorResponse: WorkerMessage = {
                type: 'error',
                id: requestId,
                error: error instanceof Error ? error.message : 'Unknown error'
            };

            if (process.send) {
                process.send(errorResponse);
            }
        }
    }

    private async startWatchMode(requestId: string, runData: RunData): Promise<void> {
        this.currentRequestId = requestId;

        // Add --watch flag to args
        const watchArgs = [...runData.args];
        if (!watchArgs.includes('--watch')) {
            const testIndex = watchArgs.indexOf('test');
            if (testIndex !== -1) {
                watchArgs.splice(testIndex + 1, 0, '--watch');
            }
        }

        this.watchProcess = execa('bun', watchArgs, {
            env: runData.env,
            buffer: false
        });

        // Handle stdout
        if (this.watchProcess.stdout) {
            this.watchProcess.stdout.on('data', (chunk: Buffer) => {
                this.handleWatchOutput(chunk.toString());
            });
        }

        // Handle stderr
        if (this.watchProcess.stderr) {
            this.watchProcess.stderr.on('data', (chunk: Buffer) => {
                this.handleWatchOutput(chunk.toString());
            });
        }

        // Handle process exit
        this.watchProcess.on('exit', () => {
            this.watchProcess = undefined;
            this.currentRequestId = undefined;
        });
    }

    private handleWatchOutput(data: string): void {
        this.outputBuffer += data;

        // Check if we have a complete test run output
        // Bun watch mode outputs test results followed by "Watching for changes..."
        if (data.includes('Watching for changes') || data.includes('test run finished')) {
            if (this.currentRequestId) {
                const response: WorkerMessage = {
                    type: 'result',
                    id: this.currentRequestId,
                    data: {
                        stdout: '',
                        stderr: this.outputBuffer,
                        exitCode: 0,
                        failed: false,
                        timedOut: false
                    }
                };

                if (process.send) {
                    process.send(response);
                }
                this.outputBuffer = ''; // Clear buffer for next run
            }
        }
    }

    public stopWatchMode(): void {
        if (this.watchProcess) {
            this.watchProcess.kill('SIGTERM');
            this.watchProcess = undefined;
            this.currentRequestId = undefined;
            this.outputBuffer = '';
        }
    }

    private sendReady(): void {
        if (process.send) {
            const message: WorkerMessage = {
                type: 'ready'
            };
            process.send(message);
        } else {
            // If not running as a child process with IPC, just log
            console.log('BunWorker ready');
        }
    }
}

// Start the worker
const worker = new BunWorker();

// Clean up on process exit
process.on('SIGTERM', () => {
    worker.stopWatchMode();
    process.exit(0);
});

process.on('SIGINT', () => {
    worker.stopWatchMode();
    process.exit(0);
});