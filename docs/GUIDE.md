# Stryker Bun Runner Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Setup](#basic-setup)
4. [Configuration](#configuration)
5. [Performance Optimization](#performance-optimization)
6. [Advanced Features](#advanced-features)
7. [Common Use Cases](#common-use-cases)
8. [Migration Guide](#migration-guide)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Introduction

The Stryker Bun Runner is a test runner plugin that enables [Bun](https://bun.sh) to work with [StrykerJS](https://stryker-mutator.io), the JavaScript mutation testing framework. This guide will help you get started and make the most of mutation testing with Bun's fast runtime.

### What is Mutation Testing?

Mutation testing helps you test your tests by introducing small changes (mutations) to your code and checking if your tests catch these changes. It's a powerful way to ensure your test suite is robust and comprehensive.

### Why Use Bun?

Bun is a fast JavaScript runtime that offers:
- ⚡ Lightning-fast test execution
- 📦 Built-in TypeScript and JSX support
- 🔧 Native test runner with minimal configuration
- 🚀 Excellent performance for mutation testing

### What's New in v0.3.0

- **Process Pool**: Reuse Bun processes for 2-3x faster execution
- **Watch Mode**: Real-time mutation testing during development
- **Snapshot Testing**: Full support for Bun's snapshot features
- **Source Map Support**: Accurate error reporting for TypeScript
- **100% Test Coverage**: Thoroughly tested and production-ready

## Installation

### Prerequisites

Before installing, ensure you have:
- Node.js >= 20.0.0
- Bun >= 1.0.0
- npm or yarn

### Install Bun

```bash
# macOS and Linux
curl -fsSL https://bun.sh/install | bash

# Windows (WSL)
curl -fsSL https://bun.sh/install | bash

# Via npm
npm install -g bun
```

### Install Dependencies

```bash
# Install StrykerJS and the Bun runner
npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner

# Or with yarn
yarn add --dev @stryker-mutator/core @stryker-mutator/bun-runner

# Or with pnpm
pnpm add -D @stryker-mutator/core @stryker-mutator/bun-runner
```

### Verify Installation

```bash
# Check Bun version
bun --version

# Check StrykerJS installation
npx stryker --version
```

## Basic Setup

### 1. Create Configuration File

Create a `stryker.config.json` in your project root:

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["src/**/*.js", "src/**/*.ts", "!src/**/*.test.*"],
  "reporters": ["html", "clear-text", "progress"]
}
```

### 2. Run Your First Mutation Test

```bash
npx stryker run
```

This will:
1. Discover your test files
2. Create mutations in your source code
3. Run tests against each mutation
4. Generate a report showing which mutations survived

### 3. View Results

Open `reports/mutation/mutation.html` in your browser to see detailed results.

## Configuration

### Basic Options

The `bun` configuration object supports these options:

```json
{
  "bun": {
    "testFiles": ["**/*.test.ts"],
    "timeout": 30000,
    "bail": false
  }
}
```

#### Option Details

- **testFiles** (string[]): Glob patterns for test files
  - Default: `["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}"]`
  - Example: `["src/**/*.test.ts", "!src/**/*.integration.test.ts"]`

- **timeout** (number): Timeout per test in milliseconds
  - Default: `10000`
  - Increase for slower tests or CI environments

- **bail** (boolean): Stop on first test failure
  - Default: `false`
  - Set to `true` for faster feedback during development

### Advanced Options

```json
{
  "bun": {
    "nodeArgs": ["--max-old-space-size=4096"],
    "env": {
      "NODE_ENV": "test",
      "LOG_LEVEL": "error"
    },
    "command": "bun test --coverage",
    "processPool": true,
    "maxWorkers": 4,
    "watchMode": false,
    "updateSnapshots": false
  }
}
```

- **nodeArgs** (string[]): Arguments passed to the Bun process
- **env** (object): Environment variables for test execution
- **command** (string): Custom test command (overrides default behavior)
- **processPool** (boolean): Enable process pooling (default: true)
- **maxWorkers** (number): Maximum worker processes (default: 4)
- **watchMode** (boolean): Enable watch mode (default: false)
- **updateSnapshots** (boolean): Update snapshots during tests (default: false)

### Coverage Analysis

Enable coverage analysis for better performance:

```json
{
  "coverageAnalysis": "perTest",
  "bun": {
    "testFiles": ["**/*.test.ts"]
  }
}
```

Coverage modes:
- **off**: No coverage analysis (fastest initial run, slower mutations)
- **all**: Collect coverage for all tests together
- **perTest**: Track which tests cover which code (recommended)

## Performance Optimization

### 1. Enable Process Pool

The process pool reuses Bun worker processes, significantly improving performance:

```json
{
  "bun": {
    "processPool": true,
    "maxWorkers": 8
  }
}
```

Performance improvements:
- 2-3x faster mutation testing
- Reduced process startup overhead
- Better resource utilization

### 2. Use Coverage Analysis

Coverage analysis significantly improves performance by only running tests that cover mutated code:

```json
{
  "coverageAnalysis": "perTest"
}
```

With 100 tests and 1000 mutations:
- Without coverage: 100,000 test executions
- With coverage: ~10,000 test executions (90% reduction!)

### 3. Optimize Worker Count

Adjust `maxWorkers` based on your system:

```json
{
  "bun": {
    "maxWorkers": require('os').cpus().length
  }
}
```

Guidelines:
- CPU-bound tests: Use CPU count
- I/O-bound tests: Use 2x CPU count
- Memory-intensive tests: Use CPU count / 2

### 4. Optimize Test File Patterns

Be specific with test file patterns:

```json
{
  "bun": {
    "testFiles": [
      "src/**/*.test.ts",
      "!src/**/*.integration.test.ts",
      "!src/**/*.e2e.test.ts"
    ]
  }
}
```

### 5. Increase Timeout for CI

CI environments may need higher timeouts:

```json
{
  "bun": {
    "timeout": process.env.CI ? 60000 : 30000
  }
}
```

### 6. Use Bail in Development

For faster feedback during development:

```json
{
  "bun": {
    "bail": true
  }
}
```

## Advanced Features

### Process Pool

The process pool feature reuses Bun worker processes for improved performance:

```json
{
  "bun": {
    "processPool": true,
    "maxWorkers": 8
  }
}
```

Benefits:
- Eliminates process startup overhead
- Reduces memory usage
- Improves test execution speed by 2-3x

### Watch Mode

Enable watch mode for continuous mutation testing during development:

```json
{
  "bun": {
    "watchMode": true,
    "processPool": true,
    "maxWorkers": 2
  }
}
```

Run with:
```bash
npx stryker run --watch
```

Features:
- Automatically reruns mutations when files change
- Incrementally tests only affected code
- Real-time feedback during development

### Snapshot Testing

Full support for Bun's snapshot testing:

```json
{
  "bun": {
    "updateSnapshots": false,
    "testFiles": ["**/*.snapshot.test.ts"]
  }
}
```

To update snapshots during mutation testing:
```json
{
  "bun": {
    "updateSnapshots": true
  }
}
```

Or via command line:
```bash
npx stryker run -- --update-snapshots
```

### Source Map Support

Automatic source map resolution for TypeScript projects:

```json
{
  "bun": {
    "testFiles": ["src/**/*.test.ts"]
  }
}
```

Features:
- Accurate error locations in TypeScript files
- Proper stack traces for debugging
- Seamless integration with TypeScript projects

### Custom Test Commands

Use custom test commands for specialized setups:

```json
{
  "bun": {
    "command": "bun test:unit --coverage --reporter json"
  }
}
```

Examples:
```json
// Run specific test suite
{
  "bun": {
    "command": "bun test src/unit"
  }
}

// With custom reporter
{
  "bun": {
    "command": "bun test --reporter tap"
  }
}

// With coverage
{
  "bun": {
    "command": "bun test --coverage"
  }
}
```

## Common Use Cases

### TypeScript Project

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.d.ts"],
  "coverageAnalysis": "perTest",
  "bun": {
    "testFiles": ["src/**/*.test.ts"],
    "timeout": 30000,
    "processPool": true,
    "maxWorkers": 4
  }
}
```

### Monorepo Setup

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["packages/*/src/**/*.ts"],
  "bun": {
    "testFiles": ["packages/*/test/**/*.test.ts"],
    "processPool": true,
    "maxWorkers": 8,
    "env": {
      "NODE_ENV": "test"
    }
  }
}
```

### React/JSX Project

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.test.*",
    "!src/**/*.stories.*"
  ],
  "bun": {
    "testFiles": ["src/**/*.test.{tsx,ts}"],
    "processPool": true
  }
}
```

### API/Backend Project

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/index.ts"
  ],
  "bun": {
    "testFiles": ["test/**/*.test.ts"],
    "timeout": 60000,
    "env": {
      "NODE_ENV": "test",
      "DATABASE_URL": "sqlite::memory:"
    }
  }
}
```

### Library Project

```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["lib/**/*.ts", "!lib/**/*.d.ts"],
  "coverageAnalysis": "perTest",
  "bun": {
    "testFiles": ["test/**/*.test.ts"],
    "processPool": true,
    "maxWorkers": 4
  },
  "thresholds": {
    "high": 90,
    "low": 80,
    "break": 70
  }
}
```

## Migration Guide

### From Command Runner

If you're currently using the command runner with Bun:

**Before:**
```json
{
  "testRunner": "command",
  "commandRunner": {
    "command": "bun test"
  }
}
```

**After:**
```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "bun": {
    "testFiles": ["**/*.test.ts"]
  }
}
```

Benefits of migrating:
- 2-3x faster execution with process pool
- Better error reporting with source maps
- Coverage analysis support
- Native Bun integration

### From Jest Runner

If migrating from Jest to Bun:

**Before:**
```json
{
  "testRunner": "jest",
  "jest": {
    "projectType": "custom",
    "configFile": "jest.config.js"
  }
}
```

**After:**
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

Note: Some Jest features may require adjustment:
- Mocking: Use Bun's built-in mocking
- Timers: Use Bun's timer mocks
- Modules: Update module mocking syntax

## Troubleshooting

### Common Issues

#### 1. Bun Not Found

**Error**: `Bun not found. Please install Bun`

**Solution**:
```bash
# Install Bun globally
curl -fsSL https://bun.sh/install | bash

