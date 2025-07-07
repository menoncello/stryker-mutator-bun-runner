# StrykerJS Test Runner for Bun

## Overview

This document describes the architecture and implementation of a custom test runner to integrate StrykerJS with Bun, enabling mutation testing execution in projects that use Bun as their JavaScript runtime.

## Motivation

- **Bun** is a fast JavaScript runtime with integrated test runner
- **StrykerJS** is a mutation testing tool that needs a test runner to execute tests
- Currently there is no official integration between StrykerJS and Bun
- The standard solution using `command` test runner has performance penalty

## Proposed Architecture

### 1. Plugin Structure

```
stryker-bun-runner/
├── src/
│   ├── BunTestRunner.ts          # Main test runner class
│   ├── BunTestRunnerOptions.ts   # Types and configuration options
│   ├── BunTestAdapter.ts         # Adapter for Bun communication
│   ├── BunResultParser.ts        # Bun results parser
│   └── index.ts                  # Plugin entry point
├── test/
│   ├── unit/                     # Unit tests
│   └── integration/              # Integration tests
├── package.json
├── tsconfig.json
└── README.md
```

### 2. TestRunner Interface

The plugin must implement the `TestRunner` interface from StrykerJS:

```typescript
import {
  TestRunner,
  DryRunResult,
  DryRunOptions,
  MutantRunOptions,
  MutantRunResult,
  TestRunnerCapabilities
} from '@stryker-mutator/api/test-runner';

export class BunTestRunner implements TestRunner {
  private bunProcess: ChildProcess | null = null;

  constructor(private options: BunTestRunnerOptions) {}

  public async init(): Promise<void> {
    // Validate Bun installation
    // Configure test environment
  }

  public async dryRun(options: DryRunOptions): Promise<DryRunResult> {
    // Execute all tests without mutations
    // Collect coverage if enabled
    // Return result with test list
  }

  public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
    // Activate specific mutant
    // Execute only relevant tests
    // Return if mutant was killed, survived or timeout
  }

  public async dispose(): Promise<void> {
    // Clean up resources
    // Terminate Bun processes
  }

  public capabilities(): TestRunnerCapabilities {
    return { reloadEnvironment: true };
  }
}
```

### 3. Bun Integration

#### 3.1 Test Execution

```typescript
class BunTestAdapter {
  async runTests(
    testFiles: string[],
    options: BunRunOptions
  ): Promise<BunTestResult> {
    const args = ['test'];

    // Add specific files
    if (testFiles.length > 0) {
      args.push(...testFiles);
    }

    // Add Bun options
    if (options.timeout) {
      args.push('--timeout', options.timeout.toString());
    }

    if (options.bail) {
      args.push('--bail');
    }

    // Execute Bun
    const result = await execa('bun', args, {
      env: {
        ...process.env,
        __STRYKER_ACTIVE_MUTANT__: options.activeMutant?.toString()
      }
    });

    return this.parseResult(result);
  }
}
```

#### 3.2 Mutant Activation

To activate specific mutants during tests:

```typescript
// In code being tested
declare global {
  interface Window {
    __stryker__: {
      activeMutant: number;
    };
  }
}

// Hook to activate mutant
if (typeof globalThis.__stryker__ !== 'undefined') {
  const activeMutant = globalThis.__stryker__.activeMutant;
  // Mutant activation logic
}
```

### 4. Coverage Analysis

For better performance, implement coverage analysis:

```typescript
interface BunCoverageCollector {
  async collectCoverage(testResult: BunTestResult): Promise<MutantCoverage> {
    // Extract coverage information from Bun
    // Map to format expected by Stryker
    return {
      perTest: {
        [testId]: {
          [mutantId]: true
        }
      }
    };
  }
}
```

### 5. Configuration

