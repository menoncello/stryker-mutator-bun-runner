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

### Development Roadmap

Current state: Phase 2 (Optimizations) - Coverage analysis and test filtering implemented
- ✅ Phase 1: Basic test execution (completed)
- ✅ Phase 2: Coverage analysis, test filtering (completed)
- 🚧 Phase 3: Process reuse, watch mode, snapshot testing
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

### ESLint Guidelines

When writing code, follow these ESLint rules to avoid common errors:

1. **No unused variables**: Prefix unused variables with underscore (_) or remove them
2. **No explicit `any` types**: Use proper type assertions with `unknown` as intermediate:
   ```typescript
   // Bad
   const obj = someValue as any;
   
   // Good
   const obj = someValue as unknown as SpecificType;
   ```
3. **Use const for variables that are never reassigned**
4. **No unused function parameters**: Prefix with underscore (_) if needed:
   ```typescript
   // Bad
   function handler(data, error) { /* only uses data */ }
   
   // Good
   function handler(data, _error) { /* only uses data */ }
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