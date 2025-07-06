# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-01-06

### Added
- **Process Pool Implementation** - Reuse Bun worker processes for significantly improved performance
  - Configurable with `processPool` option (enabled by default)
  - Configurable `maxWorkers` option (default: 4)
  - Automatic idle worker cleanup to optimize resource usage
  - Configurable worker startup timeout via WorkerManager constructor
- **Watch Mode Support** - Real-time mutation testing during development
  - Enable with `watchMode` option in configuration
  - Automatically reruns mutations when files change
  - Incrementally tests only affected code
- **Snapshot Testing Support** - Full support for Bun's snapshot features
  - `updateSnapshots` option to control snapshot updates
  - Compatible with Bun's built-in snapshot testing
- **Source Map Support** - Accurate error reporting for TypeScript projects
  - SourceMapHandler for automatic source map resolution
  - Proper stack traces with original file locations
  - Seamless integration with TypeScript projects
- **TypeScript Strict Mode Support** - Full compatibility with TypeScript strict mode
- **Enhanced Coverage System** - Improved test coverage tracking and reporting
  - CoverageHookGenerator for dynamic hook generation
  - Better integration with Bun's native coverage tools
- **Comprehensive Test Suite** - Added 100+ new tests achieving:
  - 100% line coverage
  - 97.66% function coverage
  - 100% mutation score
- **Performance Optimizations**
  - Reduced test execution timeouts from ~32s to <1s for faster feedback
  - Smart timeout handling with configurable multipliers
  - Improved worker communication efficiency
- **GitHub Integration** - Added workflows and templates
  - CI workflow with comprehensive testing
  - Automated release workflow
  - Issue templates for bug reports and feature requests
  - Dependabot configuration for dependency updates

### Changed
- **Default Timeout** - Increased from 5000ms to 10000ms for better stability
- **Coverage Implementation** - Migrated from c8 to Bun's native coverage for accurate metrics
- **Test Architecture** - Refactored to use WorkerManager pattern for cleaner code organization
- **ESLint Configuration** - Added stricter rules and fixed all linting issues
- **Process Management** - Improved process spawning with `detached: false` to prevent zombie processes

### Fixed
- Fixed coverage reporting showing 0% with c8
- Fixed timeout issues with Stryker mutants
- Fixed TypeScript strict mode compatibility issues
- Fixed various ESLint warnings and errors
- Fixed strykerValidationSchema export for proper schema validation
- Fixed zombie process issues by ensuring child processes are killed when parent dies
- Fixed worker startup timeout (was 100ms, now configurable with 5s default)
- Fixed process cleanup with `cleanup: true` in execa options
- Improved error handling in worker processes
- Reduced test suite execution time from ~858ms to ~540ms
- Added process limits to prevent explosion (max 4 concurrent workers, 8 total)
- Reduced idle timeout to 5 seconds for faster cleanup
- Added self-testing configuration to prevent process issues when testing the plugin
- Implemented ProcessPoolSingleton to prevent multiple process pool instances
- Changed self-testing to use command runner to avoid recursive process creation
- Increased default maxWorkers from 2-4 to 8 for better performance
- Added reset methods to ProcessPoolSingleton and BunTestRunner for cleanup
- Fixed deprecated maxConcurrentTestRunners warnings in configurations
- Added comprehensive tests for ProcessPoolSingleton with 100% coverage

### Documentation
- Updated README with new configuration options and features
- Added comprehensive API documentation for all new features
- Enhanced user guide with examples for watch mode, snapshot testing, and source maps
- Added ESLint guidelines to CLAUDE.md
- Improved examples and troubleshooting guides
- Added multiple example configurations (minimal, process pool, watch mode)

## [0.2.0] - 2024-07-06

### Updated
- Updated to Stryker 9.x compatibility
- Updated Node.js requirement to >= 20.0.0 (following Stryker 9.x requirements)
- Updated dependencies:
  - `@stryker-mutator/api` to ^9.0.1
  - `@stryker-mutator/util` to ^9.0.1
  - `@stryker-mutator/core` to ^9.0.1
  - `execa` to ^9.6.0
  - `@types/node` to ^22.0.0
  - ESLint to v9 with new flat config format
  - TypeScript ESLint plugins to v8

### Added
- ESLint 9 flat configuration
- Support for all Stryker 9.x features

### Breaking Changes
- Node.js 20+ required (was Node.js 16+)
- Stryker 9.x required (was Stryker 8.x)

## [0.1.0] - 2024-01-XX

### Added
- Initial release of @stryker-mutator/bun-runner
- Basic test execution with Bun runtime
- Support for TypeScript and JSX out of the box
- Configurable test file patterns
- Timeout handling for test execution
- Coverage analysis support (perTest and all modes)
- Test filtering based on mutant coverage for optimized performance
- Integration with StrykerJS mutation testing framework
- Support for Bun >= 1.0.0 and StrykerJS >= 8.0.0

### Features
- **BunTestRunner**: Main test runner implementation that integrates with StrykerJS
- **BunTestAdapter**: Adapter for executing Bun tests via command line
- **BunResultParser**: Parser for converting Bun test results to StrykerJS format
- **MutantCoverageCollector**: Collects coverage data during test execution
- **TestFilter**: Filters tests based on mutant coverage to optimize execution time

### Configuration Options
- `testFiles`: Pattern(s) of test files to run
- `timeout`: Timeout per test in milliseconds
- `bail`: Stop running tests after the first failure
- `nodeArgs`: Additional arguments to pass to the bun process
- `env`: Environment variables to set when running tests
- `command`: Custom command to run instead of 'bun test'
- `coverageAnalysis`: Enable coverage analysis for performance optimization

[0.3.0]: https://github.com/stryker-mutator/stryker-bun/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/stryker-mutator/stryker-bun/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/stryker-mutator/stryker-bun/releases/tag/v0.1.0