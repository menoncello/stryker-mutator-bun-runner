# Stryker Bun Runner Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Setup](#basic-setup)
4. [Configuration](#configuration)
5. [Performance Optimization](#performance-optimization)
6. [Common Use Cases](#common-use-cases)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

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

## Installation

### Prerequisites

Before installing, ensure you have:
- Node.js >= 20.0.0
- Bun >= 1.0.0
- npm or yarn

### Install Dependencies

```bash
# Install StrykerJS and the Bun runner
npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner

# Or with yarn
yarn add --dev @stryker-mutator/core @stryker-mutator/bun-runner
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
  - Default: `5000`
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
    "command": "bun test --coverage"
  }
}
```

- **nodeArgs** (string[]): Arguments passed to the Bun process
- **env** (object): Environment variables for test execution
- **command** (string): Custom test command (overrides default behavior)

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

### 1. Use Coverage Analysis

Coverage analysis significantly improves performance by only running tests that cover mutated code:

```json
{
  "coverageAnalysis": "perTest"
}
```

With 100 tests and 1000 mutations:
- Without coverage: 100,000 test executions
- With coverage: ~10,000 test executions (90% reduction!)

### 2. Optimize Test File Patterns

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

### 3. Increase Timeout for CI

CI environments may need higher timeouts:

```json
{
  "bun": {
    "timeout": process.env.CI ? 60000 : 30000
  }
}
```

### 4. Use Bail in Development

For faster feedback during development:

```json
{
  "bun": {
    "bail": true
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
    "timeout": 30000
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
    "testFiles": ["src/**/*.test.{tsx,ts}"]
  }
}
```

### Custom Test Command

For projects with custom test scripts:

```json
{
  "bun": {
    "command": "bun test:unit --coverage"
  }
}
```

## Troubleshooting

### Common Issues

#### 1. Bun Not Found

**Error**: `Bun not found. Please install Bun`

**Solution**:
```bash
# Install Bun globally
curl -fsSL https://bun.sh/install | bash

# Or via npm
npm install -g bun
```

#### 2. Version Mismatch

**Error**: `Bun version 1.0.0 or higher is required`

**Solution**:
```bash
# Update Bun
bun upgrade
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

#### 4. Out of Memory

**Error**: `JavaScript heap out of memory`

**Solution**:
```json
{
  "bun": {
    "nodeArgs": ["--max-old-space-size=8192"]
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
    "!src/**/*.d.ts"
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

### 7. Review Survived Mutations

Survived mutations indicate potential gaps in your tests:

1. Check the HTML report in `reports/mutation/mutation.html`
2. Look for patterns in survived mutations
3. Add tests to kill high-value mutations
4. Consider if some mutations are equivalent (impossible to kill)

## Next Steps

1. **Explore the Example**: Check out the [example directory](../example) for a complete setup
2. **Read the API Docs**: See [API.md](./API.md) for detailed API documentation
3. **Contribute**: See [CONTRIBUTING.md](../CONTRIBUTING.md) to help improve the project
4. **Get Help**: Open an issue on [GitHub](https://github.com/stryker-mutator/stryker-bun/issues)

Happy mutation testing with Bun! 🚀