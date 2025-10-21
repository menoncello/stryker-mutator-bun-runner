# Decision Architecture - stryker-mutator-bun-runner

**Author:** Eduardo Menoncello
**Date:** 2025-01-21
**Project Level:** 3 (Comprehensive Product)
**Total Stories:** 52 across 5 epics

---

## Executive Summary

This architecture defines a **Stryker TestRunner plugin** for native Bun test execution, delivering 2-3x performance improvements over Node.js-based runners through intelligent per-test coverage analysis. The plugin is developed **using Bun** (dogfooding NFR010) while maintaining Node.js compatibility for Stryker integration.

**Key Architectural Decisions:**
- **Bun-native development** with Node.js runtime compatibility
- **Custom per-test coverage** implementation using LCOV parsing
- **Single repository** structure (no monorepo complexity)
- **Hybrid subprocess architecture** (Node.js plugin → Bun subprocess execution)
- **Zero TypeScript 'any' types** across entire codebase (strict type safety)

---

## Decision Summary

| Category | Decision | Version/Details | Affects Epics | Rationale |
| -------- | -------- | --------------- | ------------- | --------- |
| **Development Runtime** | Bun | 1.3+ | All | Dogfooding (NFR010), 13x faster tests, native TypeScript |
| **Production Runtime** | Node.js | 18+ | All | Stryker compatibility requirement |
| **Build Tooling** | bun build + tsc | Bun 1.3 + TS 5.3 | Epic 1 | Fast dual ESM/CJS output + .d.ts generation |
| **Testing Framework** | bun test | Native | All | Dogfooding, 13x faster than Jest, Vitest-compatible API |
| **Linting/Formatting** | ESLint + Prettier | Latest | All | Stryker ecosystem conventions (NFR019) |
| **Package Structure** | Single Repository | No monorepo | All | Simplicity for Level 3 project |
| **Subprocess Execution** | child_process.spawn | Node.js stdlib | Epic 1, 2 | Stryker plugin runs in Node, spawns Bun |
| **JSON Parsing** | Bun.file().json() | Native | Epic 1, 2 | Fast, zero dependencies |
| **Coverage Collection** | Custom per-test | LCOV + isolation | Epic 3 | 40-60% performance gain (NFR003) |
| **Source Maps** | Node.js source-map | 0.7.x | Epic 2 | FR022 TypeScript stack traces |
| **Error Handling** | Structured hierarchy | Custom | All | FR024 actionable errors |
| **Logging** | Sanitized structured | Custom | All | FR025, FR037 security |
| **Timeout Strategy** | 3-level hierarchy | spawn > test > kill | Epic 2, 4 | FR026, FR031 robustness |
| **Worker Isolation** | Temp dir per worker | fs + crypto | Epic 2, 4 | FR029, FR035 thread safety |
| **Config Schema** | TypeScript → JSON | typescript-json-schema | Epic 1 | FR006 IDE autocomplete |
| **Documentation** | JSDoc/TSDoc | Native | Epic 5 | NFR013 IDE integration |
| **CI/CD** | GitHub Actions | Latest | Epic 5 | Standard, npm publish automation |

---

## Project Structure

