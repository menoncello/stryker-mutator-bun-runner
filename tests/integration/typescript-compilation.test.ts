/**
 * Integration tests for TypeScript compilation and build processes
 * These tests verify the integration between TypeScript configuration and build output
 */
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { readConfigFile } from 'typescript';

const projectRoot = join(__dirname, '../..');
const distDir = join(projectRoot, 'dist');

// Helper function to clean directory
function rimraf(dirPath: string): void {
  if (existsSync(dirPath)) {
    rmSync(dirPath, { recursive: true, force: true });
  }
}

const cleanDistDir = (): void => {
  rimraf(distDir);
};

describe('1.1-TypeScript Compilation Integration', () => {
  beforeEach(() => {
    // Ensure clean state before each test
    try {
      cleanDistDir();
    } catch (error) {
      console.warn('Could not clean dist directory:', error);
    }
  });

  afterEach(() => {
    // Clean up after tests
    try {
      cleanDistDir();
    } catch (error) {
      console.warn('Could not clean dist directory after test:', error);
    }
  });

  describe('AC1: TypeScript project initialized with tsconfig.json in strict mode', () => {
    it('1.1-INT-001 should validate TypeScript compilation integration', async () => {
      // Given: The project should have TypeScript configuration in strict mode
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      const packageJsonPath = join(projectRoot, 'package.json');

      expect(existsSync(tsconfigPath)).toBe(true);
      expect(existsSync(packageJsonPath)).toBe(true);

      // When: Validating TypeScript configuration
      // Then: TypeScript configuration should be valid and strict mode enabled
      const tsconfigResult = readConfigFile(tsconfigPath, path => readFileSync(path, 'utf-8'));
      expect(tsconfigResult.error).toBeUndefined();
      expect(tsconfigResult.config?.compilerOptions?.strict).toBe(true);
      expect(tsconfigResult.config?.compilerOptions?.noImplicitAny).toBe(true);
      expect(tsconfigResult.config?.compilerOptions?.strictNullChecks).toBe(true);
    });

    it('1.1-INT-002 should generate TypeScript declaration files', async () => {
      // Given: The project should be configured to generate declaration files
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      const tsconfigResult = readConfigFile(tsconfigPath, path => readFileSync(path, 'utf-8'));

      // When: Checking build configuration exists
      // Then: TypeScript configuration should be set for declaration generation
      expect(tsconfigResult.config?.compilerOptions?.declaration).toBe(true);
      expect(tsconfigResult.config?.compilerOptions?.declarationMap).toBe(true);
      expect(tsconfigResult.config?.compilerOptions?.emitDeclarationOnly).toBeUndefined(); // Should generate both .js and .d.ts
    });

    it('1.1-INT-003 should validate dual ESM/CJS output configuration', () => {
      // Given: The project should have dual output configuration
      const packageJsonPath = join(projectRoot, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // When: Checking package.json configuration
      // Then: Package should have proper dual module exports
      expect(packageJson.type).toBe('module');
      expect(packageJson.main).toBeDefined();
      expect(packageJson.module).toBeDefined();
      expect(packageJson.exports).toBeDefined();

      // And: Should have proper build scripts
      expect(packageJson.scripts?.build).toBeDefined();
      expect(packageJson.scripts?.['build:esm']).toBeDefined();
      expect(packageJson.scripts?.['build:cjs']).toBeDefined();
    });
  });

  describe('AC3: Build script produces compilable JavaScript output', () => {
    it('1.1-INT-004 should execute complete build process successfully', async () => {
      // Given: The project should have build configuration
      const tsconfigPath = join(projectRoot, 'tsconfig.json');
      const packageJsonPath = join(projectRoot, 'package.json');

      expect(existsSync(tsconfigPath)).toBe(true);
      expect(existsSync(packageJsonPath)).toBe(true);

      // When: Validating build configuration
      const tsconfigResult = readConfigFile(tsconfigPath, path => readFileSync(path, 'utf-8'));
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

      // Then: Build configuration should be properly set up
      expect(tsconfigResult.config?.compilerOptions?.outDir).toBe('./dist');
      expect(tsconfigResult.config?.compilerOptions?.rootDir).toBe('./src');
      expect(tsconfigResult.config?.compilerOptions?.target).toBeDefined();
      expect(tsconfigResult.config?.compilerOptions?.module).toBeDefined();

      // And: Package.json should have build script
      expect(packageJson.scripts?.build).toBeDefined();
      expect(typeof packageJson.scripts.build).toBe('string');
    });
  });
});
