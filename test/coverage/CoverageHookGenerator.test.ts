import { describe, test, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { CoverageHookGenerator } from '../../src/coverage/CoverageHookGenerator';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('CoverageHookGenerator', () => {
  let generator: CoverageHookGenerator;
  const tempDir = path.join(process.cwd(), '.stryker-tmp-test-' + Date.now());

  beforeEach(() => {
    generator = new CoverageHookGenerator();
    // Clear any existing mocks
    if (fs.mkdir.mock) fs.mkdir.mock.mockRestore?.();
    if (fs.writeFile.mock) fs.writeFile.mock.mockRestore?.();
    if (fs.unlink.mock) fs.unlink.mock.mockRestore?.();
  });

  afterEach(async () => {
    // Clean up
    await generator.cleanup();
    // Remove temp directory if exists
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
    // Restore any mocks
    if (fs.mkdir.mock) fs.mkdir.mock.mockRestore?.();
    if (fs.writeFile.mock) fs.writeFile.mock.mockRestore?.();
    if (fs.unlink.mock) fs.unlink.mock.mockRestore?.();
  });

  test('should create instance successfully', () => {
    expect(generator).toBeDefined();
    expect(generator).toBeInstanceOf(CoverageHookGenerator);
  });

  test('should create hook file with mocked fs', async () => {
    // Mock fs operations
    const mockMkdir = spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    const mockWriteFile = spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    
    const hookPath = await generator.createHookFile();
    
    expect(hookPath).toBeDefined();
    expect(hookPath).toContain('.stryker-tmp');
    expect(hookPath).toContain('coverage-hook.js');
    
    // Verify fs calls
    expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('.stryker-tmp'), { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining('coverage-hook.js'),
      expect.stringContaining('Stryker Bun Coverage Hook'),
      'utf-8'
    );
    
    // Restore mocks
    mockMkdir.mockRestore();
    mockWriteFile.mockRestore();
  });

  test('should cleanup hook file successfully', async () => {
    // Mock fs operations
    const mockMkdir = spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    const mockWriteFile = spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    const mockUnlink = spyOn(fs, 'unlink').mockResolvedValue(undefined);
    
    const hookPath = await generator.createHookFile();
    
    // Clean up
    await generator.cleanup();
    
    // Verify unlink was called
    expect(mockUnlink).toHaveBeenCalledWith(hookPath);
    
    // Restore mocks
    mockMkdir.mockRestore();
    mockWriteFile.mockRestore();
    mockUnlink.mockRestore();
  });

  test('should handle cleanup when no hook file exists', async () => {
    // Should not throw error
    await expect(generator.cleanup()).resolves.toBeUndefined();
  });

  test('should generate proper initialization code', () => {
    // Access private method through type assertion
    interface GeneratorWithPrivates {
      getInitializationCode(): string;
    }
    const generatorWithPrivates = generator as unknown as GeneratorWithPrivates;
    const initCode = generatorWithPrivates.getInitializationCode();
    
    expect(initCode).toContain('globalThis.__stryker__');
    expect(initCode).toContain('undefined');
  });

  test('should generate proper test wrapper code', () => {
    // Access private method through type assertion
    interface GeneratorWithPrivates {
      getTestWrapperCode(): string;
    }
    const generatorWithPrivates = generator as unknown as GeneratorWithPrivates;
    const wrapperCode = generatorWithPrivates.getTestWrapperCode();
    
    expect(wrapperCode).toContain('originalTest');
    expect(wrapperCode).toContain('wrappedTest');
    expect(wrapperCode).toContain('currentTestId');
    expect(wrapperCode).toContain('mutantCoverage');
    expect(wrapperCode).toContain('perTest');
  });

  test('should generate proper mutant tracking code', () => {
    // Access private method through type assertion
    interface GeneratorWithPrivates {
      getMutantTrackingCode(): string;
    }
    const generatorWithPrivates = generator as unknown as GeneratorWithPrivates;
    const trackingCode = generatorWithPrivates.getMutantTrackingCode();
    
    expect(trackingCode).toContain('Hook is loaded');
    expect(trackingCode).toContain('Stryker\'s instrumentation will handle coverage tracking');
    expect(trackingCode).toContain('currentTestId');
  });

  test('should create hook file multiple times with same path', async () => {
    // Mock fs operations
    const mockMkdir = spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    const mockWriteFile = spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    
    const hookPath1 = await generator.createHookFile();
    const hookPath2 = await generator.createHookFile();
    
    expect(hookPath1).toBe(hookPath2);
    
    // Verify writeFile was called twice
    expect(mockWriteFile).toHaveBeenCalledTimes(2);
    
    // Restore mocks
    mockMkdir.mockRestore();
    mockWriteFile.mockRestore();
  });

  test('should handle errors during cleanup gracefully', async () => {
    // Mock fs operations
    const mockMkdir = spyOn(fs, 'mkdir').mockResolvedValue(undefined);
    const mockWriteFile = spyOn(fs, 'writeFile').mockResolvedValue(undefined);
    const mockUnlink = spyOn(fs, 'unlink').mockRejectedValue(new Error('File not found'));
    
    await generator.createHookFile();
    
    // Cleanup should not throw even if unlink fails
    await expect(generator.cleanup()).resolves.toBeUndefined();
    
    // Restore mocks
    mockMkdir.mockRestore();
    mockWriteFile.mockRestore();
    mockUnlink.mockRestore();
  });
});