# Technical Research Report: Bun Test Runner Plugin for StrykerJS

**Date:** 2025-10-20 **Prepared by:** Eduardo Menoncello **Project Context:**
Greenfield Level 3 Complex System

---

## Executive Summary

This research investigates the technical requirements and architecture for
building a native Bun test runner plugin for StrykerJS mutation testing
framework. The plugin must integrate with Stryker's Test Runner API, leverage
Bun's native testing capabilities, and implement efficient concurrency and
coverage analysis.

### Key Recommendation

**Primary Approach:** Build a hybrid architecture that combines:

- **Stryker's Plugin API** for mutation testing integration
- **Bun's Native Test Runner** via CLI/subprocess execution (not programmatic
  API)
- **Worker Pool Management** aligned with Stryker's concurrency model
- **Custom Coverage Instrumentation** for perTest coverage analysis

### Key Benefits:

- Native Bun speed for test execution
- Full compatibility with Stryker ecosystem
- Efficient mutation testing with perTest coverage
- Clean process isolation per mutation

---

## 1. Research Objectives

### Technical Question

How to create a production-ready Bun test runner plugin for StrykerJS that:

1. Integrates with Stryker's Test Runner Plugin API
2. Leverages Bun's native testing capabilities
3. Supports efficient concurrency and worker management
4. Implements perTest coverage analysis for mutation-test mapping
5. Follows best practices for test runner architecture

### Project Context

**Greenfield Level 3 Project:**

- Production-ready plugin for Stryker ecosystem
- Complex system with multiple subsystems (test execution, coverage, process
  management)
- TypeScript-based implementation
- Expert-level development
- Open source (Apache 2.0 license)

### Requirements and Constraints

#### Functional Requirements

**Core Integration:**

- Implement Stryker's TestRunner interface (`@stryker-mutator/api/test-runner`)
- Execute Bun tests within Stryker's mutation testing framework
- Support mutation switching and test execution per mutant
- Report test results in Stryker's expected format (DryRunResult,
  MutantRunResult)
- Handle test discovery and file loading

**Test Runner Capabilities:**

- Run individual test files and specific test cases
- Support test filtering (by name, by file)
- Handle timeouts gracefully
- Support dry run for test discovery

**Coverage & Performance:**

- Collect code coverage data per test (perTest coverage)
- Enable mutant-test mapping for efficient testing
- Minimize test execution overhead
- Support parallel/concurrent test execution

#### Non-Functional Requirements

**Performance:**

- Fast test execution leveraging Bun's native speed
- Efficient process management (avoid excessive process spawn overhead)
- Minimal memory footprint
- Quick startup time

**Concurrency & Scalability:**

- Understand and align with Stryker's concurrency model
- Support Stryker's worker pool management
- Handle large test suites (100+ test files)
- Efficient resource utilization across concurrent workers

**Coverage Analysis:**

- Implement perTest coverage collection
- Support mutation-test mapping for efficient test selection
- Accurate coverage reporting to Stryker

**Reliability:**

- Stable test execution in concurrent environment
- Proper error handling and reporting
- Graceful timeout handling
- Clean process cleanup

#### Technical Constraints

**Required Technologies:**

- Language: TypeScript
- Runtime: Node.js (Stryker host) + Bun (test execution)
- Framework: Stryker Plugin API (`@stryker-mutator/api`)

**Integration Requirements:**

- Must implement Stryker's TestRunner interface
- Must be compatible with Stryker's plugin system
- Must work with Stryker's mutation framework

**Quality Requirements:**

- Follow Stryker plugin best practices
- Comprehensive test coverage
- Well documented

---

## 2. Technology Landscape Analysis

### 2.1 Stryker Test Runner Plugin API

#### Core Interface

Stryker test runners must implement the `TestRunner` interface from
`@stryker-mutator/api/test-runner`:

```typescript
import {
  TestRunner,
  DryRunResult,
  DryRunOptions,
  MutantRunOptions,
  MutantRunResult,
} from '@stryker-mutator/api/test-runner';

class BunTestRunner implements TestRunner {
  public init(): Promise<void>;
  public dryRun(options: DryRunOptions): Promise<DryRunResult>;
  public mutantRun(options: MutantRunOptions): Promise<MutantRunResult>;
  public dispose(): Promise<void>;
}
```

