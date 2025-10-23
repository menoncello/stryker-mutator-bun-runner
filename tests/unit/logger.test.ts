import { describe, it, expect, beforeEach, afterEach, vi } from 'bun:test';
import { Logger } from '../../src/utils/logger';

describe('1.1-Logging System', () => {
  let mockConsole: {
    log: (message: string) => void;
    error: (message: string) => void;
    warn: (message: string) => void;
    info: (message: string) => void;
    debug: (message: string) => void;
  };

  beforeEach(() => {
    // Given: Console methods should be mocked for testing
    mockConsole = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
    };

    // When: Setting up test environment
    global.console = mockConsole as any;
  });

  afterEach(() => {
    // Cleanup: Restore original console
    global.console = console;
  });

  describe('Logger initialization', () => {
    it('1.1-UNIT-008 should initialize with default log level', () => {
      // Given: The logger should have sensible default configuration
      const defaultLogLevel = undefined;

      // When: Creating a logger with defaults
      const logger = new Logger(defaultLogLevel);

      // Then: Logger should be created successfully
      expect(logger).toBeDefined();
    });

    it('1.1-UNIT-009 should initialize with custom log level', () => {
      // Given: Users should be able to specify log levels
      const customLogLevel = 'warn';

      // When: Creating a logger with custom level
      const logger = new Logger(customLogLevel);

      // Then: Logger should accept the custom log level
      expect(logger).toBeDefined();
    });
  });

  describe('Logging functionality', () => {
    it('1.1-UNIT-010 should log debug messages with proper formatting', () => {
      // Given: A debug message needs to be logged and a fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('debug', {
        output: freshMockOutput,
      });
      const debugMessage = 'Test debug message';

      // When: Logging the debug message
      logger.debug(debugMessage);

      // Then: Debug message should be properly formatted and sent to output
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'debug',
        expect.stringMatching(
          /^\[DEBUG] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Test debug message$/
        )
      );
    });

    it('1.1-UNIT-011 should log info messages with proper formatting', () => {
      // Given: An info message needs to be logged and a fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('debug', {
        output: freshMockOutput,
      });
      const infoMessage = 'Test info message';

      // When: Logging the info message
      logger.info(infoMessage);

      // Then: Info message should be properly formatted and sent to output
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'info',
        expect.stringMatching(
          /^\[INFO] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Test info message$/
        )
      );
    });

    it('1.1-UNIT-012 should log warning messages with proper formatting', () => {
      // Given: A warning message needs to be logged and a fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('debug', {
        output: freshMockOutput,
      });
      const warningMessage = 'Test warning message';

      // When: Logging the warning message
      logger.warn(warningMessage);

      // Then: Warning message should be properly formatted and sent to output
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'warn',
        expect.stringMatching(
          /^\[WARN] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Test warning message$/
        )
      );
    });

    it('1.1-UNIT-013 should log error messages with proper formatting', () => {
      // Given: An error message needs to be logged and a fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('debug', {
        output: freshMockOutput,
      });
      const errorMessage = 'Test error message';

      // When: Logging the error message
      logger.error(errorMessage);

      // Then: Error message should be properly formatted and sent to output
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'error',
        expect.stringMatching(
          /^\[ERROR] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Test error message$/
        )
      );
    });
  });

  describe('Sensitive data protection', () => {
    it('1.1-UNIT-014 should mask passwords in log messages', () => {
      // Given: A message containing sensitive password information and fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('info', {
        output: freshMockOutput,
      });
      const messageWithPassword = 'Connecting with password=secret123';

      // When: Logging the message
      logger.info(messageWithPassword);

      // Then: Password should be masked in the output
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'info',
        expect.stringMatching(
          /^\[INFO] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Connecting with password=\*\*\*$/
        )
      );
    });

    it('1.1-UNIT-015 should mask API keys in log messages', () => {
      // Given: A message containing sensitive API key information and fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('info', {
        output: freshMockOutput,
      });
      const messageWithApiKey = 'Using API key=sk-1234567890';

      // When: Logging the message
      logger.info(messageWithApiKey);

      // Then: API key should be masked in the output
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'info',
        expect.stringMatching(
          /^\[INFO] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Using API key=\*\*\*$/
        )
      );
    });

    it('1.1-UNIT-016 should mask authentication tokens in log messages', () => {
      // Given: A message containing sensitive token information and fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('info', {
        output: freshMockOutput,
      });
      const messageWithToken = 'Authorization: Bearer abc123xyz';

      // When: Logging the message
      logger.info(messageWithToken);

      // Then: Token should be masked in the output
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'info',
        expect.stringMatching(
          /^\[INFO] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Authorization: Bearer \*\*\*$/
        )
      );
    });

    it('1.1-UNIT-017 should handle metadata objects with sensitive data', () => {
      // Given: Metadata containing both sensitive and safe information and fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const logger = new Logger('info', {
        output: freshMockOutput,
      });
      const sensitiveMetadata = {
        password: 'secret123',
        apiKey: 'sk-test-key',
        normalField: 'safe data',
      };
      const logMessage = 'User login attempt';

      // When: Logging with sensitive metadata
      logger.info(logMessage, sensitiveMetadata);

      // Then: Message should be logged while sensitive data is protected
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'info',
        expect.stringMatching(
          /^\[INFO] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z User login attempt {.*"password":"\*\*\*".*"apiKey":"\*\*\*".*"normalField":"safe data".*}$/
        )
      );
      expect(freshMockOutput.write).toHaveBeenCalled();
    });
  });

  describe('Log level filtering', () => {
    it('1.1-UNIT-018 should filter debug messages when log level is INFO', () => {
      // Given: A logger configured to INFO level and fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const infoLogger = new Logger('info', { output: freshMockOutput });
      const debugMessage = 'This should not appear';

      // When: Attempting to log a debug message
      infoLogger.debug(debugMessage);

      // Then: Debug message should be filtered out (no calls to output at all)
      expect(freshMockOutput.write).not.toHaveBeenCalled();
    });

    it('1.1-UNIT-019 should allow warning messages when log level is INFO', () => {
      // Given: A logger configured to INFO level and fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const infoLogger = new Logger('info', { output: freshMockOutput });
      const warningMessage = 'This should appear';

      // When: Logging a warning message
      infoLogger.warn(warningMessage);

      // Then: Warning message should be allowed through
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'warn',
        expect.stringMatching(
          /^\[WARN] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z This should appear$/
        )
      );
    });

    it('1.1-UNIT-020 should allow all messages when log level is DEBUG', () => {
      // Given: A logger configured to DEBUG level and fresh mock
      const freshMockOutput = {
        write: vi.fn(),
      };
      const debugLogger = new Logger('debug', { output: freshMockOutput });

      // When: Logging messages at different levels
      debugLogger.debug('Debug message');
      debugLogger.info('Info message');
      debugLogger.warn('Warning message');

      // Then: All messages should be logged
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'debug',
        expect.stringMatching(
          /^\[DEBUG] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Debug message$/
        )
      );
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'info',
        expect.stringMatching(/^\[INFO] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Info message$/)
      );
      expect(freshMockOutput.write).toHaveBeenCalledWith(
        'warn',
        expect.stringMatching(
          /^\[WARN] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z Warning message$/
        )
      );
    });
  });
});