# Add to PATH if needed
export PATH="$HOME/.bun/bin:$PATH"
```

#### 2. Version Mismatch

**Error**: `Bun version 1.0.0 or higher is required`

**Solution**:
```bash
# Update Bun
bun upgrade

# Or reinstall
curl -fsSL https://bun.sh/install | bash
```

#### 3. Test Timeout

**Error**: `Test run timed out`

**Solution**:
```json
{
  "bun": {
    "timeout": 60000  // Increase timeout
  }
}
```

#### 4. Zombie Processes

**Problem**: Bun processes not terminating properly on macOS/Linux

**Solution**: The plugin automatically handles process cleanup, but if you still see zombie processes:
```bash
# Kill all hanging bun processes
pkill -f "bun"

# Check for remaining processes
ps aux | grep bun
```

**Prevention**: Ensure you're using version 0.3.0+ which includes:
- Automatic process cleanup on timeout
- SIGTERM/SIGINT signal handlers
- Force kill after 1 second if graceful shutdown fails
- Hard limit of 4 concurrent workers in process pool
- Maximum 8 total worker processes safety check
- Idle worker cleanup after 5 seconds
- Process state logging for debugging

#### 5. Out of Memory

**Error**: `JavaScript heap out of memory`

**Solution**:
```json
{
  "bun": {
    "nodeArgs": ["--max-old-space-size=8192"],
    "maxWorkers": 2  // Reduce worker count
  }
}
```

#### 5. Coverage Not Working

**Error**: `Coverage shows 0 for all mutants`

**Solution**: Coverage perTest is a known limitation. Use:
```json
{
  "coverageAnalysis": "off"
}
```

#### 6. Process Pool Issues

**Error**: `Worker process failed to start`

**Solution**:
```json
{
  "bun": {
    "processPool": false  // Disable process pool
  }
}
```

Or reduce workers:
```json
{
  "bun": {
    "maxWorkers": 2
  }
}
```

### Debug Mode

Enable debug logging for troubleshooting:

```bash
# Run with debug logging
DEBUG=stryker:* npx stryker run

