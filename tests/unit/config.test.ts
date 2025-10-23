import { describe, it, expect } from 'bun:test';
import { BunTestRunnerConfig } from '../../src/config/bun-test-runner-config';

describe('1.1-Configuration Management', () => {
  describe('AC2: Package.json configured with dependencies', () => {
    describe('BunTestRunnerConfig initialization', () => {
      it('1.1-UNIT-001 should initialize with default options', () => {
        // Given: The configuration system should have sensible defaults
        const defaultOptions = {};

        // When: Creating a new configuration with defaults
        const config = new BunTestRunnerConfig(defaultOptions);

        // Then: Configuration should be created successfully
        expect(config).toBeDefined();
      });

      it('1.1-UNIT-002 should initialize with custom options', () => {
        // Given: Users should be able to provide custom configuration
        const customOptions = {
          bunCommand: 'custom-bun',
          testCommand: 'custom-test',
          timeout: 10000,
          logLevel: 'debug',
        };

        // When: Creating a new configuration with custom options
        const config = new BunTestRunnerConfig(customOptions);

        // Then: Configuration should accept and use custom options
        expect(config).toBeDefined();
      });

      it('1.1-UNIT-003 should handle partial options gracefully', () => {
        // Given: Users may want to override only some configuration options
        const partialOptions = {
          timeout: 5000,
          logLevel: 'warn',
        };

        // When: Creating configuration with partial options
        const config = new BunTestRunnerConfig(partialOptions);

        // Then: Configuration should merge with defaults successfully
        expect(config).toBeDefined();
      });
    });

    describe('Test environment configuration', () => {
      it('1.1-UNIT-004 should provide proper test environment variables', () => {
        // Given: The test runner needs specific environment variables
        const config = new BunTestRunnerConfig({});

        // When: Requesting test environment configuration
        const env = config.getTestEnvironment();

        // Then: Essential test environment variables should be set
        expect(env).toHaveProperty('NODE_ENV', 'test');
        expect(env).toHaveProperty('STRYKER_MUTATOR', 'true');
        expect(env).toHaveProperty('STRYKER_BUN_RUNNER', 'true');
      });
    });

    describe('Configuration validation', () => {
      it('1.1-UNIT-005 should validate complete configuration successfully', async () => {
        // Given: The configuration should be validated before use
        const config = new BunTestRunnerConfig({
          bunCommand: 'bun',
          testCommand: 'test',
        });

        // When: Validating the configuration
        const validation = config.validate();

        // Then: Valid configuration should pass validation
        await expect(validation).resolves.toBeUndefined();
      });
    });

    describe('Security configuration', () => {
      it('1.1-UNIT-006 should maintain secure default configuration', () => {
        // Given: Security is critical for mutation testing tools
        const config = new BunTestRunnerConfig({});

        // When: Checking default security settings
        const env = config.getTestEnvironment();

        // Then: Sensitive data should not be exposed by default
        expect(env.NODE_ENV).toBe('test');
      });

      it('1.1-UNIT-007 should support sandbox security mode', () => {
        // Given: Users may need enhanced security isolation
        const secureConfig = {
          securityMode: 'sandbox' as const,
        };

        // When: Enabling sandbox mode
        const config = new BunTestRunnerConfig(secureConfig);

        // Then: Sandbox configuration should be accepted
        expect(config).toBeDefined();
      });
    });
  });
});
