# API Documentation

## Table of Contents

- [BunTestRunner](#buntestrunner)
- [BunTestAdapter](#buntestadapter)
- [BunResultParser](#bunresultparser)
- [Coverage System](#coverage-system)
- [Configuration Options](#configuration-options)
- [Types and Interfaces](#types-and-interfaces)

## BunTestRunner

The main test runner class that implements the StrykerJS TestRunner interface.

### Class: `BunTestRunner`

```typescript
class BunTestRunner implements TestRunner
```

#### Constructor

```typescript
constructor(logger: Logger, options: StrykerOptions)
```

**Parameters:**
- `logger`: StrykerJS logger instance for debugging and error reporting
- `options`: StrykerJS options containing the `bun` configuration

#### Methods

##### `capabilities()`

Returns the capabilities of the test runner.

```typescript
capabilities(): TestRunnerCapabilities
```

**Returns:**
```typescript
{
  reloadEnvironment: true
}
```

##### `init()`

Initializes the test runner and validates Bun installation.

```typescript
async init(): Promise<void>
```

**Throws:**
- Error if Bun is not installed
- Error if Bun version is < 1.0.0

##### `dryRun(options)`

Performs a dry run to discover all tests and optionally collect coverage.

```typescript
async dryRun(options: DryRunOptions): Promise<DryRunResult>
```

**Parameters:**
- `options.timeout`: Maximum time for the dry run
- `options.coverageAnalysis`: Coverage analysis mode ('off', 'all', 'perTest')

**Returns:**
- `CompleteDryRunResult` on success with test results and optional coverage
- `TimeoutDryRunResult` if the run times out
- `ErrorDryRunResult` if an error occurs

##### `mutantRun(options)`

Runs tests with a specific mutant activated.

```typescript
async mutantRun(options: MutantRunOptions): Promise<MutantRunResult>
```

**Parameters:**
- `options.activeMutant`: The mutant to activate
- `options.timeout`: Maximum time for the test run
- `options.testFilter`: Optional array of test IDs to run

**Returns:**
- `KilledMutantRunResult` if tests fail (mutant is killed)
- `SurvivedMutantRunResult` if all tests pass
- `TimeoutMutantRunResult` if the run times out

##### `dispose()`

Cleans up resources used by the test runner.

```typescript
async dispose(): Promise<void>
```

## BunTestAdapter

Manages communication with the Bun test process.

### Class: `BunTestAdapter`

```typescript
class BunTestAdapter
```

#### Constructor

```typescript
constructor(logger: Logger, options: BunTestRunnerOptions)
```

#### Methods

##### `init()`

Initializes the adapter and creates coverage hook file if needed.

```typescript
async init(): Promise<void>
```

##### `runTests(testFiles, options)`

Executes Bun tests with the specified options.

```typescript
async runTests(testFiles: string[], options: BunRunOptions): Promise<BunTestResult>
```

**Parameters:**
- `testFiles`: Array of test file patterns
- `options`: Runtime options including timeout, bail, coverage, etc.

**Returns:**
- Test results including passed/failed counts and optional coverage data

##### `getCoverageCollector()`

Returns the coverage collector instance.

```typescript
getCoverageCollector(): MutantCoverageCollector
```

##### `dispose()`

Cleans up resources including coverage hook file.

```typescript
async dispose(): Promise<void>
```

## BunResultParser

Parses Bun test output into structured results.

### Class: `BunResultParser`

```typescript
class BunResultParser
```

#### Methods

##### `parse(output)`

Parses Bun test output string into structured results.

```typescript
parse(output: string): BunTestResult
```

**Parameters:**
- `output`: Raw text output from Bun test command

**Returns:**
- Parsed test results with individual test status and counts

## Coverage System

### MutantCoverageCollector

Collects and manages coverage data during test runs.

```typescript
class MutantCoverageCollector
```

#### Methods

##### `init()`

Initializes the coverage collector.

```typescript
async init(): Promise<void>
```

##### `startCoverage()`

Starts collecting coverage data.

```typescript
startCoverage(): void
```

##### `stopCoverage()`

Stops coverage collection and returns results.

```typescript
stopCoverage(): CoverageResult
```

##### `toMutantCoverage(coverage)`

Converts raw coverage data to StrykerJS MutantCoverage format.

```typescript
toMutantCoverage(coverage: RawCoverageData): MutantCoverage
```

### TestFilter

Filters tests based on mutant coverage information.

```typescript
class TestFilter
```

#### Static Methods

##### `getTestsForMutant(mutant, coverage)`

Gets test IDs that cover a specific mutant.

```typescript
static getTestsForMutant(mutant: Mutant, coverage?: MutantCoverage): string[]
```

##### `shouldRunAllTests(mutant, coverage)`

Determines if all tests should run for a mutant.

```typescript
static shouldRunAllTests(mutant: Mutant, coverage?: MutantCoverage): boolean
```

##### `createTestNamePattern(testIds)`

Creates a regex pattern for filtering tests by ID.

```typescript
static createTestNamePattern(testIds: string[]): string | undefined
```

## Configuration Options

### BunTestRunnerOptions

Configuration options for the Bun test runner.

```typescript
interface BunTestRunnerOptions {
  /**
   * Pattern(s) of test files to run
   * @default ["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}"]
   */
  testFiles?: string[];

  /**
   * Timeout per test in milliseconds
   * @default 5000
   */
  timeout?: number;

  /**
   * Stop running tests after the first failure
   * @default false
   */
  bail?: boolean;

  /**
   * Additional arguments to pass to the bun process
   */
  nodeArgs?: string[];

  /**
   * Environment variables to set when running tests
   */
  env?: Record<string, string>;

  /**
   * Custom command to run instead of 'bun test'
   */
  command?: string;

  /**
   * Coverage analysis setting
   */
  coverageAnalysis?: 'off' | 'all' | 'perTest';
}
```

## Types and Interfaces

### BunTestResult

Result structure from running Bun tests.

```typescript
interface BunTestResult {
  tests: BunTestResultData[];
  passed: number;
  failed: number;
  total: number;
  duration?: number;
  failedTests?: BunTestResultData[];
  coverage?: CoverageResult;
}
```

### BunTestResultData

Individual test result data.

```typescript
interface BunTestResultData {
  id?: string;
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
}
```

### BunRunOptions

Options for running tests.

```typescript
interface BunRunOptions {
  timeout?: number;
  bail?: boolean;
  env?: Record<string, string>;
  activeMutant?: number;
  coverage?: boolean;
  testNamePattern?: string;
  testFilter?: string[];
}
```

## Usage Examples

### Basic Configuration

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    "testFiles": ["**/*.test.ts"],
    "timeout": 30000
  }
}
```

### Advanced Configuration

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "coverageAnalysis": "perTest",
  "bun": {
    "testFiles": ["src/**/*.test.ts", "!src/**/*.integration.test.ts"],
    "timeout": 60000,
    "bail": true,
    "nodeArgs": ["--max-old-space-size=4096"],
    "env": {
      "NODE_ENV": "test",
      "DEBUG": "stryker:*"
    }
  }
}
```

### Custom Command

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    "command": "bun test --coverage --reporter json"
  }
}
```