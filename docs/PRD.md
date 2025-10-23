# stryker-mutator-bun-runner Product Requirements Document (PRD)

**Author:** Eduardo Menoncello **Date:** 2025-10-21 **Project Level:** 3
**Target Scale:** Level 3 (Comprehensive Product, 15-40 stories, 2-5 epics)

---

## Goals and Background Context

### Goals

- Deliver native Bun mutation testing capability through StrykerJS, filling a
  critical gap in the Bun testing ecosystem
- Achieve 2-3x faster mutation testing performance compared to existing
  Node.js-based runners (Jest, Vitest)
- Implement full Stryker TestRunner API compatibility including perTest coverage
  analysis for 40-60% performance gains
- Establish path to official Stryker team adoption as
  `@stryker-mutator/bun-runner`
- Provide production-ready quality with comprehensive testing, documentation,
  and community validation

### Background Context

Bun has emerged as a high-performance JavaScript/TypeScript runtime offering
2-5x speed improvements over Node.js, driving rapid adoption in the developer
community. However, developers using Bun face a critical quality assurance gap:
StrykerJS, the industry-standard mutation testing framework, lacks support for
Bun's native test runner. This forces Bun developers to either skip mutation
testing entirely or switch to Node.js-based runners, negating Bun's performance
advantages.

Comprehensive technical research has validated the feasibility of a native Bun
runner plugin, identifying a proven architecture pattern (Hybrid Subprocess)
leveraging `Bun.spawn()` for 60% faster process execution. With the Stryker team
receptive to ecosystem contributions and no competing solutions in development,
this represents a first-mover opportunity to become the reference implementation
for Bun mutation testing while demonstrating best practices for Stryker plugin
architecture.

---

## Requirements

### Functional Requirements

**Stryker Plugin Integration**

- FR001: The plugin shall implement the Stryker TestRunner interface with all
  required methods (init, dryRun, mutantRun, dispose)
- FR002: The plugin shall register with Stryker using `declareClassPlugin` with
  PluginKind.TestRunner
- FR003: The plugin shall integrate with Stryker's dependency injection
  framework (typed-inject) for plugin initialization
- FR004: The plugin shall accept and validate Bun runner configuration options
  including: test file patterns, timeout values, coverage mode, and Bun CLI
  arguments, providing clear validation errors and failing fast on invalid
  configuration
- FR005: The plugin shall validate compatibility with minimum supported versions
  (Bun 1.0+, Stryker 7.0+) and fail gracefully with clear error messages for
  unsupported versions
- FR006: The plugin shall define a JSON schema for runner configuration options
  (generated from TypeScript configuration types) to enable validation and IDE
  autocomplete support

**Test Execution**

- FR007: The plugin shall execute Bun tests via subprocess using `Bun.spawn()`
  CLI invocation with proper TypeScript and JSX support
- FR008: The plugin shall parse Bun's JSON test output format into Stryker's
  DryRunResult structure with version-specific format handling
- FR009: The plugin shall support test filtering using Bun's
  `--test-name-pattern` flag and test file path filtering
- FR010: The plugin shall execute tests with activated mutations and return
  MutantRunResult with status, runtime, and failure details
- FR011: The plugin shall spawn fresh Bun processes for each mutation run to
  ensure clean test state and prevent cross-mutation contamination (MVP
  correctness-first approach; process pooling optimization deferred to Phase 3
  for performance)
- FR012: The plugin shall handle async tests and promises, waiting for proper
  test completion before reporting results
- FR013: The plugin shall detect Bun CLI output format changes across versions
  and adapt parsing logic or warn users of incompatibilities

**Mutation Management**

- FR014: The plugin shall activate mutations in source code using Stryker's
  mutation switching protocol (supporting both environment variable and
  file-based activation methods)
- FR015: The plugin shall correctly report mutation status (Killed, Survived,
  Timeout, Error, NoCoverage) based on test execution results
- FR016: The plugin shall apply appropriate timeout multipliers to mutation
  tests based on dry run performance

**Coverage Analysis**

- FR017: The plugin shall collect perTest coverage data during dryRun execution
  using native Bun coverage instrumentation
- FR018: The plugin shall generate test-to-mutant mapping based on coverage
  analysis with line-level precision
- FR019: The plugin shall filter tests during mutantRun to only execute tests
  covering the active mutant when perTest coverage is enabled
- FR020: The plugin shall support all Stryker coverage analysis modes (off, all,
  perTest) with graceful fallback to 'all' mode (running all tests for each
  mutant) if perTest collection fails

**Result Reporting & Error Handling**