#### 5.1 Stryker Configuration

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    "testFiles": ["**/*.test.{js,ts,jsx,tsx}"],
    "timeout": 10000,
    "bail": false,
    "coverageAnalysis": "perTest",
    "nodeArgs": ["--no-warnings"]
  }
}
```

#### 5.2 Plugin Options

```typescript
interface BunTestRunnerOptions {
  testFiles?: string[]; // Test file patterns
  timeout?: number; // Timeout per test in ms
  bail?: boolean; // Stop on first failure
  coverageAnalysis?: 'off' | 'all' | 'perTest';
  nodeArgs?: string[]; // Additional arguments for Bun
  env?: Record<string, string>; // Environment variables
}
```

## Detailed Implementation

### 1. DryRun Implementation

```typescript
public async dryRun(options: DryRunOptions): Promise<DryRunResult> {
  try {
    // Execute all tests
    const testResult = await this.bunAdapter.runTests([], {
      timeout: options.timeout,
      coverage: options.coverageAnalysis !== 'off'
    });

    // Process results
    const tests = testResult.tests.map(test => ({
      id: test.id,
      name: test.name,
      timeSpentMs: test.duration,
      status: this.mapTestStatus(test.status)
    }));

    // Collect coverage if enabled
    let mutantCoverage = undefined;
    if (options.coverageAnalysis !== 'off') {
      mutantCoverage = await this.coverageCollector.collect(testResult);
    }

    return {
      status: DryRunStatus.Complete,
      tests,
      mutantCoverage
    };
  } catch (error) {
    return {
      status: DryRunStatus.Error,
      errorMessage: error.message
    };
  }
}
```

### 2. MutantRun Implementation

```typescript
public async mutantRun(options: MutantRunOptions): Promise<MutantRunResult> {
  try {
    // Configure environment with active mutant
    const env = {
      __STRYKER_ACTIVE_MUTANT__: options.activeMutant.id.toString()
    };

    // Execute only relevant tests
    const testFiles = options.testFilter || [];
    const testResult = await this.bunAdapter.runTests(testFiles, {
      timeout: options.timeout,
      bail: true,
      env
    });

    // Determine mutant result
    if (testResult.failed > 0) {
      return {
        status: MutantRunStatus.Killed,
        failedTests: testResult.failedTests.map(t => t.name),
        nrOfTests: testResult.total
      };
    }

    return {
      status: MutantRunStatus.Survived,
      nrOfTests: testResult.total
    };
  } catch (error) {
    if (error.timedOut) {
      return {
        status: MutantRunStatus.Timeout
      };
    }
    throw error;
  }
}
```

### 3. Result Parser

```typescript
class BunResultParser {
  parse(output: string): BunTestResult {
    // Parse Bun test output
    // Expected format: TAP or JSON
    const lines = output.split('\n');
    const tests: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const line of lines) {
      if (line.startsWith('✓')) {
        // Test passed
        const match = /✓ (.+) \((\d+)ms\)/.exec(line);
        if (match) {
          tests.push({
            name: match[1],
            status: 'passed',
            duration: parseInt(match[2])
          });
          passed++;
        }
      } else if (line.startsWith('✗')) {
        // Test failed
        const match = /✗ (.+)/.exec(line);
        if (match) {
          tests.push({
            name: match[1],
            status: 'failed'
          });
          failed++;
        }
      }
    }

    return {
      tests,
      passed,
      failed,
      total: passed + failed
    };
  }
}
```

## Performance Optimizations

### 1. Process Reuse

Keep Bun process alive between executions when possible:

```typescript
class BunProcessPool {
  private processes: Map<string, ChildProcess> = new Map();

  async getProcess(workerId: string): Promise<ChildProcess> {
    if (!this.processes.has(workerId)) {
      const process = spawn('bun', ['test', '--watch'], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc']
      });
      this.processes.set(workerId, process);
    }
    return this.processes.get(workerId)!;
  }
}
```

### 2. Test Filtering

Execute only tests that cover the mutant:

```typescript
function filterTestsForMutant(
  mutant: Mutant,
  coverage: MutantCoverage
): string[] {
  const coveringTests = [];

  for (const [testId, mutants] of Object.entries(coverage.perTest)) {
    if (mutants[mutant.id]) {
      coveringTests.push(testId);
    }
  }

  return coveringTests;
}
```

### 3. Parallel Execution

Leverage StrykerJS concurrency:

```typescript
public capabilities(): TestRunnerCapabilities {
  return {
    reloadEnvironment: false,  // Reuse environment when possible
    concurrent: true           // Supports parallel execution
  };
}
```

## Error Handling

### 1. Environment Validation

```typescript
async validateBunInstallation(): Promise<void> {
  try {
    const { stdout } = await execa('bun', ['--version']);
    if (!semver.gte(stdout.trim(), '1.0.0')) {
      throw new Error('Bun version 1.0.0 or higher required');
    }
  } catch (error) {
    throw new Error('Bun not found. Please install Bun: https://bun.sh');
  }
}
```

### 2. Timeouts

```typescript
async runWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError()), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}
```

## Usage Example

### 1. Installation

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner
```

### 2. Configuration (stryker.config.json)

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "bun": {
    "testFiles": ["**/*.test.ts"],
    "timeout": 30000,
    "coverageAnalysis": "perTest"
  },
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}
```

### 3. Execution

```bash
npx stryker run
```

## Development Roadmap

### Phase 1: MVP (2-3 weeks)

- [ ] Implement basic TestRunner
- [ ] Support for command runner
- [ ] Basic tests working

### Phase 2: Optimizations (2-3 weeks)

- [ ] Coverage analysis
- [ ] Test filtering
- [ ] Process reuse

### Phase 3: Advanced Features (3-4 weeks)

- [ ] Watch mode
- [ ] Snapshot testing
- [ ] Source maps support
- [ ] Custom reporter

### Phase 4: Polish (1-2 weeks)

- [ ] Complete documentation
- [ ] Examples
- [ ] CI/CD
- [ ] NPM publication

## Technical Considerations

### 1. Compatibility

- Bun >= 1.0.0
- StrykerJS >= 7.0.0
- Node.js >= 16 (for StrykerJS)

### 2. Known Limitations

- Coverage analysis may have initial overhead
- Some Jest features may not be supported
- TypeScript file mutations require transpilation

### 3. Considered Alternatives

- Use command runner (simple but slow)
- Fork Jest runner (complex due to differences)
- Wrapper over Node.js test runner (limited)

## Conclusion

This design provides an efficient integration between StrykerJS and Bun, leveraging the capabilities of both tools. The implementation focused on performance and compatibility will allow projects using Bun to benefit from mutation testing without sacrificing speed.
