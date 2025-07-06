# @stryker-mutator/bun-runner

[![npm version](https://badge.fury.io/js/@stryker-mutator%2Fbun-runner.svg)](https://badge.fury.io/js/@stryker-mutator%2Fbun-runner)
[![CI](https://github.com/stryker-mutator/stryker-bun/workflows/CI/badge.svg)](https://github.com/stryker-mutator/stryker-bun/actions)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Mutation testing badge](https://img.shields.io/endpoint?style=flat&url=https%3A%2F%2Fbadge-api.stryker-mutator.io%2Fgithub.com%2Fstryker-mutator%2Fstryker-bun%2Fmain)](https://dashboard.stryker-mutator.io/reports/github.com/stryker-mutator/stryker-bun/main)

A test runner plugin to use [Bun](https://bun.sh) with [StrykerJS](https://stryker-mutator.io), the JavaScript mutation testing framework.

> ⚡ **Lightning-fast mutation testing** - Leverage Bun's speed for rapid mutation testing
> 
> 🔥 **Zero Config TypeScript** - Works with TypeScript and JSX out of the box
> 
> 📊 **Smart Coverage Analysis** - Only run tests that can detect mutations
> 
> 🎯 **100% Tested** - Comprehensive test suite with 100% mutation score

## Features

### ✅ Implemented
- **Fast Test Execution** - Leverage Bun's speed for quick test runs
- **TypeScript & JSX Support** - No configuration needed
- **Coverage Analysis** - Smart test filtering with perTest coverage
- **Process Pool** - Reuse Bun processes for faster execution
- **Flexible Configuration** - Extensive options for customization
- **Timeout Handling** - Configurable timeouts with graceful handling
- **Test Filtering** - Run only tests that can kill specific mutants
- **Environment Variables** - Full control over test environment
- **Custom Commands** - Support for custom test scripts
- **TypeScript Strict Mode** - Full support for strict TypeScript projects

### 🚧 Coming Soon
- **Watch Mode** - Real-time mutation testing during development
- **Snapshot Testing** - Support for Bun's snapshot features
- **Performance Benchmarks** - Built-in performance tracking

## Installation

```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner
```

## Quick Start

### 1. Initialize StrykerJS (if new project)

```bash
npx stryker init
```

Choose "bun" as your test runner when prompted.

### 2. Or manually create `stryker.config.json`

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "packageManager": "npm",
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "coverageAnalysis": "perTest",
  "reporters": ["html", "clear-text", "progress"],
  "bun": {
    "testFiles": ["**/*.test.ts"],
    "timeout": 30000
  }
}
```

### 3. Run mutation testing

```bash
npx stryker run
```

### 4. View results

Open `reports/mutation/mutation.html` in your browser to see detailed results.

## Configuration

### Basic Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `testFiles` | `string[]` | `["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}"]` | Test file patterns |
| `timeout` | `number` | `10000` | Timeout per test in milliseconds |
| `bail` | `boolean` | `false` | Stop on first test failure |
| `nodeArgs` | `string[]` | `[]` | Additional Bun process arguments |
| `env` | `object` | `{}` | Environment variables |
| `command` | `string` | `undefined` | Custom test command |
| `processPool` | `boolean` | `true` | Enable process pooling for performance |
| `maxWorkers` | `number` | `4` | Maximum number of worker processes |

### Example Configurations

#### TypeScript Project
```json
{
  "testRunner": "bun",
  "plugins": ["@stryker-mutator/bun-runner"],
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts"],
  "coverageAnalysis": "perTest",
  "bun": {
    "testFiles": ["src/**/*.test.ts"],
    "timeout": 30000
  }
}
```

#### Custom Test Command
```json
{
  "bun": {
    "command": "bun test:unit --coverage"
  }
}
```

#### CI Environment
```json
{
  "bun": {
    "timeout": 60000,
    "nodeArgs": ["--max-old-space-size=4096"],
    "env": {
      "CI": "true",
      "NODE_ENV": "test"
    }
  }
}
```

## Requirements

- Bun >= 1.0.0
- StrykerJS >= 9.0.0
- Node.js >= 20.0.0 (for StrykerJS)

## Documentation

- 📖 **[User Guide](./docs/GUIDE.md)** - Comprehensive guide with examples and best practices
- 🔧 **[API Documentation](./docs/API.md)** - Detailed API reference
- 🚀 **[Example Project](./example)** - Complete working example with 800+ mutants
- 🤝 **[Contributing Guide](./CONTRIBUTING.md)** - How to contribute to the project

## Performance Tips

### 1. Enable Coverage Analysis
```json
{
  "coverageAnalysis": "perTest"
}
```
This can reduce test execution time by 80-90% by only running relevant tests for each mutant.

### 2. Use Specific File Patterns
```json
{
  "mutate": ["src/**/*.ts", "!src/**/*.test.ts", "!src/**/*.d.ts"]
}
```

### 3. Parallelize in CI
```json
{
  "concurrency": 4,
  "concurrency_comment": "Adjust based on your CI runner"
}
```

## Troubleshooting

### Common Issues

**Bun not found**
```bash
curl -fsSL https://bun.sh/install | bash
```

**Out of memory**
```json
{
  "bun": {
    "nodeArgs": ["--max-old-space-size=8192"]
  }
}
```

**Timeout errors**
```json
{
  "bun": {
    "timeout": 60000
  }
}
```

See the [troubleshooting guide](./docs/GUIDE.md#troubleshooting) for more solutions.

## Project Status

This plugin is actively maintained and tested with:
- ✅ 100% line coverage
- ✅ 97.66% function coverage
- ✅ 100% mutation score
- ✅ Comprehensive test suite (230+ tests)
- ✅ ESLint clean (0 errors, 0 warnings)
- ✅ TypeScript strict mode

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development

```bash
# Clone the repo
git clone https://github.com/stryker-mutator/stryker-bun.git
cd stryker-bun

# Install dependencies
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build the project
npm run build
```

## Support

- 🐛 **[Report bugs](https://github.com/stryker-mutator/stryker-bun/issues)**
- 💡 **[Request features](https://github.com/stryker-mutator/stryker-bun/issues)**
- 💬 **[Join Stryker Slack](https://join.slack.com/t/stryker-mutator/shared_invite/enQtOTUyMTYyNTg1NDQ0LTU4ODNmZDlmN2I3MmEyMTVhYjZlYmJkOThlNTY3NTM1M2QxYmM5YTM3ODQxYmJjY2YyYzllM2RkMmM1NjNjZjM)**

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for a detailed list of changes in each release.

## License

[Apache License 2.0](./LICENSE)

---

<p align="center">
  Made with ❤️ by the StrykerJS team
</p>