- FR021: The plugin shall map Bun test results to Stryker's expected result
  format with test names, status, duration, and coverage data
- FR022: The plugin shall capture and report test failure messages and stack
  traces with source map support for all transpiled formats (TypeScript, JSX,
  TSX)
- FR023: The plugin shall report accurate test execution time metrics for
  performance analysis
- FR024: The plugin shall handle Bun subprocess failures (crashes, non-zero
  exits, invalid output) and communicate detailed errors to Stryker including:
  exit code, stderr output, stdout output, error type classification, and
  actionable troubleshooting guidance
- FR025: The plugin shall provide debug logging mode for troubleshooting test
  execution and mutation issues with configurable verbosity levels and
  structured output option (JSON format) for automated log analysis

**Process & Resource Management**

- FR026: The plugin shall implement configurable timeout handling for
  long-running tests with default timeout values (based on test suite dry run ×
  multiplier) and user-override capability
- FR027: The plugin shall clean up spawned Bun processes on completion, error,
  or timeout using proper signal handling (SIGTERM followed by SIGKILL) after
  checking process exit status to avoid killing already-completed processes
- FR028: The plugin shall dispose of resources properly when Stryker terminates
  the test run
- FR029: The plugin shall maintain worker-isolated state management within
  Stryker's concurrent worker pool without race conditions or shared state
  corruption between workers

**Defensive Validation & Robustness**

- FR030: The plugin shall validate Bun installation and PATH availability before
  attempting test execution, providing clear installation guidance on failure
- FR031: The plugin shall implement spawn-level timeout protection to prevent
  indefinite hangs, distinct from test execution timeouts
- FR032: The plugin shall verify mutation activation in spawned processes (by
  validating mutation activation mechanism: environment variable presence or
  file modification timestamp) to prevent false negatives from unactivated
  mutations (verification logging shall follow FR037 sanitization rules)
- FR033: The plugin shall use conservative filtering strategy for coverage-based
  test selection - when coverage confidence is below 80% or mapping is
  ambiguous, include the test rather than exclude it
- FR034: The plugin shall validate JSON output completeness before parsing to
  detect truncated or malformed responses
- FR035: The plugin shall isolate worker-specific temporary files and
  directories to prevent race conditions in Stryker's concurrent execution mode
- FR036: The plugin shall work with zero configuration for standard Bun projects
  using sensible defaults (automatic test file discovery, default timeouts,
  automatic coverage mode selection defaulting to perTest if Bun supports it,
  otherwise 'all')
- FR037: The plugin shall sanitize sensitive information (secrets, environment
  variables, absolute file paths) from log output and error messages while
  preserving relative paths and public test identifiers for debugging
- FR038: The plugin shall create temporary files and directories with secure
  permissions (0700) and ensure cleanup on both normal exit and crash scenarios
- FR039: The plugin shall support configuration schema versioning and provide
  migration guidance when configuration schema changes between versions
- FR040: The plugin shall maintain and publish a compatibility matrix
  documenting supported Bun and Stryker version combinations

**Requirements Traceability to Goals:**

- **Goal 1** (Native Bun mutation testing capability): FR001-FR006, FR014-FR016,
  FR007-FR013
- **Goal 2-3** (Performance - 2-3x faster, perTest coverage): FR007-FR013,
  FR017-FR020, FR011, FR026-FR027
- **Goal 4** (Official Stryker adoption): FR001-FR006, FR029, FR030-FR039
  (quality & robustness)
- **Goal 5** (Production quality): FR024-FR025, FR030-FR039, FR004-FR006
  (documentation & validation)

**Implementation Dependencies & Critical Path:**

The functional requirements have the following dependency structure:

- **Foundation Layer** (Phase 1): FR001, FR002, FR003, FR005 - Core plugin
  infrastructure with no dependencies
- **Configuration Layer** (Phase 1): FR004, FR006 - Depends on Foundation layer
- **Core Execution Layer** (Phase 2): FR007, FR008, FR013 - Enables majority of
  downstream requirements (15+ FRs depend on FR007)
- **Mutation Layer** (Phase 3A): FR014, FR010, FR015, FR016 - Depends on Core
  Execution, can develop in parallel with Coverage
- **Coverage Layer** (Phase 3B): FR017, FR018, FR019, FR020 - Depends on Core
  Execution, HIGH RISK/HIGH VALUE (40-60% performance gain)
- **Reporting Layer** (Phase 4): FR021, FR022, FR023, FR024, FR025 - Depends on
  Core Execution and Mutation layers
- **Resource Management Layer** (Phase 5): FR011, FR012, FR026, FR027, FR028,
  FR029 - Architectural concerns, some cross-cutting