```
stryker-mutator-bun-runner/
├── src/
│   ├── index.ts                         # Plugin entry point (FR002)
│   ├── BunTestRunner.ts                 # Main TestRunner class (FR001)
│   │
│   ├── config/
│   │   ├── BunRunnerOptions.ts          # FR004: Config interface
│   │   ├── ConfigValidator.ts           # FR004: Validation
│   │   └── schema.json                  # FR006: Auto-generated
│   │
│   ├── core/
│   │   ├── BunProcessExecutor.ts        # FR007: Subprocess execution
│   │   ├── JsonOutputParser.ts          # FR008: JSON parsing
│   │   └── VersionDetector.ts           # FR013: Bun version detection
│   │
│   ├── mutation/
│   │   ├── MutationActivator.ts         # FR014: Mutation switching
│   │   ├── MutantRunner.ts              # FR010: MutantRun execution
│   │   └── MutantStatusDetector.ts      # FR015: Status reporting
│   │
│   ├── coverage/
│   │   ├── CoverageCollector.ts         # FR017: Coverage collection
│   │   ├── LcovParser.ts                # FR018: LCOV parsing
│   │   ├── TestFilter.ts                # FR019: Intelligent filtering
│   │   └── CoverageFallback.ts          # FR020: Fallback to 'all' mode
│   │
│   ├── reporting/
│   │   ├── ResultMapper.ts              # FR021: DryRun/MutantRun mapping
│   │   ├── SourceMapHandler.ts          # FR022: Source map support
│   │   └── MetricsCollector.ts          # FR023: Performance metrics
│   │
│   ├── process/
│   │   ├── TimeoutManager.ts            # FR026, FR031: Timeout hierarchy
│   │   ├── ProcessCleaner.ts            # FR027: SIGTERM/SIGKILL
│   │   └── WorkerStateManager.ts        # FR029, FR035: Worker isolation
│   │
│   ├── validation/
│   │   ├── BunInstallValidator.ts       # FR030: Bun PATH detection
│   │   └── VersionValidator.ts          # FR005: Min version check
│   │
│   ├── security/
│   │   ├── SanitizedLogger.ts           # FR037: Sensitive info sanitization
│   │   └── SecureTempFiles.ts           # FR038: Secure temp dirs
│   │
│   └── utils/
│       ├── ErrorFactory.ts              # FR024: Structured errors
│       ├── Logger.ts                    # FR025: Logging infrastructure
│       └── types.ts                     # Shared TypeScript types
│
├── test/
│   ├── unit/                            # Unit tests by module
│   ├── integration/                     # Integration tests (NFR009)
│   └── fixtures/                        # Test fixtures
│
├── examples/                            # NFR014: Working examples
│   ├── simple-project/
│   ├── typescript-project/
│   └── performance-optimized/
│
├── docs/                                # NFR012: Documentation
│   ├── installation.md
│   ├── configuration.md
│   ├── troubleshooting.md
│   ├── performance-optimization.md
│   └── compatibility-matrix.md          # FR040
│
├── scripts/
│   ├── build.ts                         # bun build + tsc
│   ├── generate-schema.ts               # FR006: JSON schema generation
│   └── test-coverage.ts
│
├── .github/workflows/
│   ├── ci.yml                           # Test, lint, build
│   ├── release.yml                      # NPM publish
│   └── compatibility-test.yml           # Cross-version testing
│
├── dist/                                # Build output (gitignored)
├── coverage/                            # Coverage reports (gitignored)
│
├── package.json                         # Main package configuration
├── tsconfig.json                        # TypeScript configuration
├── bunfig.toml                          # Bun configuration
├── .eslintrc.js                         # ESLint (NFR019)
├── .prettierrc                          # Prettier (NFR019)
├── stryker.config.json                  # Dogfooding config (NFR010)
├── LICENSE                              # Apache 2.0
└── README.md
```

---

## Epic to Architecture Mapping

| Epic | Primary Modules | Key Components | Stories |
|------|-----------------|----------------|---------|
| **Epic 1: Foundation & Core Plugin Integration** | `config/`, `core/`, `validation/` | BunTestRunner, BunProcessExecutor, JsonOutputParser, BunInstallValidator | 1.1-1.10 |
| **Epic 2: Mutation Testing & Result Reporting** | `mutation/`, `reporting/`, `process/` | MutationActivator, MutantRunner, ResultMapper, SourceMapHandler, TimeoutManager | 2.1-2.10 |
| **Epic 3: Coverage Analysis & Performance** | `coverage/` | CoverageCollector, LcovParser, TestFilter, CoverageFallback | 3.1-3.12 |
| **Epic 4: Robustness, Security & Production Readiness** | `security/`, `process/`, `validation/` | SanitizedLogger, SecureTempFiles, WorkerStateManager | 4.1-4.10 |
| **Epic 5: Documentation, Examples & Release** | `docs/`, `examples/`, `.github/` | Documentation, example projects, CI/CD workflows | 5.1-5.10 |

