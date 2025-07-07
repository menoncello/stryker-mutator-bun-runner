# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development Commands

```bash
# Build the TypeScript project
npm run build

# Watch mode for development
npm run build:watch

# Run tests with Bun
npm test

# Run tests in watch mode
npm test -- --watch

# Run a single test file
bun test test/BunResultParser.test.ts

# Lint the codebase
npm run lint

# Run code analysis (duplicate detection, circular dependencies)
npm run analyze
# Note: analyze:deps requires Graphviz for dependency diagrams
```

### Testing the Plugin

```bash
# Build first (required before testing example)
npm run build

# Test in the example project
cd example
npm install
npx stryker run
```

### Code Analysis Commands

```bash
# Run all analysis tools
npm run analyze

# Check for duplicate code
npm run analyze:duplication

# Check for circular dependencies
npm run analyze:complexity

# Generate dependency diagram (requires Graphviz)
npm run analyze:deps

# Check bundle size
npm run analyze:size
```

### Installing Optional Dependencies

```bash
# Install Graphviz for dependency visualization (optional)
# macOS
brew install graphviz

# Ubuntu/Debian
sudo apt-get install graphviz

# Windows
# Download from https://graphviz.org/download/
```

## Architecture Overview

This is a StrykerJS test runner plugin that enables Bun as a test runner for mutation testing. The plugin implements the StrykerJS TestRunner interface and communicates with the Bun runtime to execute tests.

### Core Components

1. **BunTestRunner** (`src/BunTestRunner.ts`)
   - Main plugin class implementing the StrykerJS TestRunner interface
   - Handles lifecycle methods: `init()`, `dryRun()`, `mutantRun()`, `dispose()`
   - Uses dependency injection pattern with StrykerJS tokens
   - Validates Bun installation during initialization

2. **BunTestAdapter** (`src/BunTestAdapter.ts`)
   - Manages communication with the Bun process
   - Builds command-line arguments for Bun execution
   - Handles environment variables including mutant activation via `__STRYKER_ACTIVE_MUTANT__`
   - Executes tests using `execa` for process management

3. **BunResultParser** (`src/BunResultParser.ts`)
   - Parses Bun test output (supports ✓, ✗, ⏭ markers)
   - Extracts test results, durations, and failure information
   - Converts Bun output format to StrykerJS TestResult format
   - Supports source map resolution for error stack traces

### Important Implementation Details

- **Import Paths**: The plugin uses explicit paths like `@stryker-mutator/api/dist/src/test-runner` due to module resolution requirements
- **Test Results**: Must return properly typed TestResult unions (SuccessTestResult, FailedTestResult, SkippedTestResult)
- **Mutant Activation**: Uses environment variable `__STRYKER_ACTIVE_MUTANT__` to activate specific mutants during test runs
- **Timer**: Custom Timer class implementation since @stryker-mutator/util doesn't export Timer

### Configuration Schema

The plugin accepts configuration through the `bun` property in stryker.config.json:

- `testFiles`: Array of glob patterns for test files
- `timeout`: Test timeout in milliseconds
- `bail`: Stop on first failure
- `nodeArgs`: Additional Bun process arguments
- `env`: Custom environment variables
- `command`: Override default 'bun test' command
- `processPool`: Enable process pooling (default: true)
- `maxWorkers`: Maximum worker processes (default: 4)
- `watchMode`: Enable watch mode for continuous testing
- `updateSnapshots`: Update snapshots during test runs

### Development Roadmap

Current state: Phase 3 (Advanced Features) - Process pooling, watch mode, and snapshot testing completed

- ✅ Phase 1: Basic test execution (completed)
- ✅ Phase 2: Coverage analysis, test filtering (completed)
- ✅ Phase 3: Process reuse, watch mode, snapshot testing (completed)
- 🚧 Phase 4: Documentation, examples, NPM publication

The detailed roadmap is documented in STRYKER_BUN_RUNNER.md.

### Coverage System Architecture

The coverage system consists of:

1. **MutantCoverageCollector**: Manages coverage data collection during test runs
2. **TestFilter**: Filters tests based on mutant coverage to optimize execution
3. **Coverage Hook**: JavaScript file injected via --preload to track test execution

Coverage flow:

1. During dry run with coverageAnalysis enabled, a hook file is created
2. The hook wraps test functions to track which tests are executing
3. Mutants can call `__stryker__.trackMutant()` to register coverage
4. Coverage data is converted to StrykerJS MutantCoverage format
5. During mutant runs, only tests that cover the mutant are executed

### Process Pool Architecture (Phase 3)

The process pool system improves performance by reusing Bun worker processes:

1. **BunProcessPool**: Manages a pool of worker processes
2. **WorkerManager**: Handles worker lifecycle and communication
3. **BunWorker**: Worker process that executes test commands

Features:

- Configurable pool size with `maxWorkers` option
- Automatic cleanup of idle workers
- Support for watch mode with persistent processes
- Graceful error handling and recovery

### Source Map Support (Phase 3)