#### Plugin Declaration

```typescript
import { PluginKind, declareClassPlugin } from '@stryker-mutator/api/plugin';

export const strykerPlugins = [
  declareClassPlugin(PluginKind.TestRunner, 'bun', BunTestRunner),
];
```

#### Method Responsibilities

**`init()`**

- Initialize the test runner
- Load configuration
- Prepare test environment

**`dryRun(options: DryRunOptions)`**

- Run all tests without mutations
- Collect coverage data (if coverage analysis enabled)
- Discover test cases
- Return DryRunResult with test results and coverage

**`mutantRun(options: MutantRunOptions)`**

- Activate specific mutant
- Run tests (filtered by coverage if perTest)
- Return MutantRunResult (killed, survived, timeout, error)

**`dispose()`**

- Clean up resources
- Stop processes
- Release memory

#### Dependency Injection

Stryker uses `typed-inject` for DI. Test runners can inject:

- Logger
- Configuration
- File system helpers

### 2.2 Stryker Concurrency Model

#### Worker Pool Architecture

**Key Findings:**

- Stryker creates worker processes (child processes, not worker_threads)
- Number of workers determined by `--concurrency` option
- Default: `n-1` where `n` = CPU cores (or `n` if `n <= 4`)
- Each worker gets unique `STRYKER_MUTATOR_WORKER` environment variable

**Worker Environment:**

```javascript
const workerIndex = process.env.STRYKER_MUTATOR_WORKER; // "0", "1", "2", etc.
const port = 4444 + +process.env.STRYKER_MUTATOR_WORKER; // Avoid port conflicts
```

**Implications for Bun Runner:**

- Each worker will instantiate a BunTestRunner instance
- Workers run in parallel, testing different mutants
- Need to ensure Bun processes don't conflict
- Can use STRYKER_MUTATOR_WORKER for resource distribution

### 2.3 Stryker Coverage Analysis System

#### Coverage Modes

**`off`**

- No coverage analysis
- All tests run for every mutant
- Slowest but simplest

**`all`**

- Determines which mutants are covered by tests
- Mutants without coverage reported as NoCoverage
- Skip uncovered mutants

**`perTest`** (Default since v5, **RECOMMENDED**)

- Maps which specific tests cover which mutants
- Only run tests that can detect each mutant
- 40-60% performance improvement
- **This is the target mode for Bun runner**

#### PerTest Coverage Requirements

**During dryRun:**

1. Run each test individually
2. Collect coverage for each test run
3. Return coverage map: `{ [testId]: CoverageData }`

**During mutantRun with perTest:**

- Stryker provides `testFilter` in MutantRunOptions
- Only run tests in the filter
- Significant performance gain

**Coverage Data Format:**

- Must be compatible with Stryker's coverage format
- Typically source map-aware
- Per-file, per-line coverage data

### 2.4 Bun Native Testing Capabilities

#### Test Runner API

**CLI-Based Execution:**

```bash
bun test                           # Run all tests
bun test ./path/to/file.test.ts    # Run specific file
bun test --test-name-pattern regex # Filter by test name
bun test --timeout 5000            # Set timeout
```

**Key Limitation:**

- Bun test runner is **CLI-based**, not programmatic
- No JavaScript API like `require('bun:test').run()`
- Must spawn Bun subprocess to run tests

**Test Discovery:**

- Automatically finds `*.test.ts`, `*.spec.ts` files
- Can specify explicit paths
- Pattern matching support

**Test Filtering:**

- `--test-name-pattern <regex>`: Filter by test name
- `test.if()`: Conditional test execution
- `test.skip()`, `describe.skip()`: Skip tests

**Concurrency:**

- Built-in parallel execution
- Configurable max concurrency (default: 20)
- All tests run in single Bun process by default

#### Coverage Capabilities

**Built-in Coverage:**

```bash
bun test --coverage                    # Enable coverage
bun test --coverage-reporter=lcov      # LCOV format
```

