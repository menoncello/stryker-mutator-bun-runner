import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { SourceMapHandler } from '../../src/utils/SourceMapHandler.js';
import { Logger } from '@stryker-mutator/api/logging';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import * as path from 'path';

describe('Source Map Support', () => {
  let sourceMapHandler: SourceMapHandler;
  let logger: Logger;
  const testFile = path.join(__dirname, 'test.js');
  const sourceMapFile = path.join(__dirname, 'test.js.map');
  
  beforeEach(() => {
    logger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {},
      fatal: () => {},
      trace: () => {},
      isDebugEnabled: () => false,
      isInfoEnabled: () => false,
      isWarnEnabled: () => false,
      isErrorEnabled: () => false,
      isFatalEnabled: () => false,
      isTraceEnabled: () => false
    };
    
    sourceMapHandler = new SourceMapHandler(logger);
  });
  
  afterEach(async () => {
    await sourceMapHandler.dispose();
    
    // Clean up test files
    if (existsSync(testFile)) unlinkSync(testFile);
    if (existsSync(sourceMapFile)) unlinkSync(sourceMapFile);
  });
  
  test('should parse stack trace without source map', async () => {
    const stackTrace = `Error: Test error
    at testFunction (${testFile}:10:5)
    at Object.<anonymous> (${testFile}:20:1)`;
    
    const mapped = await sourceMapHandler.mapStackTrace(stackTrace);
    
    // Without source map, should return original
    expect(mapped).toBe(stackTrace);
  });
  
  test('should parse and map stack trace with source map', async () => {
    // Create a simple source map
    const sourceMap = {
      version: 3,
      sources: ['original.ts'],
      names: [],
      mappings: 'AAAA',
      file: 'test.js'
    };
    
    writeFileSync(sourceMapFile, JSON.stringify(sourceMap));
    
    const stackTrace = `Error: Test error
    at testFunction (${testFile}:1:1)`;
    
    const mapped = await sourceMapHandler.mapStackTrace(stackTrace);
    
    // Should map to original source
    expect(mapped).toContain('original.ts');
  });
  
  test('should handle malformed stack traces gracefully', async () => {
    const malformedStackTrace = `This is not a valid stack trace
    Random text here
    More random text`;
    
    const mapped = await sourceMapHandler.mapStackTrace(malformedStackTrace);
    
    // Should return original text when can't parse
    expect(mapped).toBe(malformedStackTrace);
  });
  
  test('should extract stack frames correctly', async () => {
    const testableHandler = sourceMapHandler as unknown as { parseStackFrame: (line: string) => unknown };
    const frame = testableHandler.parseStackFrame('    at testFunction (file.js:10:5)');
    
    expect(frame).toEqual({
      functionName: 'testFunction',
      file: 'file.js',
      line: 10,
      column: 5
    });
  });
  
  test('should handle stack frames without function names', async () => {
    const testableHandler = sourceMapHandler as unknown as { parseStackFrame: (line: string) => unknown };
    const frame = testableHandler.parseStackFrame('    at file.js:10:5');
    
    expect(frame).toEqual({
      file: 'file.js',
      line: 10,
      column: 5
    });
  });
  
  test('should cache source map consumers', async () => {
    writeFileSync(sourceMapFile, JSON.stringify({
      version: 3,
      sources: ['original.ts'],
      names: [],
      mappings: 'AAAA',
      file: 'test.js'
    }));
    
    // First call - loads source map
    await sourceMapHandler.mapStackFrame({
      file: testFile,
      line: 1,
      column: 1
    });
    
    // Second call - should use cached consumer
    await sourceMapHandler.mapStackFrame({
      file: testFile,
      line: 2,
      column: 1
    });
    
    // Cache should have one entry
    const testableHandler = sourceMapHandler as unknown as { sourceMapCache: Map<string, unknown> };
    expect(testableHandler.sourceMapCache.size).toBe(1);
  });
});