The plugin now includes automatic source map resolution:

1. **SourceMapHandler**: Resolves TypeScript/JSX stack traces to original source
2. Automatically detects and loads `.map` files
3. Caches source map consumers for performance
4. Provides accurate error locations in mutation reports

### ESLint Guidelines

When writing code, follow these ESLint rules to avoid common errors:

1. **No unused variables**: Prefix unused variables with underscore (\_) or remove them
2. **No explicit `any` types**: Use proper type assertions with `unknown` as intermediate:

   ```typescript
   // Bad
   const obj = someValue as any;

   // Good
   const obj = someValue as unknown as SpecificType;
   ```

3. **Use const for variables that are never reassigned**
4. **No unused function parameters**: Prefix with underscore (\_) if needed:

   ```typescript
   // Bad
   function handler(data, error) {
     /* only uses data */
   }

   // Good
   function handler(data, _error) {
     /* only uses data */
   }
   ```

5. **Type assertions for accessing private methods in tests**:
   ```typescript
   // Define interface for private methods
   interface ClassWithPrivates {
     privateMethod(): void;
   }
   // Use proper type assertion
   const instance = publicInstance as unknown as ClassWithPrivates;
   ```
6. **Run `npm run lint` before committing** to catch and fix any ESLint errors

## Code Quality Analysis (2025-07-07)

### Overall Assessment

The stryker-bun codebase demonstrates **high-quality software engineering** with:

- Clean architecture following SOLID principles
- Excellent TypeScript practices with strict mode and comprehensive typing
- Strong testing culture (2.1:1 test-to-code ratio)
- Minimal technical debt
- No significant code duplication
- Well-balanced file sizes (average ~155 lines)

### Architecture Insights

#### Design Patterns Implemented

- **Dependency Injection**: Token-based DI using StrykerJS framework
- **Adapter Pattern**: BunTestAdapter adapts Bun runtime to StrykerJS interface
- **Singleton Pattern**: ProcessPoolSingleton manages process pool lifecycle
- **Factory Pattern**: Worker creation in WorkerManager
- **Strategy Pattern**: Different coverage analysis strategies (off/all/perTest)

#### Dependency Structure

- **No circular dependencies** detected
- **Low coupling**: Most modules have 2-4 dependencies
- **High cohesion**: Each module has single, well-defined responsibility
- Clean dependency hierarchy with clear layers

### Security Considerations

#### Vulnerabilities Identified

1. **Command Injection Risk** (src/BunTestAdapter.ts:259-264)
   - Custom command option splits on spaces without validation
   - **Fix**: Implement whitelist validation for command options

2. **Path Traversal Risk**
   - Glob patterns use user input without boundary validation
   - **Fix**: Restrict patterns to project boundaries

3. **Resource Exhaustion**
   - No hard limits on process creation beyond maxWorkers
   - **Fix**: Add system resource checks before spawning

4. **Environment Variable Leakage**
   - All env vars passed to child processes without filtering
   - **Fix**: Implement allowlist/blocklist for env vars

#### Security Recommendations

- Add input validation for all user-provided options
- Implement secure temp file creation with random names
- Add IPC message validation in worker communication
- Filter sensitive environment variables

### Performance Analysis

#### Strengths

- Process pooling reduces creation overhead
- Async operations throughout prevent blocking
- Worker reuse with intelligent idle timeout (5 seconds)
- Source map caching for performance

#### Bottlenecks Identified

1. **O(n) Worker Search** (src/process/BunProcessPool.ts)
   - Sequential scan for available workers
   - **Fix**: Use queue data structure for O(1) lookup

2. **Polling Mechanism**
   - 100ms polling intervals for worker availability
   - **Fix**: Implement event-based notification

3. **Unbounded Output Buffers**
   - Worker output accumulates without limits
   - **Fix**: Implement streaming output processing

4. **Synchronous File Operations**
   - Coverage hook file creation blocks
   - **Fix**: Use async file operations

#### Performance Recommendations

- Pre-warm workers during idle time
- Implement output streaming for large test results
- Add request batching for multiple test runs
- Cache parsed test results for unchanged files

### Code Metrics

- **Total Source Lines**: 2,478
- **Total Test Lines**: 5,254 (excellent 2.1:1 ratio)
- **Code Coverage**: 97.91% (excellent coverage)
- **Largest File**: BunTestAdapter.ts (331 lines)
- **Average File Size**: ~155 lines
- **External Dependencies**: Minimal and well-justified

### High-Priority Action Items

1. **Security Hardening**
   - Implement command injection protection
   - Add environment variable filtering
   - Validate all user inputs

2. **Performance Optimization**
   - Replace O(n) worker search with O(1) queue
   - Implement output streaming
   - Add worker pre-warming

3. **Code Quality**
   - Maintain excellent 97.91% coverage
   - Continue comprehensive testing practices

4. **Refactoring Opportunities**
   - Break down large methods in BunTestAdapter
   - Extract parser strategies for different output formats
   - Consider Command pattern for test execution