**Coverage Features:**

- Function and line coverage (no branch/statement yet)
- LCOV reporter support
- Threshold configuration
- Exclude patterns

**Coverage Limitations:**

- No branch coverage (feature request open)
- No statement coverage
- Cannot collect coverage from spawned subprocesses
- No per-test coverage API (would need custom instrumentation)

**Critical Gap:**

- Bun doesn't provide per-test coverage natively
- Need custom instrumentation for perTest mode

#### Process Management

**`Bun.spawn()`:**

```typescript
const proc = Bun.spawn(['bun', 'test', 'file.test.ts'], {
  cwd: '/path/to/project',
  env: { ...process.env },
  stdout: 'pipe',
  stderr: 'pipe',
});

const output = await new Response(proc.stdout).text();
const exitCode = await proc.exited;
```

**Features:**

- 60% faster than Node.js child_process
- Streaming I/O (ReadableStream)
- IPC support (Bun-to-Bun only)
- Resource monitoring
- AbortSignal support
- Timeout support

**Key for Our Use:**

- Use `Bun.spawn()` to execute `bun test`
- Capture stdout/stderr for test results
- Parse JSON output or TAP format
- Handle timeouts and errors

---

## 3. Architecture Patterns for Test Runners

### 3.1 Process Isolation Pattern

**Modern Test Runner Architecture:**

- Main process (orchestrator)
- Worker pool (isolated processes)
- IPC for communication

**Benefits:**

- Prevents test interference
- Clean state per test run
- Crash isolation
- Resource management

**For Stryker + Bun:**

- Stryker creates worker processes (TestRunner instances)
- Each TestRunner spawns Bun subprocess
- Double process isolation: Stryker worker → Bun process

### 3.2 Adapter Pattern

**Our Context:**

- Stryker expects TestRunner interface
- Bun provides CLI-based test runner
- Need adapter to bridge them

```
┌─────────────────────────────────────────────┐
│ Stryker Core (Node.js)                     │
│                                             │
│  ┌───────────────────────────────────────┐ │
│  │ Worker Pool                           │ │
│  │  ┌──────────────┐  ┌──────────────┐  │ │
│  │  │ BunTestRunner│  │ BunTestRunner│  │ │
│  │  │   (Worker 0) │  │   (Worker 1) │  │ │
│  │  └──────┬───────┘  └──────┬───────┘  │ │
│  └─────────┼──────────────────┼──────────┘ │
└────────────┼──────────────────┼────────────┘
             │                  │
          spawn               spawn
             │                  │
         ┌───▼────┐         ┌───▼────┐
         │ Bun CLI│         │ Bun CLI│
         │ Process│         │ Process│
         └────────┘         └────────┘
```

### 3.3 Modular Design Pattern

**Subsystems:**

1. **Test Executor Module**
   - Spawn Bun process
   - Parse output
   - Handle errors

2. **Coverage Collector Module**
   - Instrument code (if perTest needed)
   - Collect per-test coverage
   - Generate coverage report

3. **Mutation Activator Module**
   - Activate mutant in code
   - Environment setup
   - File system manipulation

4. **Result Parser Module**
   - Parse Bun output (JSON/TAP)
   - Map to Stryker result format
   - Error handling

5. **Configuration Module**
   - Load Bun config
   - Merge with Stryker config
   - Validation

### 3.4 Facade Pattern

**BunTestRunner as Facade:**

- Hide complexity of subprocess management
- Hide complexity of coverage instrumentation
- Simple interface: init, dryRun, mutantRun, dispose

---

## 4. Detailed Technology Profiles

### 4.1 Stryker Plugin System

**Overview:**

- Mature mutation testing framework (since 2016)
- Plugin-based architecture
- Strong TypeScript support
- Active community

**Maturity:** Mature, production-ready

**Community:** Large JavaScript/TypeScript community

**Strengths:**

- Well-documented plugin API
- TypeScript first-class support
- Dependency injection system
- Extensive test runner examples (Jest, Mocha, Vitest, Karma)

**Challenges:**

- Node.js based (need to bridge to Bun)
- Complex coverage integration for perTest
- Process management overhead