---

## Technology Stack Details

### Core Technologies

**Development Environment:**
- **Runtime:** Bun 1.3+ (development), Node.js 18+ (production)
- **Language:** TypeScript 5.3+ (strict mode, NO 'any' types)
- **Package Manager:** bun (3x faster than npm)
- **Build Tool:** bun build (ESM + CJS) + tsc (declarations)

**Testing & Quality:**
- **Test Framework:** bun test (native, 13x faster than Jest)
- **Coverage:** Bun --coverage (LCOV format)
- **Linting:** ESLint 8.x + @typescript-eslint
- **Formatting:** Prettier 3.x
- **Mutation Testing:** Stryker (dogfooding - NFR010)

**Dependencies:**
- **@stryker-mutator/api:** ^8.0.0 (Plugin interface)
- **typed-inject:** ^4.0.0 (DI framework)
- **source-map:** ^0.7.x (FR022 stack traces)

### Integration Points

**Stryker Core Integration:**
```typescript
// Plugin loaded by Stryker in Node.js process
import { declareClassPlugin, PluginKind } from '@stryker-mutator/api/plugin';

declareClassPlugin(
  PluginKind.TestRunner,
  'bun',
  BunTestRunner
);
```

**Bun Subprocess Execution:**
```typescript
// Plugin spawns Bun as child process
import { spawn } from 'child_process';

const bunProcess = spawn('bun', ['test', '--coverage', ...args], {
  cwd: projectRoot,
  env: mutationEnv,
  timeout: spawnTimeout
});
```

**Coverage Data Flow:**
```
1. BunProcessExecutor → spawn('bun', ['test', '--coverage'])
2. Bun generates → coverage/lcov.info
3. LcovParser → parses LCOV format
4. TestFilter → maps tests to mutants
5. MutantRunner → runs only relevant tests
```

---

## Implementation Patterns

### CRITICAL RULES FOR ALL AGENTS

```typescript
/**
 * MANDATORY RULES - NEVER VIOLATE
 *
 * 1. ALWAYS use TypeScript strict mode (NFR018)
 * 2. NEVER use 'any' type - ANYWHERE in the codebase (NFR018)
 *    - Use 'unknown' for truly unknown types, then narrow
 *    - Use proper generics: <T> instead of any
 *    - Use 'Record<string, unknown>' instead of any object
 * 3. ALWAYS sanitize logs and errors (FR037)
 * 4. ALWAYS cleanup resources in try/finally (FR027, FR028, FR038)
 * 5. ALWAYS use path.join for file paths (cross-platform)
 * 6. ALWAYS validate inputs before processing (FR004, FR034)
 * 7. ALWAYS provide actionable error messages (NFR025)
 * 8. ALWAYS use spawn (not exec) for subprocesses (FR007)
 * 9. ALWAYS use ISO 8601 for dates/times
 * 10. ALWAYS follow timeout hierarchy (spawn > test > kill)
 */
```

### Naming Conventions

**Files & Classes:**
- Classes/Interfaces: `PascalCase` (BunTestRunner, MutationActivator)
- Files: Match class name (BunTestRunner.ts)
- Utilities: `camelCase` (logger.ts, errorFactory.ts)
- Test files: `ClassName.test.ts` (mirror source structure)

**Functions & Variables:**
- Functions: `camelCase`, verb-first (executeBunTest, parseLcovOutput)
- Booleans: `is/has/can/should` prefix (isMutationActivated)
- Constants: `UPPER_SNAKE_CASE` (DEFAULT_TIMEOUT, MAX_RETRIES)
- Variables: `camelCase`, descriptive (mutantExecutionTimeout)

**Enums & Types:**
```typescript
enum CoverageMode {
  Off = 'off',
  All = 'all',
  PerTest = 'perTest'
}

enum ErrorType {
  BUN_NOT_FOUND = 'BUN_NOT_FOUND',
  SUBPROCESS_CRASH = 'SUBPROCESS_CRASH'
}
```

