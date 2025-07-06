# @stryker-mutator/bun-runner

[![npm version](https://badge.fury.io/js/@stryker-mutator%2Fbun-runner.svg)](https://badge.fury.io/js/@stryker-mutator%2Fbun-runner)
[![CI](https://github.com/stryker-mutator/stryker-bun/workflows/CI/badge.svg)](https://github.com/stryker-mutator/stryker-bun/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A test runner plugin to use [Bun](https://bun.sh) with [StrykerJS](https://stryker-mutator.io), the JavaScript mutation testing framework.

> ⚡ **Fast mutation testing with Bun's lightning-fast runtime**

## 🚧 Work in Progress

This plugin is currently in Phase 2 - Optimizations.

## Features

- ✅ Basic test execution with Bun
- ✅ Support for TypeScript and JSX out of the box
- ✅ Configurable test patterns
- ✅ Timeout handling
- ✅ Coverage analysis (perTest and all)
- ✅ Test filtering based on mutant coverage
- 🚧 Process reuse (coming in Phase 3)
- 🚧 Watch mode (coming in Phase 3)

## Installation

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner
```

## Quick Start

1. Create a `stryker.config.json` file:
```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "coverageAnalysis": "perTest",
  "bun": {
    "testFiles": ["**/*.test.ts"],
    "timeout": 30000
  }
}
```

2. Run Stryker:
```bash
npx stryker run
```

## Configuration

## Options

The `bun` configuration object accepts the following options:

- `testFiles` (string[]): Pattern(s) of test files to run. Default: `["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}"]`
- `timeout` (number): Timeout per test in milliseconds. Default: `5000`
- `bail` (boolean): Stop running tests after the first failure. Default: `false`
- `nodeArgs` (string[]): Additional arguments to pass to the bun process
- `env` (object): Environment variables to set when running tests
- `command` (string): Custom command to run instead of 'bun test'
- `coverageAnalysis` ('off' | 'all' | 'perTest'): Enable coverage analysis for performance optimization

## Usage

Run Stryker with:

```bash
npx stryker run
```

## Requirements

- Bun >= 1.0.0
- StrykerJS >= 9.0.0
- Node.js >= 20.0.0 (for StrykerJS)

## Examples

Check out the [example directory](./example) for a complete working example with:
- Calculator class with mathematical operations
- Scientific calculator with trigonometric functions  
- String utilities with text manipulation methods
- Comprehensive test suites demonstrating 800+ mutants

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

Apache-2.0 - see [LICENSE](./LICENSE) for details.