**Integration Points:**

- `@stryker-mutator/api` package
- Plugin declaration system
- DI container (typed-inject)

### 4.2 Bun Runtime

**Overview:**

- Fast JavaScript runtime (Zig + JavaScriptCore)
- Built-in test runner (Jest-compatible API)
- Native TypeScript support
- Focus on speed

**Maturity:** Stable (v1.0+), rapidly evolving

**Community:** Fast-growing, enthusiastic community

**Strengths:**

- Extremely fast test execution
- Zero-config TypeScript
- Built-in coverage (LCOV)
- Fast subprocess spawning (Bun.spawn)
- Modern async/await support

**Challenges:**

- CLI-only test runner (no programmatic API)
- Limited coverage metrics (no branch coverage)
- No per-test coverage natively
- Relatively new (may have edge cases)

**For Our Use:**

- Primary test execution engine
- Coverage collection (with custom instrumentation)
- Fast subprocess management

### 4.3 Coverage Instrumentation Options

#### Option 1: Istanbul/NYC (Babel-based)

**Pros:**

- Industry standard
- Full coverage metrics (statement, branch, function, line)
- Per-test coverage possible
- Well-tested

**Cons:**

- Heavy transformation overhead
- May slow down Bun's speed advantage
- Complex setup with Bun

#### Option 2: Native Bun Coverage + Custom Hooks

**Pros:**

- Leverage Bun's native speed
- Integrated with Bun's transpilation
- Simpler setup

**Cons:**

- Limited to line/function coverage
- No per-test API (need workaround)
- Need to parse LCOV output per test

#### Option 3: SWC-based Instrumentation

**Pros:**

- Fast Rust-based transformation
- Modern tooling
- Compatible with TypeScript

**Cons:**

- Additional dependency
- Setup complexity
- Per-test collection needs custom impl

#### Option 4: V8 Coverage API (via Bun's JavaScriptCore)

**Limitation:**

- Bun uses JavaScriptCore, not V8
- V8 coverage API not available
- **Not viable for Bun**

---

## 5. Comparative Analysis

### 5.1 Test Execution Approaches

