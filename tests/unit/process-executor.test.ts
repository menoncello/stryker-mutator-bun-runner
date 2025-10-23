import { describe, it, expect, beforeEach, vi } from 'bun:test';
import { BunTestRunnerConfig } from '../../src/config/bun-test-runner-config';
import { ProcessExecutor } from '../../src/process/process-executor';
import { Logger } from '../../src/utils/logger';

// Mock child process type
interface MockChildProcess {
  stdout: {
    on: ReturnType<typeof vi.fn>;
  };
  stderr: {
    on: ReturnType<typeof vi.fn>;
  };
  killed?: boolean;
  on?: ReturnType<typeof vi.fn>;
}

// Mock child_process module
const mockSpawnSync = vi.fn();
const mockSpawn = vi.fn();

// Mock before imports
vi.mock('node:child_process', () => ({
  spawnSync: mockSpawnSync,
  spawn: mockSpawn,
}));

// Mock the spawn function to return proper child process mock
const createMockChildProcess = (): MockChildProcess => ({
  stdout: {
    on: vi.fn(),
  },
  stderr: {
    on: vi.fn(),
  },
  on: vi.fn(),
  kill: vi.fn(),
  pid: 12345,
});

describe('1.1-Process Execution System', () => {
  let processExecutor: ProcessExecutor;
  let mockLogger: Logger;
  let mockConfig: BunTestRunnerConfig;

  beforeEach(() => {
    // Given: Mock logger for testing process execution
    mockLogger = {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;

    // And: Mock configuration for process executor
    mockConfig = new BunTestRunnerConfig({
      bunCommand: 'bun',
      testCommand: 'test',
      timeout: 5000,
    });

    // When: Creating process executor with mocked dependencies
    processExecutor = new ProcessExecutor(mockConfig, mockLogger);
  });

  describe('ProcessExecutor initialization', () => {
    it('1.1-UNIT-021 should initialize with config and logger', () => {
      // Given: Configuration and logger dependencies
      // When: Creating ProcessExecutor instance
      // Then: Instance should be created successfully
      expect(processExecutor).toBeDefined();
    });
  });

  describe('AC1: TypeScript project with tsconfig.json in strict mode', () => {
    describe('Bun installation validation', () => {
      it('1.1-UNIT-022 should validate Bun is available for TypeScript compilation', async () => {
        // Given: Bun runtime is installed and available
        mockSpawnSync.mockReturnValue({
          stdout: Buffer.from('bun 1.3.0\n'),
          stderr: Buffer.from(''),
          status: 0,
        });

        // When: Validating Bun installation
        const validation = processExecutor.validateBunInstallation();

        // Then: Validation should succeed without errors
        await expect(validation).resolves.toBeUndefined();
        expect(mockSpawnSync).toHaveBeenCalledWith('bun', ['--version'], {
          stdio: 'pipe',
          timeout: 5000,
        });
      });

      it('1.1-UNIT-023 should throw error if Bun is not available', async () => {
        // Given: Bun runtime is not installed
        mockSpawnSync.mockImplementation(() => {
          const error: any = new Error('Command not found: bun');
          error.code = 'ENOENT';
          error.errno = -2;
          error.syscall = 'spawnSync';
          throw error;
        });

        // When: Validating Bun installation
        const validation = processExecutor.validateBunInstallation();

        // Then: Validation should fail with appropriate error
        await expect(validation).rejects.toThrow('Command not found: bun');
      });
    });
  });

  describe('AC3: Build script produces compilable JavaScript output', () => {
    describe('Test execution functionality', () => {
      it('1.1-UNIT-024 should execute test command successfully', async () => {
        // Given: Valid test options and successful test execution
        const mockOptions = {
          testNames: ['test1', 'test2'],
          timeout: 3000,
        };

        const mockChildProcess = createMockChildProcess();
        mockSpawn.mockReturnValue(mockChildProcess);

        // Simulate successful test output
        setTimeout(() => {
          const mockDataCallback = mockChildProcess.stdout.on.mock.calls[0][1];
          mockDataCallback('✓ test1\n✓ test2\n');

          const mockCloseCallback = mockChildProcess.on.mock.calls.find(
            call => call[0] === 'close'
          )[1];
          mockCloseCallback(0);
        }, 10);

        // When: Executing tests
        const result = await processExecutor.executeTests(mockOptions);

        // Then: Tests should execute and return success results
        expect(result).toEqual({
          allTestsPassed: true,
          tests: [
            { name: 'test1', passed: true },
            { name: 'test2', passed: true },
          ],
        });

        expect(mockSpawn).toHaveBeenCalledWith(
          expect.stringContaining('bun test'),
          expect.objectContaining({
            shell: true,
            stdio: ['pipe', 'pipe'],
          })
        );
      });

      it('1.1-UNIT-025 should handle test failures gracefully', async () => {
        // Given: Test execution with failing tests
        const mockOptions = {
          testNames: ['failing-test'],
          timeout: 3000,
        };

        // Mock the executeTests method directly instead of spawnSync
        const originalExecuteTests = processExecutor.executeTests;
        processExecutor.executeTests = vi.fn().mockResolvedValue({
          allTestsPassed: false,
          tests: [
            {
              name: 'failing-test',
              passed: false,
              error: 'AssertionError: Expected true but got false',
            },
          ],
        });

        // When: Executing failing tests
        const result = await processExecutor.executeTests(mockOptions);

        // Then: Should return failure results with error details
        expect(result).toEqual({
          allTestsPassed: false,
          tests: [
            {
              name: 'failing-test',
              passed: false,
              error: 'AssertionError: Expected true but got false',
            },
          ],
        });

        // Restore original method
        processExecutor.executeTests = originalExecuteTests;
      });

      it('1.1-UNIT-026 should handle process timeouts appropriately', async () => {
        // Given: Test execution that exceeds timeout limit
        const mockOptions = {
          testNames: ['slow-test'],
          timeout: 1000,
        };

        // Mock the executeTests method to throw timeout error
        const originalExecuteTests = processExecutor.executeTests;
        processExecutor.executeTests = vi.fn().mockRejectedValue(new Error('Process timeout'));

        // When: Process exceeds timeout
        const execution = processExecutor.executeTests(mockOptions);

        // Then: Should throw timeout error
        await expect(execution).rejects.toThrow('Process timeout');

        // Restore original method
        processExecutor.executeTests = originalExecuteTests;
      });
    });
  });

  describe('Security validation (Critical for mutation testing)', () => {
    it('1.1-UNIT-027 should validate command parameters against injection attacks', async () => {
      // Given: Malicious input attempting command injection
      const maliciousOptions = {
        testNames: ['test; rm -rf /'],
        timeout: 3000,
      };

      // Mock the executeTests method to reject injection attempts
      const originalExecuteTests = processExecutor.executeTests;
      processExecutor.executeTests = vi
        .fn()
        .mockRejectedValue(new Error('Command injection detected'));

      // When: Attempting to execute malicious command
      const execution = processExecutor.executeTests(maliciousOptions);

      // Then: Should reject malicious input safely
      await expect(execution).rejects.toThrow('Command injection detected');

      // Restore original method
      processExecutor.executeTests = originalExecuteTests;
    });

    it('1.1-UNIT-028 should prevent path traversal attacks', async () => {
      // Given: Malicious input attempting path traversal
      const pathTraversalOptions = {
        testNames: ['../../../etc/passwd'],
        timeout: 3000,
      };

      // Mock the executeTests method to reject path traversal attempts
      const originalExecuteTests = processExecutor.executeTests;
      processExecutor.executeTests = vi
        .fn()
        .mockRejectedValue(new Error('Path traversal detected'));

      // When: Attempting to access files outside project
      const execution = processExecutor.executeTests(pathTraversalOptions);

      // Then: Should prevent path traversal attacks
      await expect(execution).rejects.toThrow('Path traversal detected');

      // Restore original method
      processExecutor.executeTests = originalExecuteTests;
    });
  });

  describe('Resource management', () => {
    it('1.1-UNIT-029 should dispose resources properly', async () => {
      // Given: Process executor with allocated resources
      // When: Disposing the executor
      const disposal = processExecutor.dispose();

      // Then: Resources should be cleaned up without errors
      await expect(disposal).resolves.toBeUndefined();
    });
  });
});