**High-Impact Requirements** (enable many others): FR007 (Bun execution), FR008
(JSON parsing), FR017 (coverage collection), FR014 (mutation activation)

**Risk Hotspots**: FR017-FR020 (coverage complexity), FR029 (thread safety),
FR013 (version compatibility maintenance)

**Implementation Notes:**

- **Timeout Hierarchy**: FR031 (spawn timeout) > FR026 (test timeout) > FR027
  (kill timeout). Spawn timeout prevents test timeout from firing in most cases.
- **Observability Implementation Order**: FR037 (sanitization) → FR024 (error
  reporting) → FR025 (logging) to prevent circular dependencies
- **Coverage Fallback Clarification**: FR020 (collection failure fallback) and
  FR033 (mapping uncertainty handling) address different failure modes and work
  together, not redundantly

### Non-Functional Requirements

**Performance**

- NFR001: The plugin shall achieve 2-3x faster mutation testing execution
  compared to @stryker-mutator/jest-runner on equivalent test suites
- NFR002: The plugin shall be benchmarked against @stryker-mutator/jest-runner
  and @stryker-mutator/vitest-runner to validate performance improvement claims
- NFR003: PerTest coverage analysis shall provide 40-60% performance improvement
  over 'all' coverage mode
- NFR004: Performance metrics shall be suitable for regression testing in CI/CD
  pipelines to detect performance degradation
- NFR005: The plugin shall complete dry run execution with overhead not
  exceeding 10% of native `bun test` execution time

**Reliability & Stability**

- NFR006: The plugin shall maintain <1% failure rate on supported Bun and
  Stryker versions under normal operating conditions
- NFR007: The plugin shall handle at least 1000 mutations in a single test run
  without memory leaks or performance degradation
- NFR008: The plugin shall recover gracefully from transient failures (network
  issues, temporary file system errors) with appropriate retry logic

**Quality & Testing**

- NFR009: The plugin codebase shall maintain ≥80% test coverage with
  comprehensive unit and integration tests covering edge cases
- NFR010: The plugin shall include mutation testing of its own codebase
  (dogfooding) to validate test quality
- NFR011: The plugin shall pass all integration tests across the supported Bun
  and Stryker version matrix

**Documentation**

- NFR012: The plugin shall provide comprehensive documentation including:
  installation guide, configuration reference, troubleshooting guide, and
  quick-start tutorial
- NFR013: All public APIs and configuration options shall have JSDoc/TSDoc
  documentation for IDE support
- NFR014: The plugin shall include working example projects demonstrating common
  use cases

**Compatibility**

- NFR015: The plugin shall support Bun 1.0+ and Stryker 7.0+ with clearly
  documented version compatibility matrix (FR040)
- NFR016: The plugin shall maintain backward compatibility within major versions
  following semantic versioning
- NFR017: The plugin shall work across macOS, Linux, and Windows platforms
  (primary support for macOS and Linux)

**Maintainability**

- NFR018: The codebase shall follow TypeScript strict mode with no `any` types
  in public APIs
- NFR019: The codebase shall adhere to ESLint and Prettier standards consistent
  with Stryker ecosystem conventions
- NFR020: The plugin shall have modular architecture enabling independent
  testing and replacement of components

**Security**

- NFR021: The plugin shall not execute arbitrary code provided by users without
  explicit Stryker mutation activation
- NFR022: Temporary files shall be created with secure permissions (0700) and
  cleaned up to prevent information disclosure (FR038)
- NFR023: Log output shall be sanitized to prevent leakage of sensitive
  information (FR037)

**Usability**

- NFR024: Initial setup and configuration shall be completable in less than 5
  minutes for standard Bun projects (supported by FR036)
- NFR025: Error messages shall be actionable, providing specific guidance on
  resolution steps (FR024)
- NFR026: The plugin shall work with zero configuration for 80% of standard Bun
  project structures (FR036)

---

## User Journeys

### Journey 1: First-Time Setup and Initial Mutation Test Run

**Actor:** Sarah, Senior TypeScript Developer adopting Bun for a new project

**Context:** Sarah has migrated her team's test suite to Bun and wants to add
mutation testing for quality assurance

**Journey Steps:**

1. **Discovery** → Sarah searches for "Bun mutation testing" and finds
   @stryker-mutator/bun-runner on npm
2. **Installation** → Runs
   `npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner`
3. **Configuration Decision Point:**
   - **Path A (Zero Config):** Sarah runs `npx stryker init` and selects
     bun-runner, uses defaults → Success (FR036)
   - **Path B (Custom Config):** Sarah creates stryker.config.json manually,
     references schema for autocomplete (FR006) → Success with IDE help