# Or set in configuration
{
  "logLevel": "debug"
}
```

Debug specific components:
```bash
# Debug test runner only
DEBUG=stryker:bun-runner npx stryker run

# Debug process pool
DEBUG=stryker:process-pool npx stryker run
```

### Performance Profiling

Profile mutation testing performance:

```json
{
  "logLevel": "info",
  "reporters": ["progress", "timer"]
}
```

Check the timer report for bottlenecks.

## Best Practices

### 1. Start Small

Begin with a subset of your codebase:

```json
{
  "mutate": ["src/utils/**/*.js"]
}
```

### 2. Exclude Generated Files

Always exclude generated or vendor code:

```json
{
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.generated.ts",
    "!src/**/vendor/**",
    "!src/**/*.d.ts",
    "!src/**/node_modules/**"
  ]
}
```

### 3. Use Incremental Mode

For large codebases, use incremental mode:

```json
{
  "incremental": true,
  "incrementalFile": ".stryker-incremental.json"
}
```

### 4. CI/CD Integration

Example GitHub Actions workflow:

```yaml
name: Mutation Testing

on: [push, pull_request]

jobs:
  mutation-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npm run build
      - run: npx stryker run
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: mutation-report
          path: reports/mutation/mutation.html
```

### 5. Monitor Mutation Score

Track your mutation score over time:

```json
{
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}
```

### 6. Focus on Critical Code

Prioritize mutation testing for:
- Business logic
- Algorithm implementations
- Data transformations
- Security-sensitive code
- Public APIs

### 7. Review Survived Mutations

Survived mutations indicate potential gaps in your tests:

1. Check the HTML report in `reports/mutation/mutation.html`
2. Look for patterns in survived mutations
3. Add tests to kill high-value mutations
4. Consider if some mutations are equivalent (impossible to kill)

### 8. Optimize for Your Workflow

Development mode:
```json
{
  "bun": {
    "bail": true,
    "timeout": 5000,
    "maxWorkers": 2
  }
}
```

CI mode:
```json
{
  "bun": {
    "bail": false,
    "timeout": 60000,
    "maxWorkers": 8,
    "processPool": true
  }
}
```

### 9. Use Mutation Testing in PR Reviews

Add mutation testing to your PR checklist:
- [ ] All new code has tests
- [ ] Mutation score hasn't decreased
- [ ] No new survived mutations in critical code
- [ ] Performance metrics are acceptable

### 10. Testing the Plugin Itself

When running mutation testing on the Bun runner plugin itself, special care must be taken to avoid recursive process creation:

```bash
# Use the self-testing configuration (uses command runner)
npm run stryker:self
```

The `stryker-self.config.mjs` uses the command runner instead of the Bun runner to avoid:
- Recursive process creation when the plugin tests itself
- Process explosion from nested test runner instances
- Memory exhaustion from too many concurrent processes

If you need to test the plugin with itself:
```json
{
  "testRunner": "command",
  "commandRunner": {
    "command": "npm test"
  },
  "concurrency": 2
}
```

This prevents process explosion when testing the test runner itself.

### 11. Document Equivalent Mutations

Some mutations can't be killed. Document these:

```javascript
// @stryker-ignore-next-line
// Equivalent mutation: both implementations are correct
return value ?? defaultValue;
```

## Next Steps

1. **Explore the Example**: Check out the [example directory](../example) for a complete setup
2. **Read the API Docs**: See [API.md](./API.md) for detailed API documentation
3. **Contribute**: See [CONTRIBUTING.md](../CONTRIBUTING.md) to help improve the project
4. **Get Help**: Open an issue on [GitHub](https://github.com/stryker-mutator/stryker-bun/issues)
5. **Join the Community**: [Stryker Slack](https://join.slack.com/t/stryker-mutator/shared_invite/enQtOTUyMTYyNTg1NDQ0LTU4ODNmZDlmN2I3MmEyMTVhYjZlYmJkOThlNTY3NTM1M2QxYmM5YTM3ODQxYmJjY2YyYzllM2RkMmM1NjNjZjM)

Happy mutation testing with Bun! 🚀