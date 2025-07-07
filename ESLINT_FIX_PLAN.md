# ESLint Fix Plan - 71 Errors

## Overview

- **Total Errors**: 71
- **Categories**:
  - Unused variables: 12 errors
  - Missing JSDoc: 42 errors
  - Type assertions: 7 errors
  - Other issues: 10 errors (return types, promises, syntax)

## Phase 1: Quick Fixes (12 errors)

### 1.1 Unused Variables in Scripts (11 errors)

```javascript
// Fix pattern: Prefix with underscore
const _spawn = require('child_process').spawn;  // Instead of spawn
} catch (_error) {  // Instead of error
```

**Files to fix**:

- `scripts/diagnose-process-explosion.cjs`: 4 errors
- `scripts/test-individual-files.cjs`: 2 errors
- `scripts/test-individual-tests.cjs`: 2 errors
- `scripts/test-process-pool.cjs`: 3 errors

### 1.2 Undefined Variable (1 error)

- `scripts/diagnose-process-explosion.cjs:111` - `startTime` is not defined

## Phase 2: Syntax Error (1 error)

### 2.1 BunWorker.ts Parse Error

- `src/process/BunWorker.ts:160` - Declaration or statement expected
- Likely a missing brace or semicolon

## Phase 3: JSDoc Documentation (42 errors)

### 3.1 Coverage Files (21 errors)

**CoverageHookGenerator.ts** (10 errors):

- Add descriptions and @returns to 5 methods

**MutantCoverageCollector.ts** (7 JSDoc errors):

- Add descriptions and @returns to methods

**TestFilter.ts** (4 errors):

- Add @returns declarations

### 3.2 Process Files (16 errors)

**BunProcessPool.ts** (5 errors):

- Add descriptions and @returns

**ProcessPoolSingleton.ts** (4 errors):

- Add descriptions and @returns

**WorkerManager.ts** (5 errors):

- Add descriptions and @returns

### 3.3 Utils Files (6 errors)

**SourceMapHandler.ts** (6 errors):

- Add descriptions and @returns

## Phase 4: Type Safety (10 errors)

### 4.1 Unsafe Type Assertions (7 errors)

**MutantCoverageCollector.ts**:

- Replace type assertions with proper type guards
- Create validation functions

### 4.2 Missing Return Types (3 errors)

- `BunProcessPool.ts:121` - Add return type
- `BunProcessPool.ts:237` - Add return type
- `WorkerManager.ts:110` - Add return type

## Phase 5: Code Quality (5 errors)

### 5.1 Promise Handling (2 errors)

- `BunProcessPool.ts:154` - Add catch() or return
- `BunProcessPool.ts:154` - Each then() should return a value

### 5.2 Parameter Count (1 error)

- `BunProcessPool.ts:203` - sendWorkerMessage has 6 params (max 4)
- Refactor to use options object

### 5.3 Test File Issues (3 errors)

- `ProcessPoolSingleton.test.ts` - Unused variables in tests

## Execution Plan

### Step 1: Fix Critical Issues First

1. Fix syntax error in BunWorker.ts
2. Fix undefined variable in diagnose-process-explosion.cjs
3. Fix unused variables (prefix with \_)

### Step 2: Add JSDoc Documentation

1. Start with public methods
2. Add descriptions explaining purpose
3. Add @param tags for all parameters
4. Add @returns tags for all methods

### Step 3: Fix Type Safety

1. Replace unsafe type assertions with type guards
2. Add explicit return types
3. Fix promise handling

### Step 4: Refactor Complex Code

1. Reduce sendWorkerMessage parameters
2. Fix promise chain issues

## Commands to Run

```bash
# Run ESLint with auto-fix
bunx eslint --fix

# Check specific file types
bunx eslint src/coverage --fix
bunx eslint src/process --fix
bunx eslint scripts --fix

# Verify fixes
bunx eslint
```

## Example Fixes

### Unused Variable Fix:

```javascript
// Before
} catch (error) {
  console.log('Error occurred');
}

// After
} catch (_error) {
  console.log('Error occurred');
}
```

### JSDoc Fix:

```typescript
/**
 * Creates a coverage hook file for test instrumentation.
 * @returns Promise that resolves to the path of the created hook file
 */
public async createHookFile(): Promise<string> {
```

### Type Assertion Fix:

```typescript
// Before
const data = result as Record<string, unknown>;

// After
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

if (!isRecord(result)) {
  throw new Error('Invalid result format');
}
const data = result;
```

### Parameter Reduction:

```typescript
// Before
sendWorkerMessage(id, type, data, timeout, retry, callback);

// After
sendWorkerMessage({
  id,
  type,
  data,
  options: { timeout, retry },
  callback
});
```

## Priority Order

1. **High Priority** (Fix immediately):
   - Syntax error (1)
   - Undefined variable (1)
   - Unused variables (12)

2. **Medium Priority** (Core functionality):
   - Type assertions (7)
   - Missing return types (3)
   - Promise handling (2)

3. **Low Priority** (Documentation):
   - JSDoc (42)
   - Can be added incrementally

## Expected Result

After implementing all fixes:

- 0 ESLint errors
- Better type safety
- Complete documentation
- Cleaner code structure
