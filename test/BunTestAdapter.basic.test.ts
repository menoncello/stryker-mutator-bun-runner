import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunTestAdapter } from '../src/BunTestAdapter';
import { BunTestRunnerOptions } from '../src/BunTestRunnerOptions';

describe('BunTestAdapter Basic Tests', () => {
  let mockLogger: any;
  let adapter: BunTestAdapter;

  beforeEach(() => {
    mockLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      fatal: mock(() => {}),
      trace: mock(() => {})
    };
  });

  describe('constructor', () => {
    test('should create adapter with minimal options', () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(BunTestAdapter);
    });

    test('should create adapter with full options', () => {
      const options: BunTestRunnerOptions = {
        testFiles: ['test/**/*.test.ts'],
        timeout: 10000,
        bail: true,
        nodeArgs: ['--experimental-modules'],
        env: { NODE_ENV: 'test' },
        command: 'bun test --coverage',
        coverageAnalysis: 'perTest'
      };
      adapter = new BunTestAdapter(mockLogger, options);

      expect(adapter).toBeDefined();
      expect(adapter).toBeInstanceOf(BunTestAdapter);
    });

    test('should create adapter with different coverage settings', () => {
      const testCases = [
        { coverageAnalysis: 'off' as const },
        { coverageAnalysis: 'all' as const },
        { coverageAnalysis: 'perTest' as const },
        { coverageAnalysis: undefined }
      ];

      testCases.forEach(options => {
        const adapter = new BunTestAdapter(mockLogger, options);
        expect(adapter).toBeDefined();
      });
    });
  });

  describe('getCoverageCollector', () => {
    test('should return coverage collector instance', () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const collector = adapter.getCoverageCollector();

      expect(collector).toBeDefined();
      expect(typeof collector.init).toBe('function');
      expect(typeof collector.startCoverage).toBe('function');
      expect(typeof collector.stopCoverage).toBe('function');
      expect(typeof collector.dispose).toBe('function');
      expect(typeof collector.toMutantCoverage).toBe('function');
    });

    test('should return same collector instance on multiple calls', () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const collector1 = adapter.getCoverageCollector();
      const collector2 = adapter.getCoverageCollector();

      expect(collector1).toBe(collector2);
    });
  });

  describe('hook content generation', () => {
    beforeEach(() => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);
    });

    test('should generate initialization code', () => {
      const initCode = (adapter as any).getInitializationCode();

      expect(initCode).toBeDefined();
      expect(typeof initCode).toBe('string');
      expect(initCode).toContain('globalThis.__stryker__');
      expect(initCode).toContain('undefined');
      expect(initCode.length).toBeGreaterThan(0);
      expect(initCode).not.toBe('');
    });

    test('should generate test wrapper code', () => {
      const wrapperCode = (adapter as any).getTestWrapperCode();

      expect(wrapperCode).toBeDefined();
      expect(typeof wrapperCode).toBe('string');
      expect(wrapperCode).toContain('originalTest');
      expect(wrapperCode).toContain('wrappedTest');
      expect(wrapperCode).toContain('globalThis.test');
      expect(wrapperCode).toContain('globalThis.it');
      expect(wrapperCode).toContain('currentTestId');
      expect(wrapperCode).toContain('mutantCoverage');
      expect(wrapperCode).toContain('perTest');
      expect(wrapperCode.length).toBeGreaterThan(100);
      expect(wrapperCode).not.toBe('');
    });

    test('should generate mutant tracking code', () => {
      const trackingCode = (adapter as any).getMutantTrackingCode();

      expect(trackingCode).toBeDefined();
      expect(typeof trackingCode).toBe('string');
      expect(trackingCode).toContain('trackMutant');
      expect(trackingCode).toContain('function(mutantId)');
      expect(trackingCode).toContain('currentTestId');
      expect(trackingCode).toContain('mutantCoverage');
      expect(trackingCode).toContain('add(mutantId)');
      expect(trackingCode.length).toBeGreaterThan(50);
      expect(trackingCode).not.toBe('');
    });

    test('should generate complete hook content', () => {
      const hookContent = (adapter as any).generateHookContent();

      expect(hookContent).toBeDefined();
      expect(typeof hookContent).toBe('string');
      expect(hookContent).toContain('Stryker Bun Coverage Hook');
      expect(hookContent).toContain('automatically generated');
      expect(hookContent).toContain('globalThis.__stryker__');
      expect(hookContent).toContain('trackMutant');
      expect(hookContent).toContain('originalTest');
      expect(hookContent.length).toBeGreaterThan(200);
      expect(hookContent).not.toBe('');
    });

    test('should validate hook content structure', () => {
      const hookContent = (adapter as any).generateHookContent();
      
      // Should contain all three main sections
      const initCode = (adapter as any).getInitializationCode();
      const wrapperCode = (adapter as any).getTestWrapperCode();
      const trackingCode = (adapter as any).getMutantTrackingCode();
      
      expect(hookContent).toContain(initCode);
      expect(hookContent).toContain(wrapperCode);
      expect(hookContent).toContain(trackingCode);
    });
  });

  describe('environment building', () => {
    beforeEach(() => {
      const options: BunTestRunnerOptions = {
        env: { CUSTOM_VAR: 'custom-value' }
      };
      adapter = new BunTestAdapter(mockLogger, options);
    });

    test('should build environment with basic options', () => {
      const runOptions = { timeout: 5000 };
      const env = (adapter as any).buildEnvironment(runOptions);

      expect(env).toBeDefined();
      expect(typeof env).toBe('object');
      expect(env.NODE_ENV).toBe('test');
      expect(env.BUN_TEST_QUIET).toBe('1');
      expect(env.CUSTOM_VAR).toBe('custom-value');
    });

    test('should build environment with active mutant', () => {
      const runOptions = { 
        timeout: 5000,
        activeMutant: 42
      };
      const env = (adapter as any).buildEnvironment(runOptions);

      expect(env.__STRYKER_ACTIVE_MUTANT__).toBe('42');
    });

    test('should build environment without active mutant', () => {
      const runOptions = { timeout: 5000 };
      const env = (adapter as any).buildEnvironment(runOptions);

      expect(env.__STRYKER_ACTIVE_MUTANT__).toBeUndefined();
    });

    test('should build environment with run options env', () => {
      const runOptions = { 
        timeout: 5000,
        env: { RUN_SPECIFIC: 'run-value' }
      };
      const env = (adapter as any).buildEnvironment(runOptions);

      expect(env.RUN_SPECIFIC).toBe('run-value');
      expect(env.CUSTOM_VAR).toBe('custom-value'); // Should still have adapter env
      expect(env.NODE_ENV).toBe('test');
    });

    test('should override env variables correctly', () => {
      const runOptions = { 
        env: { 
          NODE_ENV: 'production', // Override
          NEW_VAR: 'new-value' 
        }
      };
      const env = (adapter as any).buildEnvironment(runOptions);

      expect(env.NODE_ENV).toBe('production'); // Run options should override
      expect(env.NEW_VAR).toBe('new-value');
      expect(env.CUSTOM_VAR).toBe('custom-value');
      expect(env.BUN_TEST_QUIET).toBe('1');
    });

    test('should handle undefined activeMutant', () => {
      const runOptions = { 
        activeMutant: undefined
      };
      const env = (adapter as any).buildEnvironment(runOptions);

      expect(env.__STRYKER_ACTIVE_MUTANT__).toBeUndefined();
    });

    test('should handle zero activeMutant', () => {
      const runOptions = { 
        activeMutant: 0
      };
      const env = (adapter as any).buildEnvironment(runOptions);

      expect(env.__STRYKER_ACTIVE_MUTANT__).toBe('0');
    });
  });

  describe('bun args building basic tests', () => {
    test('should build basic args with default command', () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const args = (adapter as any).buildBunArgs([], {});

      expect(args).toBeDefined();
      expect(Array.isArray(args)).toBe(true);
      expect(args).toContain('test'); // Default command
    });

    test('should build args with custom command', () => {
      const options: BunTestRunnerOptions = {
        command: 'custom-test --verbose'
      };
      adapter = new BunTestAdapter(mockLogger, options);

      const args = (adapter as any).buildBunArgs([], {});

      expect(args).toContain('custom-test');
      expect(args).toContain('--verbose');
      expect(args).not.toContain('test'); // Should not contain default
    });

    test('should add test files to args', () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const testFiles = ['test1.ts', 'test2.ts'];
      const args = (adapter as any).buildBunArgs(testFiles, {});

      expect(args).toContain('test1.ts');
      expect(args).toContain('test2.ts');
    });

    test('should add node args', () => {
      const options: BunTestRunnerOptions = {
        nodeArgs: ['--experimental-modules', '--max-old-space-size=4096']
      };
      adapter = new BunTestAdapter(mockLogger, options);

      const args = (adapter as any).buildBunArgs([], {});

      expect(args).toContain('--experimental-modules');
      expect(args).toContain('--max-old-space-size=4096');
    });

    test('should not add node args when not specified', () => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);

      const args = (adapter as any).buildBunArgs([], {});

      expect(args.filter(arg => arg.startsWith('--experimental'))).toHaveLength(0);
    });
  });

  describe('individual arg building methods', () => {
    beforeEach(() => {
      const options: BunTestRunnerOptions = {};
      adapter = new BunTestAdapter(mockLogger, options);
    });

    test('should add base command correctly', () => {
      const args: string[] = [];
      (adapter as any).addBaseCommand(args);

      expect(args).toContain('test');
      expect(args).toHaveLength(1);
    });

    test('should add base command with custom command', () => {
      const options: BunTestRunnerOptions = {
        command: 'custom test --flag'
      };
      adapter = new BunTestAdapter(mockLogger, options);

      const args: string[] = [];
      (adapter as any).addBaseCommand(args);

      expect(args).toContain('custom');
      expect(args).toContain('test');
      expect(args).toContain('--flag');
      expect(args).toHaveLength(3);
    });

    test('should add test files when provided', () => {
      const args: string[] = [];
      const testFiles = ['file1.test.ts', 'file2.test.ts'];
      (adapter as any).addTestFiles(args, testFiles);

      expect(args).toContain('file1.test.ts');
      expect(args).toContain('file2.test.ts');
      expect(args).toHaveLength(2);
    });

    test('should add test files from options when no files provided', () => {
      const options: BunTestRunnerOptions = {
        testFiles: ['default1.test.ts', 'default2.test.ts']
      };
      adapter = new BunTestAdapter(mockLogger, options);

      const args: string[] = [];
      (adapter as any).addTestFiles(args, []);

      expect(args).toContain('default1.test.ts');
      expect(args).toContain('default2.test.ts');
      expect(args).toHaveLength(2);
    });

    test('should not add default test files when custom command is used', () => {
      const options: BunTestRunnerOptions = {
        testFiles: ['default.test.ts'],
        command: 'custom-command'
      };
      adapter = new BunTestAdapter(mockLogger, options);

      const args: string[] = [];
      (adapter as any).addTestFiles(args, []);

      expect(args).toHaveLength(0); // Should not add any files
    });

    test('should add node args when present', () => {
      const options: BunTestRunnerOptions = {
        nodeArgs: ['--arg1', '--arg2']
      };
      adapter = new BunTestAdapter(mockLogger, options);

      const args: string[] = [];
      (adapter as any).addNodeArgs(args);

      expect(args).toContain('--arg1');
      expect(args).toContain('--arg2');
      expect(args).toHaveLength(2);
    });

    test('should not add node args when not present', () => {
      const args: string[] = [];
      (adapter as any).addNodeArgs(args);

      expect(args).toHaveLength(0);
    });
  });
});