### Code Organization

**Module Exports:**
```typescript
// Each module exports single primary class
// src/core/BunProcessExecutor.ts
export class BunProcessExecutor { }
export type BunProcessResult = { };

// Index files for barrel exports
// src/coverage/index.ts
export { CoverageCollector } from './CoverageCollector';
export { LcovParser } from './LcovParser';
export type { CoverageData } from './types';
```

**Test Organization:**
```typescript
describe('BunProcessExecutor', () => {
  describe('executeBunTest', () => {
    it('should execute Bun test with correct arguments', async () => {});
    it('should handle subprocess failures', async () => {});
  });
});
```

---

## Consistency Rules

### Error Handling (FR024, NFR025)

**Structured Error Hierarchy:**
```typescript
class BunRunnerError extends Error {
  constructor(
    public code: string,              // "ERR_BUN_001"
    public type: ErrorType,           // Enum
    message: string,                  // Human-readable
    public troubleshooting: string,   // Actionable guidance
    public context?: Record<string, unknown>
  ) {
    super(message);
  }
}

// Example usage
throw new BunRunnerError(
  'ERR_SUBPROCESS_001',
  ErrorType.SUBPROCESS_CRASH,
  'Bun test process crashed unexpectedly',
  'Check test syntax and ensure Bun version >= 1.0.0. Run: bun --version',
  { exitCode: 1, stderr: sanitize(stderr) }
);
```

### Logging Strategy (FR025, FR037)

**Sanitized Structured Logging:**
```typescript
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4  // Structured JSON
}

class SanitizedLogger {
  private sanitize(data: unknown): unknown {
    // FR037: Remove absolute paths, env vars, secrets
    // Keep relative paths, public identifiers
  }

  debug(message: string, data?: unknown): void {
    if (this.level >= LogLevel.DEBUG) {
      console.log(`[DEBUG] ${message}`, this.sanitize(data));
    }
  }
}
```

### Date/Time Handling

**ISO 8601 Everywhere:**
```typescript
const timestamp = new Date().toISOString();  // "2025-01-21T10:30:00.000Z"

interface TestResult {
  startTime: Date;    // Internal storage
  endTime: Date;
}

function toJSON() {
  return {
    startTime: this.startTime.toISOString(),  // Serialized
    endTime: this.endTime.toISOString()
  };
}
```

### Timeout Hierarchy (FR026, FR031, FR027)

**Three-Level System:**
```typescript
interface TimeoutConfig {
  spawnTimeout: number;   // Level 1: Prevent hangs (dryRunTime × 3)
  testTimeout: number;    // Level 2: Test execution (dryRunTime × 2.0)
  killTimeout: number;    // Level 3: SIGTERM → SIGKILL grace (5000ms)
}

// Hierarchy: spawnTimeout > testTimeout > killTimeout
```

### Resource Cleanup (FR027, FR028, FR038)

**Always Use try/finally:**
```typescript
class BunTestRunner {
  async mutantRun(mutant: Mutant): Promise<MutantRunResult> {
    const tempDir = await this.createSecureTempDir();  // FR038: 0o700

    try {
      const process = this.spawnBunProcess(mutant);
      return await this.waitForResult(process);
    } finally {
      await this.killProcess(process);       // FR027
      await this.cleanupTempDir(tempDir);    // FR038
    }
  }

  async dispose(): Promise<void> {
    // FR028: Cleanup on Stryker termination
    for (const process of this.processes) {
      await this.killProcess(process);
    }
  }
}
```

---

## Data Architecture

### Coverage Data Model

```typescript
interface CoverageData {
  file: string;
  lines: Map<number, number>;      // line number → hit count
  functions: FunctionCoverage[];
}

interface TestCoverageMap {
  testName: string;
  coverage: CoverageData;
}

// Per-test mapping (Epic 3)
type TestToMutantMap = Map<MutantId, TestName[]>;
```

