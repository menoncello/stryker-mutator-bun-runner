# API Documentation

## Table of Contents

- [Plugin Exports](#plugin-exports)
- [BunTestRunner](#buntestrunner)
- [BunTestAdapter](#buntestadapter)
- [BunResultParser](#bunresultparser)
- [Coverage System](#coverage-system)
- [Process Pool System](#process-pool-system)
- [Source Map Support](#source-map-support)
- [Configuration Options](#configuration-options)
- [Types and Interfaces](#types-and-interfaces)

## Plugin Exports

The plugin exports the following from its main entry point:

### strykerPlugins

Array of StrykerJS plugin declarations:

```typescript
export const strykerPlugins = [
  declareClassPlugin(PluginKind.TestRunner, 'bun', BunTestRunner)
];
```

### strykerValidationSchema

JSON schema for validating the `bun` configuration options:

```typescript
export const strykerValidationSchema = {
  properties: {
    bun: {
      title: 'BunTestRunnerOptions',
      description: 'Configuration options for the Bun test runner plugin',
      type: 'object',
      properties: {
        // ... configuration properties
      }
    }
  }
};
```

This schema is used by StrykerJS to validate configuration and provide IDE support.

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

##### `resetInstanceCount()` (static)

Resets the static instance counter. Useful for testing and debugging.

```typescript
static resetInstanceCount(): void
```

**Note**: This method is primarily for internal use and testing.

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

##### `extractFailedTestDetails(output)`

Extracts detailed error information from failed tests.

```typescript
extractFailedTestDetails(output: string): BunTestResultData[]
```

## Coverage System

### MutantCoverageCollector

Collects and manages coverage data during test runs.

```typescript
class MutantCoverageCollector implements ICoverageCollector
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
toMutantCoverage(coverage: BunCoverageData): MutantCoverage
```

##### `dispose()`

Cleans up coverage collection resources.

```typescript
async dispose(): Promise<void>
```

### CoverageHookGenerator

Generates JavaScript hooks for coverage collection.

```typescript
class CoverageHookGenerator
```

#### Methods

##### `createHookFile()`

Creates a temporary hook file for coverage collection.

```typescript
async createHookFile(): Promise<string>
```

**Returns:** Path to the created hook file

##### `cleanup()`

Removes the temporary hook file.

```typescript
async cleanup(): Promise<void>
```

##### `generateHookContent()`

Generates the JavaScript content for the coverage hook.

```typescript
generateHookContent(): string
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

##### `filterTests(allTests, testIdsToRun)`

Filters a list of tests to only include specified IDs.

```typescript
static filterTests(allTests: TestResult[], testIdsToRun: string[]): TestResult[]
```

## Process Pool System

### BunProcessPool

Manages a pool of Bun worker processes for improved performance.

```typescript
class BunProcessPool
```

#### Constructor

```typescript
constructor(logger: Logger, options: ProcessPoolOptions)
```

**Parameters:**
- `logger`: Logger instance
- `options`: Pool configuration options

#### Methods

##### `runTests(args, runOptions)`

Executes tests using an available worker from the pool.

```typescript
async runTests(args: string[], runOptions: BunRunOptions): Promise<BunTestResult>
```

##### `dispose()`

Terminates all worker processes and cleans up resources.

```typescript
async dispose(): Promise<void>
```

### WorkerManager

Manages individual worker processes within the pool.

```typescript
class WorkerManager extends EventEmitter
```

#### Constructor

```typescript
constructor(logger: Logger, workerStartupTimeout?: number)
```

**Parameters:**
- `logger`: Logger instance for debugging and error reporting
- `workerStartupTimeout`: Timeout in milliseconds for worker startup (default: 5000)

#### Methods

##### `createWorker()`

Creates a new Bun worker process.

```typescript
async createWorker(): Promise<PooledProcess>
```

##### `terminateProcess(pooled)`

Gracefully terminates a worker process with a 1-second timeout before forcing SIGKILL.

```typescript
async terminateProcess(pooled: PooledProcess): Promise<void>
```

**Features:**
- Attempts graceful shutdown with SIGTERM
- Forces termination with SIGKILL after 1 second
- Automatically removes process from tracking
- Prevents zombie processes

##### `getProcesses()`

Returns the current map of active processes.

```typescript
getProcesses(): Map<string, PooledProcess>
```

### ProcessPoolSingleton

Singleton manager for the BunProcessPool to prevent multiple instances from being created.

```typescript
class ProcessPoolSingleton
```

#### Static Methods

##### `getInstance(logger, options)`

Returns the singleton instance of BunProcessPool. Creates it on first call.

```typescript
static getInstance(logger: Logger, options: ProcessPoolOptions): BunProcessPool
```

**Features:**
- Default maxWorkers increased to 8 for better performance
- Reference counting tracks active users
- Ensures only one process pool exists across all test runner instances

##### `release(logger)`

Decrements reference count and disposes the pool when count reaches 0.

```typescript
static async release(logger: Logger): Promise<void>
```

##### `forceDispose()`

Immediately disposes the pool regardless of reference count.

```typescript
static async forceDispose(): Promise<void>
```

##### `reset()`

Resets the singleton state. Useful for testing and cleanup.

```typescript
static reset(): void
```

**Note**: Does not dispose the existing instance - call forceDispose() first if needed.

### BunWorker

Worker script that runs in child processes.

```typescript
// Entry point for worker processes
process.on('message', (message: WorkerMessage) => {
  // Handle test execution requests
});
```

## Source Map Support

### SourceMapHandler

Handles source map resolution for accurate error reporting.

```typescript
class SourceMapHandler
```

#### Methods

##### `resolveSourceMap(fileName)`

Resolves source map for a given file.

```typescript
async resolveSourceMap(fileName: string): Promise<SourceMapConsumer | null>
```

##### `mapStackTrace(stackTrace)`

Maps a stack trace using available source maps.

```typescript
async mapStackTrace(stackTrace: string): Promise<string>
```

##### `extractStackFrames(stackTrace)`

Extracts individual stack frames from a trace.

```typescript
extractStackFrames(stackTrace: string): StackFrame[]
```

## Configuration Options

### BunTestRunnerOptions

Complete configuration options for the Bun test runner.

```typescript
interface BunTestRunnerOptions {
  /**
   * Pattern(s) of test files to run
   * @default ["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}"]
   */
  testFiles?: string[];

  /**
   * Timeout per test in milliseconds
   * @default 10000
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

  /**
   * Enable process pooling for improved performance
   * @default true
   */
  processPool?: boolean;

  /**
   * Maximum number of worker processes
   * @default 4
   */
  maxWorkers?: number;

  /**
   * Enable watch mode for continuous testing
   * @default false
   */
  watchMode?: boolean;

  /**
   * Update snapshots during test runs
   * @default false
   */
  updateSnapshots?: boolean;
}
```

### ProcessPoolOptions

Options for configuring the process pool.

```typescript
interface ProcessPoolOptions {
  /**
   * Maximum number of worker processes
   * @default 4
   */
  maxWorkers?: number;

  /**
   * Timeout for worker operations in milliseconds
   * @default 60000
   */
  timeout?: number;

  /**
   * Time before idle workers are terminated in milliseconds
   * @default 30000
   */
  idleTimeout?: number;

  /**
   * Enable watch mode for continuous test execution
   * @default false
   */
  watchMode?: boolean;
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
  updateSnapshots?: boolean;
}
```

### CoverageResult

Coverage collection result.

```typescript
interface CoverageResult {
  coverage: BunCoverageData;
  elapsedMs: number;
}
```

### BunCoverageData

Raw coverage data structure.

```typescript
interface BunCoverageData {
  perTest: Record<string, Set<string>>;
  executedLines: Record<string, number[]>;
}
```

### PooledProcess

Represents a worker process in the pool.

```typescript
interface PooledProcess {
  id: string;
  process: ChildProcess;
  busy: boolean;
  lastUsed: number;
}
```

### WorkerMessage

Message structure for worker communication.

```typescript
interface WorkerMessage {
  id?: string;
  type: 'run' | 'ready' | 'result' | 'error';
  args?: string[];
  options?: BunRunOptions;
  result?: BunTestResult;
  error?: string;
}
```

### StackFrame

Represents a single frame in a stack trace.

```typescript
interface StackFrame {
  functionName?: string;
  fileName: string;
  lineNumber: number;
  columnNumber: number;
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

### Advanced Configuration with Process Pool

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "coverageAnalysis": "perTest",
  "bun": {
    "testFiles": ["src/**/*.test.ts"],
    "timeout": 60000,
    "bail": true,
    "processPool": true,
    "maxWorkers": 8,
    "nodeArgs": ["--max-old-space-size=4096"],
    "env": {
      "NODE_ENV": "test",
      "DEBUG": "stryker:*"
    }
  }
}
```

### Watch Mode Configuration

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    "watchMode": true,
    "processPool": true,
    "maxWorkers": 2,
    "testFiles": ["**/*.test.ts"]
  }
}
```

### Snapshot Testing Configuration

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    "updateSnapshots": false,
    "testFiles": ["**/*.snapshot.test.ts"]
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

## Error Handling

The test runner provides comprehensive error handling:

- **Timeout Errors**: Automatically detected and reported as `TimeoutDryRunResult` or `TimeoutMutantRunResult`
- **Process Errors**: Worker process crashes are caught and reported with details
- **Source Map Errors**: Gracefully falls back to original stack traces if source maps fail
- **Coverage Errors**: Coverage collection failures don't fail the test run

## Performance Considerations

1. **Process Pool**: Enable `processPool` for significant performance improvements
2. **Coverage Analysis**: Use `perTest` coverage to reduce test execution by 80-90%
3. **Worker Count**: Adjust `maxWorkers` based on your CPU cores and test characteristics
4. **Timeout Configuration**: Set appropriate timeouts to avoid false positives
5. **Test Filtering**: Use specific file patterns to avoid running unnecessary tests

## Debugging

Enable debug logging with:

```json
{
  "logLevel": "debug"
}
```

Or via environment variable:
```bash
DEBUG=stryker:* npx stryker run
```