| Approach             | Speed               | Compatibility | Complexity | Coverage Support |
| -------------------- | ------------------- | ------------- | ---------- | ---------------- |
| Bun CLI Subprocess   | ⭐⭐⭐⭐⭐          | ⭐⭐⭐⭐      | ⭐⭐⭐     | ⭐⭐⭐           |
| Bun Programmatic API | N/A (doesn't exist) | -             | -          | -                |
| Transform to Node.js | ⭐⭐                | ⭐⭐⭐⭐⭐    | ⭐         | ⭐⭐⭐⭐⭐       |

**Recommendation:** Bun CLI Subprocess (only viable option)

### 5.2 Coverage Approaches

| Approach            | PerTest Support        | Performance | Accuracy   | Implementation Effort |
| ------------------- | ---------------------- | ----------- | ---------- | --------------------- |
| Native Bun Coverage | ⭐⭐ (need workaround) | ⭐⭐⭐⭐⭐  | ⭐⭐⭐     | ⭐⭐⭐⭐              |
| Istanbul/NYC        | ⭐⭐⭐⭐⭐             | ⭐⭐        | ⭐⭐⭐⭐⭐ | ⭐⭐                  |
| SWC Instrumentation | ⭐⭐⭐⭐               | ⭐⭐⭐⭐    | ⭐⭐⭐⭐   | ⭐⭐⭐                |

**Recommendation:** Start with Native Bun + workaround, consider Istanbul if
needed

### 5.3 Process Management

| Approach           | Isolation  | Performance | Resource Usage | Complexity |
| ------------------ | ---------- | ----------- | -------------- | ---------- |
| Bun.spawn()        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐       | ⭐⭐⭐     |
| Node child_process | ⭐⭐⭐⭐⭐ | ⭐⭐⭐      | ⭐⭐⭐⭐       | ⭐⭐⭐     |
| Worker threads     | ⭐⭐       | ⭐⭐⭐⭐    | ⭐⭐⭐⭐⭐     | ⭐⭐⭐⭐   |

**Recommendation:** Bun.spawn() for best performance and isolation

---

## 6. Trade-offs and Decision Factors

### Key Trade-offs

#### Bun CLI vs Programmatic API (if it existed)

**Bun CLI (Reality):**

- ✅ Fast execution
- ✅ Full test runner features
- ❌ Subprocess overhead
- ❌ Output parsing required
- ❌ Limited control over test execution

**Programmatic API (Hypothetical):**

- ✅ Fine-grained control
- ✅ No subprocess overhead
- ✅ Direct result access
- ❌ **Doesn't exist**

**Decision:** Must use CLI approach

#### Native Bun Coverage vs Istanbul

**Native Bun:**

- ✅ Fast
- ✅ Integrated
- ❌ No branch coverage
- ❌ No native per-test API

**Istanbul:**

- ✅ Complete coverage metrics
- ✅ Per-test support
- ✅ Industry standard
- ❌ Slower
- ❌ Complex setup

**Decision:** Start with native Bun, fallback to Istanbul if needed

#### Process Pool Reuse vs Fresh Process

**Reuse:**

- ✅ Faster (no spawn overhead)
- ❌ State contamination risk
- ❌ Complex cleanup

**Fresh:**

- ✅ Clean state guaranteed
- ✅ Simple
- ❌ Slower (spawn overhead)

**Decision:** Fresh process per mutant (mutation testing needs isolation)

---

## 7. Use Case Fit Analysis

### Optimal Architecture for Bun + Stryker

Based on requirements and constraints:

**Architecture:**

1. **Test Runner Layer** (Stryker Plugin)
   - Implements TestRunner interface
   - Manages Bun subprocess lifecycle
   - Handles mutation activation

2. **Execution Layer** (Bun CLI)
   - Spawned via Bun.spawn()
   - Runs tests with mutation active
   - Outputs results in parseable format

3. **Coverage Layer** (Hybrid)
   - Collect coverage during dryRun
   - Use Bun's native coverage + custom collection
   - Generate per-test coverage map

4. **Parsing Layer**
   - Parse Bun output (JSON reporter)
   - Map to Stryker result types
   - Error handling and timeout detection

**Why This Fits:**

- ✅ Leverages Bun's speed
- ✅ Maintains Stryker compatibility
- ✅ Supports perTest coverage
- ✅ Clean process isolation
- ✅ Manageable complexity

---

## 8. Real-World Evidence

### Bun Test Runner in Practice

**Production Usage:**

- Growing adoption in JavaScript/TypeScript projects
- Used by companies adopting Bun runtime
- Active development and improvements

**Known Issues:**

- Coverage metrics less comprehensive than Jest
- Occasional edge cases with complex async tests
- Limited ecosystem compared to Jest/Vitest

**Performance Reports:**

- Consistently 2-5x faster than Jest
- Fast startup time
- Efficient memory usage

### Stryker Test Runner Plugins

**Existing Implementations:**

- `@stryker-mutator/jest-runner`: Most mature, full perTest support
- `@stryker-mutator/mocha-runner`: Solid, long-standing
- `@stryker-mutator/vitest-runner`: Recent, modern architecture

**Lessons Learned:**

- PerTest coverage is critical for performance
- Process management is complex
- Error handling and timeout handling are crucial
- Source map support is important for TypeScript

### Community Feedback

**Bun Test Runner:**

- Users praise speed
- Request more coverage metrics
- Want better CI/CD integration

**Stryker:**

- Users value mutation testing insights
- Performance is key concern
- Coverage analysis makes mutation testing practical

---

## 9. Architecture Pattern Analysis

### Recommended Pattern: Layered Adapter Architecture

```
┌───────────────────────────────────────────────────────────┐
│ Stryker Integration Layer                                │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ BunTestRunner (implements TestRunner)                │ │
│ │  - init()                                            │ │
│ │  - dryRun()                                          │ │
│ │  - mutantRun()                                       │ │
│ │  - dispose()                                         │ │
│ └───────────────────────────────────────────────────────┘ │
└────────────────────────┬──────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────┐
│ Orchestration Layer                                       │
│ ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│ │ Test Executor│  │ Coverage     │  │ Mutation        │  │
│ │              │  │ Collector    │  │ Activator       │  │
│ └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────┬──────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────┐
│ Bun Execution Layer                                       │
│ ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│ │ Process      │  │ Output       │  │ Error           │  │
│ │ Manager      │  │ Parser       │  │ Handler         │  │
│ └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────┬──────────────────────────────────┘
                         │
                   ┌─────▼──────┐
                   │  Bun CLI   │
                   │  (spawned) │
                   └────────────┘
```

### Pattern Benefits

1. **Separation of Concerns**
   - Each layer has single responsibility
   - Easy to test independently
   - Clear interfaces between layers

2. **Flexibility**
   - Can swap Bun execution strategy
   - Can change coverage approach
   - Can optimize without breaking contract

3. **Maintainability**
   - Clear structure
   - Easy to debug
   - Well-defined error boundaries

4. **Extensibility**
   - Add features without breaking existing
   - Support future Bun API improvements
   - Easy to add new mutation strategies

---

## 10. Recommendations

### Top Recommendation: Hybrid Subprocess Architecture

**Primary Technology Stack:**

- **Plugin Framework:** Stryker Plugin API (`@stryker-mutator/api`)
- **Test Execution:** Bun CLI via `Bun.spawn()`
- **Coverage:** Native Bun coverage + custom per-test collection
- **Process Management:** Bun.spawn() for subprocess control
- **Result Parsing:** Custom JSON parser for Bun output

**Rationale:**

- Only viable option (Bun has no programmatic API)
- Leverages Bun's performance advantages
- Maintains full Stryker compatibility
- Supports perTest coverage (with effort)
- Clean architecture with clear boundaries

### Alternative Options

#### Alternative 1: Wait for Bun Programmatic API

**When to choose:**

- If Bun team adds programmatic test API
- Performance is critical
- Can delay project

**Risks:**

- No timeline from Bun team
- May never happen
- Project delayed indefinitely

#### Alternative 2: Transform Tests to Node.js Runner

**When to choose:**

- Need more mature coverage tooling
- Bun compatibility issues arise
- Stryker integration more important than speed

**Risks:**

- Loses Bun's speed advantage
- Defeats purpose of Bun runner
- Complex transformation logic

**Verdict:** Not recommended for this project

---

## 11. Implementation Roadmap

### Phase 1: Core Plugin (MVP)

**Goal:** Basic Stryker plugin that can run Bun tests

**Tasks:**

1. Set up project structure
2. Implement basic TestRunner interface
3. Spawn Bun CLI subprocess
4. Parse test results (basic)
5. Return DryRunResult and MutantRunResult
6. Handle timeouts and errors

**Success Criteria:**

- Can run `bun test` via Stryker
- Basic mutation testing works
- No coverage analysis yet (--coverageAnalysis off)

**Estimated Effort:** 2-3 weeks

### Phase 2: Coverage Analysis

**Goal:** Implement perTest coverage

**Tasks:**

1. Design per-test coverage collection strategy
2. Implement coverage instrumentation (choose approach)
3. Collect coverage during dryRun
4. Generate test-to-mutant mapping
5. Filter tests during mutantRun

**Success Criteria:**

- PerTest coverage works
- Significant performance improvement
- Accurate test filtering

**Estimated Effort:** 3-4 weeks

### Phase 3: Optimization & Polish

**Goal:** Production-ready quality

**Tasks:**

1. Optimize subprocess spawning
2. Improve error messages
3. Add comprehensive logging
4. Source map support
5. Configuration options
6. Documentation

**Success Criteria:**

- Fast and reliable
- Great developer experience
- Well documented

**Estimated Effort:** 2-3 weeks

### Phase 4: Advanced Features

**Goal:** Feature parity with other runners

**Tasks:**

1. Watch mode support (if needed)
2. Advanced test filtering
3. Custom reporters
4. Bun-specific features

**Success Criteria:**

- Feature-complete
- Community adoption
- Positive feedback

**Estimated Effort:** Ongoing

---

## 12. Risk Mitigation

### Identified Risks and Mitigation

#### Risk 1: Bun CLI Output Format Changes

**Severity:** High **Probability:** Medium

**Mitigation:**

- Use stable output format (JSON reporter)
- Version pinning for Bun
- Comprehensive output parsing tests
- Monitor Bun release notes

**Contingency:**

- Support multiple Bun versions
- Graceful degradation
- Clear error messages

#### Risk 2: PerTest Coverage Implementation Complexity

**Severity:** High **Probability:** High

**Mitigation:**

- Start with simpler approach (native Bun coverage)
- Incremental implementation
- Fallback to Istanbul if needed
- Thorough research and prototyping

**Contingency:**

- Support --coverageAnalysis all (not perTest)
- Partner with Bun team for API improvements
- Community contribution for advanced features

#### Risk 3: Performance Overhead from Subprocesses

**Severity:** Medium **Probability:** Medium

**Mitigation:**

- Use Bun.spawn() (60% faster than Node)
- Optimize spawn strategy
- Benchmark and profile
- Consider process pooling (if safe)

**Contingency:**

- Document performance characteristics
- Provide configuration options
- Consider hybrid approach

#### Risk 4: Bun Runtime Edge Cases

**Severity:** Medium **Probability:** Medium

**Mitigation:**

- Comprehensive integration tests
- Test with various project types
- Community testing (beta program)
- Close communication with Bun team

**Contingency:**

- Document known issues
- Provide workarounds
- Contribute fixes to Bun

---

## 13. Architecture Decision Records

### ADR-001: Use Bun CLI Subprocess for Test Execution

**Status:** Accepted

**Context:** Bun does not provide a programmatic API for running tests. The only
way to execute Bun tests is via the CLI (`bun test`).

**Decision Drivers:**

- No programmatic API available
- Need to integrate with Stryker
- Must preserve Bun's performance benefits
- Need control over test execution

**Considered Options:**

1. Bun CLI via subprocess (Bun.spawn)
2. Wait for programmatic API (delay project)
3. Transform to Node.js test runner

**Decision:** Use Bun CLI via `Bun.spawn()` subprocess

**Consequences:**

**Positive:**

- Only viable option
- Leverages Bun's speed
- Clean process isolation
- Simple mental model

**Negative:**

- Subprocess overhead
- Output parsing required
- Limited control over execution
- Dependent on CLI stability

**Implementation Notes:**

- Use `Bun.spawn()` for fast spawning
- Parse JSON output for structured results
- Handle stdout/stderr streams
- Implement timeout handling
- Clean process cleanup in dispose()

### ADR-002: Hybrid Coverage Approach (Native Bun + Custom PerTest)

**Status:** Proposed

**Context:** Stryker's perTest coverage requires mapping tests to covered code.
Bun's native coverage doesn't provide per-test API.

**Decision Drivers:**

- PerTest coverage critical for performance
- Bun native coverage is fast but limited
- Istanbul provides complete coverage but slow
- Need balance between speed and functionality

**Considered Options:**

1. Native Bun coverage + custom per-test collection
2. Istanbul/NYC instrumentation
3. SWC-based instrumentation
4. No perTest (run all tests for all mutants)

**Decision:** Start with native Bun coverage + custom per-test collection, with
Istanbul as fallback

**Consequences:**

**Positive:**

- Leverages Bun's speed
- Supports perTest when working
- Pragmatic approach
- Can improve over time

**Negative:**

- Complex implementation
- May not achieve full coverage accuracy
- Need custom instrumentation logic
- Maintenance burden

**Implementation Notes:**

- Phase 1: Support --coverageAnalysis all with native Bun coverage
- Phase 2: Implement custom per-test collection
- Phase 3: Add Istanbul as option if needed
- Document coverage limitations

### ADR-003: Fresh Subprocess Per Mutation

**Status:** Accepted

**Context:** Mutation testing requires clean state for each mutant. Could reuse
Bun process or spawn fresh.

**Decision Drivers:**

- Mutation testing needs isolation
- State contamination is critical issue
- Performance vs correctness trade-off
- Bun.spawn() is fast

**Considered Options:**

1. Fresh Bun process per mutation
2. Reuse Bun process across mutations
3. Hybrid (reuse with validation)

**Decision:** Spawn fresh Bun process for each mutantRun()

**Consequences:**

**Positive:**

- Guaranteed clean state
- No mutation interference
- Simple and predictable
- Easier debugging

**Negative:**

- Subprocess spawn overhead
- Higher resource usage
- Slower than reuse

**Neutral:**

- Trade performance for correctness
- Mutation testing already slow, correctness > speed

**Implementation Notes:**

- Spawn in mutantRun(), dispose after
- Reuse in dryRun() if safe
- Monitor performance impact
- Consider optimization later if needed

---

## 14. References and Resources

### Documentation

**Stryker:**

- [Create a Plugin Guide](https://stryker-mutator.io/docs/stryker-js/guides/create-a-plugin/)
- [Stryker API Documentation](https://www.npmjs.com/package/@stryker-mutator/api)
- [Coverage Analysis](https://stryker-mutator.io/docs/stryker-js/configuration/)
- [Parallel Workers](https://stryker-mutator.io/docs/stryker-js/parallel-workers/)

**Bun:**

- [Test Runner Documentation](https://bun.sh/docs/cli/test)
- [Code Coverage](https://bun.sh/docs/test/coverage)
- [Bun.spawn() API](https://bun.sh/docs/api/spawn)
- [Test Writing Guide](https://bun.sh/docs/test/writing)

### Example Test Runners

- [@stryker-mutator/jest-runner](https://github.com/stryker-mutator/stryker-js/tree/master/packages/jest-runner) -
  Best reference for perTest coverage
- [@stryker-mutator/vitest-runner](https://github.com/stryker-mutator/stryker-js/tree/master/packages/vitest-runner) -
  Modern architecture
- [@stryker-mutator/mocha-runner](https://github.com/stryker-mutator/stryker-js/tree/master/packages/mocha-runner) -
  Mature implementation

### Community Resources

- [Stryker Slack](https://stryker-mutator.io/slack) - Active community
- [Bun Discord](https://bun.sh/discord) - Bun team and community
- [Stryker GitHub Discussions](https://github.com/stryker-mutator/stryker-js/discussions)

### Research Papers & Articles

- [Mutation Testing: A Comprehensive Survey](https://ieeexplore.ieee.org/document/8371345)
- [Stryker Blog: TypeScript Coverage Analysis](https://stryker-mutator.io/blog/typescript-coverage-analysis-support/)
- [Stryker 4.0: Mutation Switching](https://stryker-mutator.io/blog/announcing-stryker-4-beta-mutation-switching/)

---

## 15. Next Steps

### Immediate Actions

1. **Validate Architecture with Prototype**
   - Build minimal POC
   - Spawn Bun subprocess
   - Parse simple output
   - Verify feasibility

2. **Set Up Project Structure**
   - Initialize TypeScript project
   - Configure build system
   - Set up testing infrastructure
   - Create Stryker plugin scaffold

3. **Deep Dive: Coverage Strategy**
   - Research Istanbul integration with Bun
   - Prototype per-test coverage collection
   - Benchmark performance impact
   - Make final coverage decision

### Follow-Up Research

1. **Bun Team Engagement**
   - Reach out about programmatic API plans
   - Discuss coverage API improvements
   - Request per-test coverage support
   - Explore collaboration opportunities

2. **Coverage Tooling Evaluation**
   - Deep dive: Istanbul + Bun integration
   - Test SWC instrumentation
   - Benchmark coverage overhead
   - Select final approach

3. **Performance Benchmarking**
   - Measure Bun.spawn() overhead
   - Compare with Jest runner
   - Identify bottlenecks
   - Optimization opportunities

---

## Document Information

**Workflow:** BMad Research Workflow - Technical Research v2.0 **Generated:**
2025-10-20 **Research Type:** Technical/Architecture Research **Next Review:**
Before Phase 2 implementation (Coverage Analysis)

---

_This technical research report was generated using the BMad Method Research
Workflow, combining systematic technology evaluation frameworks with real-time
research and analysis._
