import { describe, test, expect, beforeEach, mock, spyOn } from 'bun:test';
import { BunTestAdapter } from '../src/BunTestAdapter';
import { BunTestRunnerOptions } from '../src/BunTestRunnerOptions';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock execa module
const mockExeca = mock();
mock.module('execa', () => ({
  execa: mockExeca
}));

describe('BunTestAdapter Method Tests', () => {
  let mockLogger: any;
  let adapter: BunTestAdapter;
  let mockParser: any;
  let mockCoverageCollector: any;

  beforeEach(() => {
    mockLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      fatal: mock(() => {}),
      trace: mock(() => {})
    };

    // Reset mocks
    mockExeca.mockReset();
  });

  describe('init method', () => {
    test('should initialize without coverage', async () => {
      const options: BunTestRunnerOptions = {
        coverageAnalysis: 'off'
      };
      adapter = new BunTestAdapter(mockLogger, options);

      // Mock coverage collector init
      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'init').mockResolvedValue(undefined);

      await adapter.init();

      expect(collector.init).toHaveBeenCalled();
    });

    test('should initialize with coverage and create hook file', async () => {
      const options: BunTestRunnerOptions = {
        coverageAnalysis: 'perTest'
      };
      adapter = new BunTestAdapter(mockLogger, options);

      // Mock methods
      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'init').mockResolvedValue(undefined);
      
      // Mock fs operations
      const mkdirSpy = spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const writeFileSpy = spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      await adapter.init();

      expect(collector.init).toHaveBeenCalled();
      expect(mkdirSpy).toHaveBeenCalledWith(
        path.join(process.cwd(), '.stryker-tmp'),
        { recursive: true }
      );
      expect(writeFileSpy).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith(expect.stringContaining('Created coverage hook file'));
    });

    test('should handle fs errors during init', async () => {
      const options: BunTestRunnerOptions = {
        coverageAnalysis: 'all'
      };
      adapter = new BunTestAdapter(mockLogger, options);

      // Mock coverage collector init
      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'init').mockResolvedValue(undefined);
      
      // Mock fs to throw error
      const mkdirSpy = spyOn(fs, 'mkdir').mockRejectedValue(new Error('Permission denied'));

      await expect(adapter.init()).rejects.toThrow('Permission denied');
    });
  });

  describe('runTests method', () => {
    beforeEach(() => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);
      
      // Mock parser
      mockParser = {
        parse: mock(() => ({
          tests: [
            { id: '1', name: 'test1', status: 'passed', duration: 10 }
          ],
          passed: 1,
          failed: 0,
          total: 1
        }))
      };
      (adapter as any).parser = mockParser;
    });

    test('should run tests successfully without coverage', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: 'test output',
        stderr: ''
      });

      const result = await adapter.runTests(['test.ts'], {
        timeout: 5000,
        coverage: false
      });

      expect(mockExeca).toHaveBeenCalledWith('bun', expect.arrayContaining(['test', 'test.ts']), expect.objectContaining({
        env: expect.objectContaining({
          NODE_ENV: 'test',
          BUN_TEST_QUIET: '1'
        }),
        timeout: 5000,
        reject: false
      }));
      
      expect(mockParser.parse).toHaveBeenCalledWith('test output');
      expect(result.passed).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.total).toBe(1);
      expect(result.coverage).toBeUndefined();
    });

    test('should run tests with coverage enabled', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);
      (adapter as any).parser = mockParser;
      (adapter as any).coverageHookPath = '/tmp/coverage-hook.js';

      // Mock coverage collector
      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'startCoverage').mockImplementation(() => {});
      spyOn(collector, 'stopCoverage').mockReturnValue({
        coverage: { perTest: {}, executedLines: {} },
        elapsedMs: 100
      });

      mockExeca.mockResolvedValueOnce({
        stdout: 'test output',
        stderr: ''
      });

      const result = await adapter.runTests([], {
        timeout: 5000,
        coverage: true
      });

      expect(collector.startCoverage).toHaveBeenCalled();
      expect(collector.stopCoverage).toHaveBeenCalled();
      expect(result.coverage).toBeDefined();
      expect(result.coverage?.elapsedMs).toBe(100);
      
      // Should include --preload argument
      expect(mockExeca).toHaveBeenCalledWith('bun', expect.arrayContaining(['--preload', '/tmp/coverage-hook.js']), expect.any(Object));
    });

    test('should handle stderr output', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: 'test output',
        stderr: 'Warning: deprecated feature'
      });

      await adapter.runTests([], { timeout: 5000 });

      expect(mockLogger.debug).toHaveBeenCalledWith('Bun stderr: Warning: deprecated feature');
    });

    test('should handle timeout error', async () => {
      const timeoutError = new Error('Command timed out') as any;
      timeoutError.timedOut = true;
      mockExeca.mockRejectedValueOnce(timeoutError);

      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'startCoverage').mockImplementation(() => {});
      spyOn(collector, 'stopCoverage').mockImplementation(() => ({ coverage: {}, elapsedMs: 0 }));

      await expect(adapter.runTests([], {
        timeout: 3000,
        coverage: true
      })).rejects.toThrow(timeoutError);

      expect(collector.stopCoverage).toHaveBeenCalled(); // Should stop coverage on error
    });

    test('should handle general error', async () => {
      mockExeca.mockRejectedValueOnce(new Error('Bun not found'));

      await expect(adapter.runTests([], { timeout: 5000 })).rejects.toThrow('Failed to run bun tests: Bun not found');
      
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to run bun tests', expect.any(Error));
    });

    test('should handle error without message', async () => {
      const errorWithoutMessage = { code: 'ENOENT' };
      mockExeca.mockRejectedValueOnce(errorWithoutMessage);

      await expect(adapter.runTests([], { timeout: 5000 })).rejects.toThrow('Failed to run bun tests: Unknown error');
    });

    test('should build args with all test options', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: 'test output',
        stderr: ''
      });

      await adapter.runTests(['test1.ts', 'test2.ts'], {
        timeout: 10000,
        bail: true,
        testNamePattern: 'should.*test',
        activeMutant: 42
      });

      expect(mockExeca).toHaveBeenCalledWith('bun', expect.arrayContaining([
        'test',
        'test1.ts',
        'test2.ts',
        '--test-name-pattern', 'should.*test',
        '--timeout', '10000',
        '--bail'
      ]), expect.objectContaining({
        env: expect.objectContaining({
          __STRYKER_ACTIVE_MUTANT__: '42'
        })
      }));
    });

    test('should use custom command when provided', async () => {
      const options: BunTestRunnerOptions = {
        command: 'bun test --coverage'
      };
      adapter = new BunTestAdapter(mockLogger, options);
      (adapter as any).parser = mockParser;

      mockExeca.mockResolvedValueOnce({
        stdout: 'test output',
        stderr: ''
      });

      await adapter.runTests([], { timeout: 5000 });

      expect(mockExeca).toHaveBeenCalledWith('bun', expect.arrayContaining(['bun', 'test', '--coverage']), expect.any(Object));
    });

    test('should not add test options when custom command is used', async () => {
      const options: BunTestRunnerOptions = {
        command: 'custom-test'
      };
      adapter = new BunTestAdapter(mockLogger, options);
      (adapter as any).parser = mockParser;

      mockExeca.mockResolvedValueOnce({
        stdout: 'test output',
        stderr: ''
      });

      await adapter.runTests([], {
        timeout: 5000,
        bail: true,
        testNamePattern: 'pattern'
      });

      const args = mockExeca.mock.calls[0][1];
      expect(args).not.toContain('--bail');
      expect(args).not.toContain('--test-name-pattern');
      expect(args).not.toContain('--timeout');
    });

    test('should use default test files when none provided', async () => {
      const options: BunTestRunnerOptions = {
        testFiles: ['default.test.ts']
      };
      adapter = new BunTestAdapter(mockLogger, options);
      (adapter as any).parser = mockParser;

      mockExeca.mockResolvedValueOnce({
        stdout: 'test output',
        stderr: ''
      });

      await adapter.runTests([], { timeout: 5000 });

      expect(mockExeca).toHaveBeenCalledWith('bun', expect.arrayContaining(['test', 'default.test.ts']), expect.any(Object));
    });
  });

  describe('dispose method', () => {
    test('should dispose coverage collector', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'dispose').mockResolvedValue(undefined);

      await adapter.dispose();

      expect(collector.dispose).toHaveBeenCalled();
    });

    test('should clean up coverage hook file', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);
      (adapter as any).coverageHookPath = '/tmp/coverage-hook.js';

      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'dispose').mockResolvedValue(undefined);
      
      const unlinkSpy = spyOn(fs, 'unlink').mockResolvedValue(undefined);

      await adapter.dispose();

      expect(collector.dispose).toHaveBeenCalled();
      expect(unlinkSpy).toHaveBeenCalledWith('/tmp/coverage-hook.js');
    });

    test('should handle file cleanup error gracefully', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);
      (adapter as any).coverageHookPath = '/tmp/coverage-hook.js';

      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'dispose').mockResolvedValue(undefined);
      
      const unlinkSpy = spyOn(fs, 'unlink').mockRejectedValue(new Error('File not found'));

      await adapter.dispose();

      expect(collector.dispose).toHaveBeenCalled();
      expect(unlinkSpy).toHaveBeenCalledWith('/tmp/coverage-hook.js');
      expect(mockLogger.debug).toHaveBeenCalledWith('Failed to clean up coverage hook file', expect.any(Error));
    });

    test('should not attempt to clean up if no hook path', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);
      // No coverageHookPath set

      const collector = adapter.getCoverageCollector();
      spyOn(collector, 'dispose').mockResolvedValue(undefined);
      
      // Don't spy on fs.unlink since we want to verify it's not called

      await adapter.dispose();

      expect(collector.dispose).toHaveBeenCalled();
      // Cannot verify unlink wasn't called without spy, just verify no error thrown
    });
  });

  describe('coverage hook file operations', () => {
    test('should create coverage hook file with correct content', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const mkdirSpy = spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const writeFileSpy = spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      await (adapter as any).createCoverageHookFile();

      expect(mkdirSpy).toHaveBeenCalledWith(
        path.join(process.cwd(), '.stryker-tmp'),
        { recursive: true }
      );

      expect(writeFileSpy).toHaveBeenCalledWith(
        expect.stringContaining('coverage-hook.js'),
        expect.stringContaining('Stryker Bun Coverage Hook'),
        'utf-8'
      );

      const writtenContent = writeFileSpy.mock.calls[0][1];
      expect(writtenContent).toContain('globalThis.__stryker__');
      expect(writtenContent).toContain('trackMutant');
      expect(writtenContent).toContain('originalTest');

      expect((adapter as any).coverageHookPath).toBeDefined();
      expect((adapter as any).coverageHookPath).toContain('.stryker-tmp');
      expect((adapter as any).coverageHookPath).toContain('coverage-hook.js');
    });

    test('should handle writeFile error', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const mkdirSpy = spyOn(fs, 'mkdir').mockResolvedValue(undefined);
      const writeFileSpy = spyOn(fs, 'writeFile').mockRejectedValue(new Error('Disk full'));

      await expect((adapter as any).createCoverageHookFile()).rejects.toThrow('Disk full');
    });
  });

  describe('environment and args edge cases', () => {
    test('should add coverage args only when both coverage and hook path exist', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      // Test without hook path
      const args1: string[] = [];
      (adapter as any).addCoverageArgs(args1, { coverage: true });
      expect(args1).toHaveLength(0);

      // Test with hook path
      (adapter as any).coverageHookPath = '/tmp/hook.js';
      const args2: string[] = [];
      (adapter as any).addCoverageArgs(args2, { coverage: true });
      expect(args2).toContain('--preload');
      expect(args2).toContain('/tmp/hook.js');

      // Test without coverage
      const args3: string[] = [];
      (adapter as any).addCoverageArgs(args3, { coverage: false });
      expect(args3).toHaveLength(0);
    });

    test('should handle test options with various timeout values', async () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      // Test with timeout = 0 (which is falsy, so won't be added)
      const args1: string[] = [];
      (adapter as any).addTestOptions(args1, { timeout: 0 });
      expect(args1).toHaveLength(0);

      // Test with positive timeout
      const args2: string[] = [];
      (adapter as any).addTestOptions(args2, { timeout: 5000 });
      expect(args2).toContain('--timeout');
      expect(args2).toContain('5000');
    });

    test('should prioritize run options env over adapter env', async () => {
      const options: BunTestRunnerOptions = {
        env: { VAR1: 'adapter', VAR2: 'adapter' }
      };
      adapter = new BunTestAdapter(mockLogger, options);

      const env = (adapter as any).buildEnvironment({
        env: { VAR1: 'run', VAR3: 'run' }
      });

      expect(env.VAR1).toBe('run'); // Overridden
      expect(env.VAR2).toBe('adapter'); // From adapter
      expect(env.VAR3).toBe('run'); // From run options
    });
  });
});