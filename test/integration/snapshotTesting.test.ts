import { test, expect, describe, beforeEach } from 'bun:test';
import { BunTestAdapter } from '../../src/BunTestAdapter.js';
import { Logger } from '@stryker-mutator/api/logging';
import { BunTestRunnerOptions } from '../../src/BunTestRunnerOptions.js';

type TestableAdapter = {
  buildBunArgs: (files: string[], options: unknown) => Promise<string[]>;
};

describe('Snapshot Testing', () => {
  let adapter: BunTestAdapter;
  let logger: Logger;
  
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
  });
  
  test('should add --update-snapshots flag when updateSnapshots is true', async () => {
    const options: BunTestRunnerOptions = {
      updateSnapshots: true
    };
    
    adapter = new BunTestAdapter(logger, options);
    
    // Test that the buildBunArgs method includes the flag
    const testableAdapter = adapter as unknown as TestableAdapter;
    const args = await testableAdapter.buildBunArgs([], { updateSnapshots: true });
    
    expect(args).toContain('--update-snapshots');
    
    await adapter.dispose();
  });
  
  test('should not add --update-snapshots flag when updateSnapshots is false', async () => {
    const options: BunTestRunnerOptions = {
      updateSnapshots: false
    };
    
    adapter = new BunTestAdapter(logger, options);
    
    const testableAdapter = adapter as unknown as TestableAdapter;
    const args = await testableAdapter.buildBunArgs([], { updateSnapshots: false });
    
    expect(args).not.toContain('--update-snapshots');
    
    await adapter.dispose();
  });
  
  test('should respect global updateSnapshots option', async () => {
    const options: BunTestRunnerOptions = {
      updateSnapshots: true
    };
    
    adapter = new BunTestAdapter(logger, options);
    
    // Even without passing updateSnapshots in run options, it should use global setting
    const testableAdapter = adapter as unknown as TestableAdapter;
    const args = await testableAdapter.buildBunArgs([], {});
    
    expect(args).toContain('--update-snapshots');
    
    await adapter.dispose();
  });
  
  test('should prioritize run options over global options', async () => {
    const options: BunTestRunnerOptions = {
      updateSnapshots: false
    };
    
    adapter = new BunTestAdapter(logger, options);
    
    // Run options should override global options
    const testableAdapter = adapter as unknown as TestableAdapter;
    const args = await testableAdapter.buildBunArgs([], { updateSnapshots: true });
    
    expect(args).toContain('--update-snapshots');
    
    await adapter.dispose();
  });
});