4. **First Run** → Executes `npx stryker run`
   - Plugin validates Bun installation (FR030) → Passes
   - Dry run executes all tests (FR007, FR008) → Completes in 3 seconds
   - PerTest coverage collected (FR017-FR018) → Mapping generated
   - Mutation testing begins (FR014, FR010) → 50 mutants tested
5. **Results** → Sarah reviews mutation score report
   - 5 mutants survived → Sarah identifies weak tests
   - Performance: 2.5x faster than previous Jest setup (NFR001) → Sarah is
     impressed
6. **Integration** → Sarah adds `stryker run` to CI/CD pipeline → Tests run
   successfully on every PR

**Outcome:** Sarah successfully implements mutation testing in 4 minutes, team
adopts it for all projects

### Journey 2: Troubleshooting Configuration Issues

**Actor:** Mike, Mid-level Developer new to mutation testing

**Context:** Mike's company mandates mutation testing, but his complex
TypeScript monorepo has custom test patterns

**Journey Steps:**

1. **Initial Setup** → Mike follows quick-start guide (NFR012, NFR014)
2. **First Run Failure** → `npx stryker run` fails with error
3. **Error Message Analysis:**
   - Error: "Bun installation not found in PATH" (FR030)
   - Actionable guidance provided: "Install Bun from https://bun.sh or ensure
     it's in your PATH" (NFR025)
4. **Second Run - Partial Failure:**
   - Tests run, but 30% of mutants report "NoCoverage"
   - Mike enables debug logging: `--logLevel debug` (FR025)
   - Structured logs reveal test file pattern mismatch
5. **Configuration Adjustment:**
   - Mike updates stryker.config.json with correct test patterns (FR004)
   - JSON schema validation catches typo before running (FR006) → IDE shows
     error
6. **Successful Run:**
   - All mutants tested
   - Coverage mode auto-selected to perTest (FR036)
   - Mike shares configuration with team

**Outcome:** Mike resolves issues in 15 minutes using error messages and debug
logs, documents solution for team

### Journey 3: Performance Optimization for Large Codebase

**Actor:** Alex, Tech Lead managing 500+ test files in Bun monorepo

**Context:** Mutation testing takes too long, blocking CI/CD pipeline

**Journey Steps:**

1. **Initial Performance Issue** → Full mutation run takes 45 minutes
2. **Performance Analysis:**
   - Alex checks coverage mode → Currently using 'all' mode (FR020 fallback
     occurred)
   - Debug logs show perTest coverage collection failed (FR025 structured logs)
3. **Investigation:**
   - Alex discovers Bun version incompatibility with coverage feature
   - Compatibility matrix (FR040, NFR015) confirms Bun version needs upgrade
4. **Bun Upgrade:**
   - Upgrades Bun 1.0.2 → 1.0.15
   - Plugin detects new version, adapts (FR013)
   - PerTest coverage now works (FR017-FR019)
5. **Performance Improvement:**
   - Mutation run completes in 12 minutes (60% improvement per NFR003)
   - Alex enables performance metrics tracking (NFR004, FR023)
6. **Decision Point - Further Optimization:**
   - **Path A:** Alex waits for Phase 3 process pooling (FR011 note)
   - **Path B:** Alex configures timeout multipliers to reduce false timeouts
     (FR026, FR016)

**Outcome:** Alex achieves acceptable CI/CD performance, documents optimization
strategy for other teams

---

## UX Design Principles

- **Convention over Configuration** - The plugin should work with zero
  configuration for standard Bun projects, following Stryker and Bun ecosystem
  conventions
- **Progressive Disclosure** - Basic usage is simple; advanced features (debug
  logging, performance tuning) are available when needed but don't clutter the
  default experience
- **Clear Feedback** - Error messages provide actionable guidance with specific
  resolution steps; success states show meaningful progress indicators
- **Performance Transparency** - Users can see performance metrics and
  understand where time is spent (dry run vs mutation testing vs coverage
  collection)
- **Developer Empowerment** - Debug tooling and structured logs enable
  developers to self-diagnose issues without external support

---

## User Interface Design Goals

**Platform & Interaction:**

- **Target Platform:** Command-line interface (CLI) via Stryker
- **Core Interaction:** Standard Stryker commands (`npx stryker run`,
  `npx stryker init`)
- **Output Format:** Terminal text output following Stryker's standard reporting
  format

**Key CLI Experience Goals:**

- **Minimal Cognitive Load:** Default behavior requires no decisions from users
  (FR036 zero-config)
