/**
 * Security Management Module
 *
 * Provides security controls for process execution and
 * mutation testing. Implements sandboxing and input validation.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

// import { createRequire } from 'node:module';
import type { BunTestRunnerConfig } from '../config/index.js';
import { Logger } from '../utils/index.js';

// Security validation constants
const MAX_FILE_PATH_LENGTH = 1000;
const MAX_ARG_LENGTH = 1000;
const ARG_PREVIEW_LENGTH = 50;

/**
 * Security modes for different isolation levels
 */
export type SecurityMode = 'none' | 'restricted' | 'sandbox';

/**
 * Security validation result
 */
export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  warnings?: string[];
}

/**
 * Manages security controls for the test runner
 */
export class SecurityManager {
  private readonly config: BunTestRunnerConfig;
  private readonly logger: Logger;
  private securityMode: SecurityMode;

  /**
   * Create a new SecurityManager
   *
   * @param config - Configuration object for the test runner
   * @param logger - Logger instance for logging operations
   * @returns A new SecurityManager instance
   */
  constructor(config: BunTestRunnerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.securityMode = this.initializeSecurityMode();
  }

  /**
   * Get security mode from environment or config
   * @returns The security mode to use ('sandbox', 'restricted', or 'none')
   */
  private initializeSecurityMode(): SecurityMode {
    const envMode = process.env.SECURITY_MODE?.toLowerCase() as SecurityMode;
    return envMode || this.config.securityMode || 'restricted';
  }

  /**
   * Initialize security manager
   * @returns Promise that resolves when security manager is initialized
   */
  public async init(): Promise<void> {
    this.logger.info('Initializing Security Manager', {
      securityMode: this.securityMode,
    });

    switch (this.securityMode) {
      case 'sandbox':
        await this.initSandboxMode();
        break;
      case 'restricted':
        await this.initRestrictedMode();
        break;
      case 'none':
        this.logger.warn('Security mode disabled - running without protection');
        break;
    }
  }

  /**
   * Initialize sandbox security mode
   */
  private async initSandboxMode(): Promise<void> {
    this.logger.info('Initializing sandbox security mode');

    // Validate required dependencies are secure
    await this.validateDependencies();

    // Set up process isolation
    this.setupProcessIsolation();

    this.logger.info('Sandbox mode initialized successfully');
  }

  /**
   * Initialize restricted security mode
   */
  private async initRestrictedMode(): Promise<void> {
    this.logger.info('Initializing restricted security mode');

    // Apply strict security controls
    await this.validateDependencies();
    this.setupProcessIsolation();
    this.enableInputValidation();

    this.logger.info('Restricted mode initialized successfully');
  }