### Mutation Data Model

```typescript
interface Mutant {
  id: string;
  mutatorName: string;
  fileName: string;
  range: [number, number];
  replacement: string;
}

interface MutantRunResult {
  status: 'Killed' | 'Survived' | 'Timeout' | 'Error' | 'NoCoverage';
  duration: number;
  testResults?: TestResult[];
  errorMessage?: string;
}
```

---

## API Contracts

### Stryker TestRunner Interface

```typescript
interface TestRunner {
  init?(): Promise<void>;

  dryRun(options: DryRunOptions): Promise<DryRunResult>;

  mutantRun(options: MutantRunOptions): Promise<MutantRunResult>;

  dispose?(): Promise<void>;
}
```

### Bun Subprocess Communication

**Input (CLI Args):**
```bash
bun test --coverage --coverage-reporter=lcov --test-name-pattern="testName" file.test.ts
```

**Output (JSON):**
```json
{
  "tests": [
    {
      "name": "test name",
      "status": "passed",
      "duration": 123
    }
  ]
}
```

**Coverage Output (LCOV):**
```
SF:src/example.ts
DA:1,1
DA:2,0
end_of_record
```

---

## Security Architecture

### Sensitive Data Sanitization (FR037)

**What Gets Sanitized:**
- Absolute file paths → Relative paths only
- Environment variables → Removed from logs
- Secrets (API keys, tokens) → Pattern-based detection
- User data → Removed from error messages

**What Stays:**
- Relative paths (src/, test/)
- Public test identifiers
- Exit codes, error types
- Performance metrics

### Secure Temporary Files (FR038)

```typescript
// Worker-isolated temp directories
const tempDir = path.join(
  os.tmpdir(),
  `stryker-bun-${workerId}-${randomId}`
);

fs.mkdirSync(tempDir, { mode: 0o700 });  // Owner-only permissions

// Always cleanup
try {
  // Use temp files
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
```

---

## Performance Considerations

### Target Performance (NFR001-NFR005)

| Metric | Target | Strategy |
|--------|--------|----------|
| **Mutation testing speed** | 2-3x faster than Jest/Vitest | Bun subprocess + perTest filtering |
| **PerTest coverage gain** | 40-60% improvement | Intelligent test selection (FR019) |
| **Dry run overhead** | <10% vs native bun test | Minimal instrumentation |
| **Large suite stability** | 1000+ mutations | Memory management (NFR007) |

### Coverage Collection Strategy (Epic 3)

**Custom Per-Test Implementation:**
```typescript
// For 100 tests, 500 mutants:
// Traditional: 500 × 100 = 50,000 executions
// Per-test: 100 (coverage) + 500 × 20 (avg) = 10,100 executions
// = 60% reduction ✅
```

**Optimization Techniques:**
- Parallel test execution during dry run
- LCOV parsing cache
- Conservative filtering (FR033: include when uncertain)

---

## Deployment Architecture

### NPM Package Distribution

**Package Name:** `@stryker-mutator/bun-runner`

**Outputs:**
- `dist/index.js` (CommonJS)
- `dist/index.mjs` (ESM)
- `dist/index.d.ts` (TypeScript declarations)
- `dist/schema.json` (Config schema)

**Installation:**
```bash
npm install --save-dev @stryker-mutator/core @stryker-mutator/bun-runner
```

**Stryker Configuration:**
```json
{
  "testRunner": "bun",
  "bunRunner": {
    "coverageMode": "perTest",
    "timeoutMultiplier": 2.0
  }
}
```

---

## Development Environment

### Prerequisites

- **Node.js:** 18.0.0+ (Stryker runtime)
- **Bun:** 1.0.0+ (development + test execution)
- **TypeScript:** 5.3.0+
- **Git:** For version control

### Setup Commands