- **IDE Integration:** JSON schema enables autocomplete for configuration
  editing (FR006)
- **Error Clarity:** Error messages include error code, description, and
  actionable next steps (FR024, NFR025)
- **Observability:** Debug mode provides structured logs for troubleshooting
  without overwhelming normal output (FR025)

**Design Constraints:**

- Must integrate seamlessly with Stryker's existing CLI and reporting
  infrastructure
- Terminal output must be readable in both light and dark terminal themes
- No custom UI components - rely entirely on Stryker's presentation layer

---

## Epic List

### Epic 1: Foundation & Core Plugin Integration

**Goal:** Establish project infrastructure and implement Stryker TestRunner
interface with basic test execution capability **Estimated Stories:** 8-10
stories **Delivers:** Runnable plugin that can execute Bun tests and report
results to Stryker (without mutations or coverage)

### Epic 2: Mutation Testing & Result Reporting

**Goal:** Implement mutation activation, test execution with mutations, and
comprehensive result reporting **Estimated Stories:** 8-10 stories **Delivers:**
Full mutation testing capability with accurate mutation status reporting and
error handling

### Epic 3: Coverage Analysis & Performance Optimization

**Goal:** Implement perTest coverage collection and test filtering for 40-60%
performance improvement **Estimated Stories:** 10-12 stories **Delivers:**
High-performance mutation testing with intelligent test selection based on
coverage analysis

### Epic 4: Robustness, Security & Production Readiness

**Goal:** Add defensive validation, security features, comprehensive error
handling, and production-grade quality **Estimated Stories:** 8-10 stories
**Delivers:** Production-ready plugin with comprehensive validation, security,
and observability features

### Epic 5: Documentation, Examples & Release

**Goal:** Create comprehensive documentation, example projects, compatibility
matrix, and prepare for v1.0 release **Estimated Stories:** 6-8 stories
**Delivers:** Fully documented, community-ready plugin published to npm with
official release

**Total Estimated Stories:** 40-50 stories

> **Note:** Detailed epic breakdown with full story specifications is available
> in [epics.md](./epics.md)

---

## Out of Scope

### Features Deferred to Future Phases

- **Watch Mode Support** - Real-time mutation testing as files change (Phase 3:
  Optimization & Polish)
- **Process Pooling** - Reusable process pool for reduced spawn overhead (Phase
  3: explicitly noted in FR011)
- **Advanced Configuration Options** - Custom timeout strategies, advanced test
  filtering beyond coverage (Phase 3)
- **Performance Telemetry** - Opt-in usage analytics and performance monitoring
  dashboard (Phase 3)
- **Custom Reporters** - Plugin-specific reporting formats beyond Stryker
  defaults (Phase 4)
- **IDE Integrations** - VS Code, WebStorm plugins for mutation testing UI
  (Phase 4)
- **CI/CD Platform Guides** - Specific integration guides for GitHub Actions,
  GitLab CI, etc. (Phase 4)

### Capabilities Explicitly Not Supported

- **Branch Coverage Analysis** - Awaiting native Bun support for branch-level
  coverage metrics
- **Bun Versions < 1.0** - Only Bun 1.0+ supported for API stability (FR005,
  NFR015)
- **Stryker Versions < 7.0** - Only Stryker 7.0+ supported for modern plugin API
  (FR005, NFR015)
- **Non-Bun Test Frameworks** - Jest, Vitest, or Mocha running under Bun runtime
  not supported
- **Custom Mutation Operators** - Only Stryker's built-in mutators supported;
  custom mutators out of scope
- **Programmatic API** - No programmatic API for embedding plugin in other
  tools; CLI-only via Stryker
- **Snapshot Testing Enhancements** - Bun handles snapshots natively; no
  plugin-specific snapshot features needed

### Platform and Environment Limitations

- **Windows-Specific Optimizations** - Cross-platform support via Bun, but no
  Windows-specific features or optimizations (NFR017 notes primary support for
  macOS/Linux)
- **Node.js Runtime** - Plugin must run in Node.js environment (Stryker host),
  cannot run natively in Bun
- **Alternative Runtimes** - No Deno, Cloudflare Workers, or other runtime
  support

### Adjacent Problem Spaces Not Addressed

- **Test Coverage Visualization** - No custom coverage visualization tools; rely
  on existing Bun/third-party tools
- **Test Quality Metrics Dashboard** - No standalone dashboard for test quality
  metrics
- **Cross-Runtime Testing** - No support for testing across Bun/Node.js/Deno
  simultaneously
- **Test Migration Tooling** - No automated migration from Jest/Vitest to Bun
  test format