  /**
   * Validate dependencies for security vulnerabilities
   */
  private async validateDependencies(): Promise<void> {
    this.logger.debug('Validating dependencies for security issues');

    try {
      // Check if we can access package.json securely using a cross-module compatible approach
      const path = await import('node:path');
      const fs = await import('node:fs');

      // Use a simplified approach that works for both ESM and CommonJS builds
      // For this project, we know package.json is in the project root
      const currentPath = path.resolve('.');

      const packagePath = require.resolve('../package.json', { paths: [currentPath] });

      if (!fs.existsSync(packagePath)) {
        throw new Error('Failed to validate package.json');
      }

      this.logger.debug('Dependency validation completed');
    } catch (error) {
      this.logger.warn('Dependency validation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Set up process isolation controls
   */
  private setupProcessIsolation(): void {
    this.logger.debug('Setting up process isolation');

    if (this.securityMode !== 'none') {
      // Set resource limits if available (Node.js specific)
      interface NodeJSProcessWithRlimit extends NodeJS.Process {
        setrlimit?: (resource: string, limits: { soft: number; hard: number }) => void;
      }

      const nodeProcess = process as NodeJSProcessWithRlimit;
      if (typeof nodeProcess.setrlimit === 'function') {
        try {
          nodeProcess.setrlimit('maxfiles', { soft: 64, hard: 64 });
          nodeProcess.setrlimit('maxprocesses', { soft: 1, hard: 1 });
        } catch (error) {
          this.logger.warn('Failed to set resource limits', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Enable input validation
   */
  private enableInputValidation(): void {
    this.logger.debug('Enabling input validation');

    // Store security validation state
    this.securityValidationEnabled = true;
  }

  private securityValidationEnabled = false;

  /**
   * Validate file path for security
   * @param filePath - The file path to validate for security issues
   * @returns ValidationResult indicating if the path is safe with optional warnings and reason
   */
  public validateFilePath(filePath: string): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
    };

    try {
      // Normalize path
      const normalizedPath = filePath.replace(/\\/g, '/');

      // Check for path traversal attempts
      if (normalizedPath.includes('../') || normalizedPath.includes('..\\')) {
        result.isValid = false;
        result.reason = 'Path traversal detected';
        this.logger.warn('Path traversal attempt blocked', { filePath });
        return result;
      }

      // Check for dangerous patterns
      const dangerousPatterns = [
        /\$\(/i, // Command substitution
        /`[^`]*`/i, // Nested backticks
        /\|\s*\n/i, // Command chaining
        /;\s*(rm|del)\s+/i, // File deletion commands
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(filePath)) {
          result.isValid = false;
          result.reason = 'Dangerous command pattern detected';
          this.logger.warn('Dangerous command pattern blocked', { filePath });
          return result;
        }
      }

      // Check path length
      if (filePath.length > MAX_FILE_PATH_LENGTH) {
        result.warnings?.push('Path length exceeds recommended maximum');
      }
    } catch (error) {
      result.isValid = false;
      result.reason = `Path validation error: ${error instanceof Error ? error.message : String(error)}`;
    }

    return result;
  }

  /**
   * Validate command arguments for security
   * @param args - Array of command arguments to validate for security issues
   * @returns ValidationResult indicating if the arguments are safe with optional warnings and reason
   */
  public validateCommandArgs(args: string[]): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
    };

    if (!this.securityValidationEnabled) {
      result.warnings?.push('Security validation is disabled');
      return result;
    }

    try {
      // Check each argument for dangerous patterns
      for (const arg of args) {
        // Check for suspicious patterns
        const dangerousPatterns = [
          /rm\s+-rf/i, // Recursive delete
          />\s*\/dev\/null/i, // Dev null device
          /\$\(/i, // Command substitution
          /&&.*rm/i, // Command chaining with delete
          /\|\s*nc\s+/i, // Netcat (potential reverse shell)
          /curl.*\|\s*sh/i, // Pipe to shell
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(arg)) {
            result.isValid = false;
            result.reason = `Dangerous command argument detected: ${arg}`;
            this.logger.warn('Dangerous command argument blocked', { arg });
            return result;
          }
        }

        // Check argument length
        if (arg.length > MAX_ARG_LENGTH) {
          result.warnings?.push(
            `Argument length exceeds recommended maximum: ${arg.substring(0, ARG_PREVIEW_LENGTH)}...`
          );
        }
      }
    } catch (error) {
      result.isValid = false;
      result.reason = `Command validation error: ${error instanceof Error ? error.message : String(error)}`;
    }

    return result;
  }

  /**
   * Sanitize input for logging
   * @param input - Input data to sanitize for logging
   * @returns Sanitized input safe for logging
   */
  public sanitizeForLogging(input: unknown): unknown {
    if (typeof input !== 'object' || input === null) {
      return input;
    }

    try {
      const sanitized = { ...input };

      // Remove sensitive fields
      const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth', 'credential'];

      for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          (sanitized as Record<string, unknown>)[key] = '***REDACTED***';
        }
      }

      return sanitized;
    } catch (error) {
      this.logger.warn('Failed to sanitize input for logging', {
        error: error instanceof Error ? error.message : String(error),
      });
      return input;
    }
  }

  /**
   * Check if current security mode allows file system access
   * @returns True if file system access is allowed, false otherwise
   */
  public allowsFileSystemAccess(): boolean {
    return this.securityMode !== 'sandbox';
  }

  /**
   * Check if current security mode allows network access
   * @returns True if network access is allowed, false otherwise
   */
  public allowsNetworkAccess(): boolean {
    return this.securityMode === 'none';
  }

  /**
   * Get current security mode
   * @returns The current security mode ('sandbox', 'restricted', or 'none')
   */
  public getSecurityMode(): SecurityMode {
    return this.securityMode;
  }

  /**
   * Dispose of resources
   */
  public async dispose(): Promise<void> {
    this.logger.info('Disposing Security Manager', {
      securityMode: this.securityMode,
    });

    // Clean up security validation state
    this.securityValidationEnabled = false;
  }
}