```bash
# Clone repository
git clone https://github.com/menoncello/stryker-mutator-bun-runner.git
cd stryker-mutator-bun-runner

# Install dependencies with Bun
bun install

# Build project
bun run build

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Type check
bun run type-check

# Lint
bun run lint

# Format code
bun run format

# Run mutation testing (dogfooding)
bun run test:mutation
```

### Build Process

```typescript
// scripts/build.ts
// 1. Clean dist/
// 2. bun build (ESM + CJS)
// 3. tsc --emitDeclarationOnly
// 4. Generate JSON schema
```

---

## Architecture Decision Records (ADRs)

### ADR-001: Use Bun for Development Runtime

**Status:** Accepted
**Context:** Need to develop Stryker plugin for Bun test runner
**Decision:** Use Bun as development runtime while targeting Node.js for production
**Rationale:**
- Dogfooding (NFR010) - validates Bun capabilities
- 13x faster test execution during development
- Native TypeScript support (no transpile step)
- Node.js compatibility via ESM/CJS dual output

**Consequences:**
- Positive: Fast dev cycle, validates Bun ecosystem
- Negative: Must maintain Node.js compatibility

---

### ADR-002: Custom Per-Test Coverage Implementation

**Status:** Accepted
**Context:** Bun lacks native per-test coverage support
**Decision:** Implement custom per-test coverage via isolated test execution + LCOV parsing
**Rationale:**
- Achieves 40-60% performance gain (NFR003)
- Bun provides `--coverage` and LCOV output
- Line-level precision via LCOV format (FR018)
- Fallback to 'all' mode ensures robustness (FR020)

**Consequences:**
- Positive: Major performance differentiator, FR017-FR020 compliance
- Negative: Complex implementation (Epic 3 high-risk)

---

### ADR-003: Single Repository (No Monorepo)

**Status:** Accepted
**Context:** Level 3 project (52 stories) needs structure decision
**Decision:** Single repository without monorepo tooling (Turbo, Lerna)
**Rationale:**
- Single npm package output
- Reduced complexity for Level 3 scope
- Faster setup, simpler CI/CD
- Examples in subdirectories sufficient

**Consequences:**
- Positive: Simpler architecture, faster builds
- Negative: Future modularization requires restructure

---

### ADR-004: Zero 'any' Types Policy

**Status:** Accepted
**Context:** TypeScript strict mode (NFR018)
**Decision:** NEVER use 'any' type anywhere in codebase
**Rationale:**
- Prevents type safety erosion
- Forces proper type design
- Catches bugs at compile time
- Ensures AI agents maintain type safety

**Consequences:**
- Positive: Maximum type safety, better IntelliSense
- Negative: Requires more thoughtful typing (use 'unknown', generics)

---

### ADR-005: Three-Level Timeout Hierarchy

**Status:** Accepted
**Context:** Multiple timeout scenarios (FR026, FR031, FR027)
**Decision:** Implement spawn > test > kill timeout hierarchy
**Rationale:**
- Prevents indefinite hangs (FR031)
- Allows test-specific timeouts (FR026)
- Graceful process termination (FR027)
- Clear timeout semantics for agents

**Consequences:**
- Positive: Robust timeout handling, prevents hangs
- Negative: Requires careful timeout calculation

---

## Validation Checklist

- ✅ All 40 FRs mapped to architecture components
- ✅ All 26 NFRs addressed with specific strategies
- ✅ All 5 epics mapped to modules and files
- ✅ No 'any' types policy enforced (strengthened NFR018)
- ✅ Dogfooding strategy defined (NFR010)
- ✅ Performance targets documented (NFR001-NFR005)
- ✅ Security requirements addressed (FR037, FR038, NFR021-NFR023)
- ✅ Cross-cutting concerns defined (error handling, logging, timeouts)
- ✅ Implementation patterns prevent AI agent conflicts
- ✅ Single repository structure simplified for Level 3

---

_Generated by BMAD Decision Architecture Workflow v1.3.2_
_Date: 2025-01-21_
_For: Eduardo Menoncello_
_Workflow: bmad/bmm/workflows/3-solutioning/architecture_
