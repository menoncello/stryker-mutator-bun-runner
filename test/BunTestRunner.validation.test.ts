import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { BunTestRunner } from '../src/BunTestRunner';
import { MockLogger, MockBunAdapter, TestableClass, MockError } from './types/mocks';

// Mock execa and semver modules
const mockExeca = mock();
const mockSemver = {
  gte: mock()
};

// Mock the modules
mock.module('execa', () => ({
  execa: mockExeca
}));

mock.module('semver', () => mockSemver);

describe('BunTestRunner Validation Tests', () => {
  let mockLogger: MockLogger;
  let runner: BunTestRunner;
  let mockBunAdapter: MockBunAdapter;

  beforeEach(() => {
    mockLogger = {
      debug: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
      fatal: mock(() => {}),
      trace: mock(() => {})
    };

    // Mock BunTestAdapter
    mockBunAdapter = {
      init: mock(async () => {}),
      dispose: mock(async () => {}),
      runTests: mock(async () => ({})),
      getCoverageCollector: mock(() => ({
        toMutantCoverage: mock(() => ({}))
      }))
    };

    runner = new BunTestRunner(mockLogger, {});
    (runner as TestableClass<BunTestRunner>).bunAdapter = mockBunAdapter;

    // Reset mocks
    mockExeca.mockReset();
    mockSemver.gte.mockReset();
  });

  describe('validateBunInstallation method', () => {
    test('should validate bun installation successfully', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: 'bun 1.2.0'
      });
      mockSemver.gte.mockReturnValueOnce(true);

      await runner.init();

      expect(mockExeca).toHaveBeenCalledWith('bun', ['--version']);
      expect(mockSemver.gte).toHaveBeenCalledWith('1.2.0', '1.0.0');
      expect(mockLogger.debug).toHaveBeenCalledWith('Found Bun version: bun 1.2.0');
    });

    test('should handle bun version with trimming', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: '  bun 1.5.2  \n'
      });
      mockSemver.gte.mockReturnValueOnce(true);

      await runner.init();

      expect(mockSemver.gte).toHaveBeenCalledWith('1.5.2', '1.0.0');
      expect(mockLogger.debug).toHaveBeenCalledWith('Found Bun version: bun 1.5.2');
    });

    test('should handle bun version without "bun " prefix', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: '1.3.0'
      });
      mockSemver.gte.mockReturnValueOnce(true);

      await runner.init();

      expect(mockSemver.gte).toHaveBeenCalledWith('1.3.0', '1.0.0');
    });

    test('should throw error for old bun version', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: 'bun 0.9.0'
      });
      mockSemver.gte.mockReturnValueOnce(false);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Bun version 1.0.0 or higher is required');
      }

      expect(mockSemver.gte).toHaveBeenCalledWith('0.9.0', '1.0.0');
    });

    test('should handle bun not found error (ENOENT)', async () => {
      const enoentError = new Error('Command not found');
      (enoentError as MockError).code = 'ENOENT';
      mockExeca.mockRejectedValueOnce(enoentError);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Bun not found. Please install Bun: https://bun.sh');
      }
    });

    test('should re-throw non-ENOENT errors', async () => {
      const networkError = new Error('Network timeout');
      mockExeca.mockRejectedValueOnce(networkError);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Network timeout');
      }
    });

    test('should handle version check with complex version strings', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: 'bun 1.0.0-canary.123'
      });
      mockSemver.gte.mockReturnValueOnce(true);

      await runner.init();

      expect(mockSemver.gte).toHaveBeenCalledWith('1.0.0-canary.123', '1.0.0');
    });

    test('should handle error objects without code property', async () => {
      const genericError = { message: 'Generic error' };
      mockExeca.mockRejectedValueOnce(genericError);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect(error).toBe(genericError);
      }
    });

    test('should handle error objects with different code', async () => {
      const permissionError = new Error('Permission denied');
      (permissionError as MockError).code = 'EACCES';
      mockExeca.mockRejectedValueOnce(permissionError);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Permission denied');
      }
    });

    test('should handle non-object errors', async () => {
      const stringError = 'String error';
      mockExeca.mockRejectedValueOnce(stringError);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect(error).toBe('String error');
      }
    });

    test('should handle version string replacement correctly', async () => {
      // Test edge case where version contains multiple "bun " strings
      mockExeca.mockResolvedValueOnce({
        stdout: 'bun bun 1.1.0'
      });
      mockSemver.gte.mockReturnValueOnce(true);

      await runner.init();

      // Should only replace first occurrence
      expect(mockSemver.gte).toHaveBeenCalledWith('bun 1.1.0', '1.0.0');
    });

    test('should handle empty stdout', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: ''
      });
      mockSemver.gte.mockReturnValueOnce(false);

      try {
        await runner.init();
        expect(false).toBe(true); // Should not reach here
      } catch (error: unknown) {
        expect((error as Error).message).toBe('Bun version 1.0.0 or higher is required');
      }

      expect(mockSemver.gte).toHaveBeenCalledWith('', '1.0.0');
    });

    test('should handle exact minimum version', async () => {
      mockExeca.mockResolvedValueOnce({
        stdout: 'bun 1.0.0'
      });
      mockSemver.gte.mockReturnValueOnce(true);

      await runner.init();

      expect(mockSemver.gte).toHaveBeenCalledWith('1.0.0', '1.0.0');
      expect(mockBunAdapter.init).toHaveBeenCalled();
    });
  });
});