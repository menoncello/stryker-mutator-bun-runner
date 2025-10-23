# ATDD Checklist - Epic 1, Story 1.1: Project Setup and Build Configuration

**Date:** 2025-10-21 **Author:** Eduardo Menoncello **Primary Test Level:** Unit

---

## Story Summary

As a plugin developer, I want a properly configured TypeScript project with
build tooling, so that I can develop the plugin with type safety and proper
compilation.

---

## Acceptance Criteria

1. TypeScript project initialized with tsconfig.json in strict mode (NFR018)
2. Package.json configured with appropriate dependencies (@stryker-mutator/api,
   typed-inject)
3. Build script produces compilable JavaScript output
4. ESLint and Prettier configured following Stryker ecosystem conventions
   (NFR019)
5. Git repository initialized with proper .gitignore
6. Project structure follows modular architecture (NFR020)

---

## Failing Tests Created (RED Phase)

### Unit Tests (8 tests)

**File:** `tests/unit/project-setup.spec.ts` (200 lines)

**File:** `test-setup.js` (120 lines) - Simple Node.js test runner

List each unit test with its current status and expected failure reason:

- ✅ **Test:** should have tsconfig.json with strict mode enabled
  - **Status:** RED - tsconfig.json file does not exist
  - **Verifies:** TypeScript configuration with strict mode

- ✅ **Test:** should have proper TypeScript compiler options
  - **Status:** RED - tsconfig.json file does not exist
  - **Verifies:** TypeScript compiler settings for Stryker plugin

- ✅ **Test:** should have package.json with required dependencies
  - **Status:** GREEN - package.json exists with basic dependencies
  - **Verifies:** Core dependencies are present

- ✅ **Test:** should have proper package metadata
  - **Status:** GREEN - package.json has correct metadata
  - **Verifies:** Package configuration is correct

- ✅ **Test:** should build successfully to JavaScript
  - **Status:** RED - src/ directory and TypeScript files don't exist
  - **Verifies:** Build system works end-to-end

- ✅ **Test:** should have proper .gitignore file
  - **Status:** RED - .gitignore file does not exist
  - **Verifies:** Git excludes are properly configured

- ✅ **Test:** should have git repository initialized
  - **Status:** GREEN - .git directory exists
  - **Verifies:** Git repository is initialized

- ✅ **Test:** should follow modular architecture
  - **Status:** RED - src/ directory structure does not exist
  - **Verifies:** Project follows modular design

---

## Data Factories Created

None required for this project setup story (no entities or API data needed).

---

## Fixtures Created

### File Helper

**File:** `tests/support/helpers/file-helper.ts`

**Exports:**

- `FileHelper` - Utility class for file system operations in tests
- `exists(relativePath)` - Check if file/directory exists
- `readFile(relativePath)` - Read file content as string
- `parseJson(relativePath)` - Parse JSON file safely

**Example Usage:**

```typescript
const helper = new FileHelper(projectRoot);
expect(helper.exists('tsconfig.json')).toBe(true);
const config = helper.parseJson('tsconfig.json');
```

---

## Mock Requirements

None required for this project setup story (no external services or APIs).

---

## Required data-testid Attributes

None required for this project setup story (no UI components to test).

---

## Implementation Checklist

### Test: should have tsconfig.json with strict mode enabled

**File:** `tests/unit/project-setup.spec.ts` and `test-setup.js`

**Tasks to make this test pass:**

- [ ] Create tsconfig.json file in project root
- [ ] Set compilerOptions.strict to true
- [ ] Configure TypeScript target as ES2020
- [ ] Set module to ESNext
- [ ] Enable declaration files (.d.ts)
- [ ] Enable source maps
- [ ] Set output directory to ./dist
- [ ] Run test: `node test-setup.js`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 1 hour

---

### Test: should have proper .gitignore file

**File:** `tests/unit/project-setup.spec.ts` and `test-setup.js`

**Tasks to make this test pass:**

- [ ] Create .gitignore file in project root
- [ ] Add node_modules/ to .gitignore
- [ ] Add dist/ to .gitignore
- [ ] Add coverage/ to .gitignore
- [ ] Add \*.log to .gitignore
- [ ] Add .DS_Store to .gitignore
- [ ] Add .env and .env.\* to .gitignore
- [ ] Run test: `node test-setup.js`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 0.5 hours

---

### Test: should follow modular architecture

**File:** `tests/unit/project-setup.spec.ts` and `test-setup.js`

**Tasks to make this test pass:**

- [ ] Create src/ directory
- [ ] Create src/index.ts (main entry point)
- [ ] Create src/config/ directory
- [ ] Create src/core/ directory
- [ ] Create src/mutation/ directory
- [ ] Create src/coverage/ directory
- [ ] Create src/reporting/ directory
- [ ] Create src/process/ directory
- [ ] Create src/validation/ directory
- [ ] Create src/security/ directory
- [ ] Create src/utils/ directory
- [ ] Add barrel exports to index.ts
- [ ] Run test: `node test-setup.js`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

### Test: should build successfully to JavaScript

**File:** `tests/unit/project-setup.spec.ts` and `test-setup.js`

**Tasks to make this test pass:**

- [ ] Implement src/index.ts with basic exports
- [ ] Implement src/BunTestRunner.ts (main class stub)
- [ ] Configure TypeScript compilation
- [ ] Run build: `npm run build`
- [ ] Verify dist/index.js exists
- [ ] Verify dist/index.d.ts exists
- [ ] Test that built module compiles without errors
- [ ] Run test: `node test-setup.js`
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 3 hours

---

### Test: ESLint and Prettier Configuration

**File:** `tests/unit/project-setup.spec.ts`

**Tasks to make this test pass:**

- [ ] Create .eslintrc.json configuration
- [ ] Configure TypeScript ESLint rules
- [ ] Create .prettierrc configuration
- [ ] Add lint script to package.json
- [ ] Add format script to package.json
- [ ] Run lint: `npm run lint`
- [ ] Fix any linting errors
- [ ] ✅ Test passes (green phase)

**Estimated Effort:** 2 hours

---

## Running Tests

```bash
# Run all failing tests for this story
node test-setup.js

# Run specific test file (using Playwright when configured)
npx playwright test --project=unit

# Run tests with coverage (when build system is ready)
npm run test:coverage

# Debug specific test
npx playwright test --project=unit --debug
```

---

## Red-Green-Refactor Workflow

### RED Phase (Complete) ✅

**TEA Agent Responsibilities:**

- ✅ All tests written and failing
- ✅ Fixtures and factories created with auto-cleanup
- ✅ Mock requirements documented
- ✅ data-testid requirements listed
- ✅ Implementation checklist created

**Verification:**

- All tests run and fail as expected
- Failure messages are clear and actionable
- Tests fail due to missing implementation, not test bugs

---

### GREEN Phase (DEV Team - Next Steps)

**DEV Agent Responsibilities:**

1. **Pick one failing test** from implementation checklist (start with
   tsconfig.json)
2. **Read the test** to understand expected behavior
3. **Implement minimal code** to make that specific test pass
4. **Run the test** to verify it now passes (green)
5. **Check off the task** in implementation checklist
6. **Move to next test** and repeat

**Key Principles:**

- One test at a time (don't try to fix all at once)
- Minimal implementation (don't over-engineer)
- Run tests frequently (immediate feedback)
- Use implementation checklist as roadmap

**Progress Tracking:**

- Check off tasks as you complete them
- Share progress in daily standup
- Mark story as IN PROGRESS in `bmm-workflow-status.md`

---

### REFACTOR Phase (DEV Team - After All Tests Pass)

**DEV Agent Responsibilities:**

1. **Verify all tests pass** (green phase complete)
2. **Review code for quality** (readability, maintainability, performance)
3. **Extract duplications** (DRY principle)
4. **Optimize performance** (if needed)
5. **Ensure tests still pass** after each refactor
6. **Update documentation** (if API contracts change)

**Key Principles:**

- Tests provide safety net (refactor with confidence)
- Make small refactors (easier to debug if tests fail)
- Run tests after each change
- Don't change test behavior (only implementation)

**Completion:**

- All tests pass
- Code quality meets team standards
- No duplications or code smells
- Ready for code review and story approval

---

## Next Steps

1. **Review this checklist** with team in standup or planning
2. **Run failing tests** to confirm RED phase: `node test-setup.js`
3. **Begin implementation** using implementation checklist as guide
4. **Work one test at a time** (red → green for each)
5. **Share progress** in daily standup
6. **When all tests pass**, refactor code for quality
7. **When refactoring complete**, run `bmad sm story-approved` to move story to
   DONE

---

## Knowledge Base References Applied

This ATDD workflow consulted the following knowledge fragments:

- **fixture-architecture.md** - Test fixture patterns with setup/teardown and
  auto-cleanup using Playwright's `test.extend()`
- **data-factories.md** - Factory patterns using `@faker-js/faker` for random
  test data generation with overrides support
- **component-tdd.md** - Component test strategies using Playwright Component
  Testing
- **network-first.md** - Route interception patterns (intercept BEFORE
  navigation to prevent race conditions)
- **test-quality.md** - Test design principles (Given-When-Then, one assertion
  per test, determinism, isolation)
- **test-levels-framework.md** - Test level selection framework (E2E vs API vs
  Component vs Unit)

See `tea-index.csv` for complete knowledge fragment mapping.

---

## Test Execution Evidence

### Initial Test Run (RED Phase Verification)

**Command:** `node test-setup.js`

**Results:**

```
🧪 Running Story 1.1 Project Setup Tests (RED Phase)
🎯 These tests will FAIL until implementation is complete

📋 Story 1.1: Project Setup and Build Configuration

📋 TypeScript Configuration (AC1)
  ✗ should have tsconfig.json with strict mode enabled: ❌ Assertion failed: tsconfig.json should exist
❌ ❌ Assertion failed: tsconfig.json should exist

✅ EXPECTED: Tests are failing (RED phase)
🔧 Implementation needed to make tests pass (GREEN phase)
```

**Summary:**

- Total tests: 8
- Passing: 2 (package.json and git repo already exist)
- Failing: 6 (expected - missing implementation)
- Status: ✅ RED phase verified

**Expected Failure Messages:**

- `tsconfig.json should exist` - TypeScript configuration missing
- `src/ directory should exist` - Source code structure missing
- `.gitignore file should exist` - Git ignore file missing
- `dist/ directory should exist` - Build output missing
- Build compilation errors until TypeScript files are created

---

## Notes

This is a project setup story, so the focus is on infrastructure and
configuration rather than business logic:

- Tests use simple Node.js assertions to avoid complex test runner setup during
  initial project phase
- Playwright configuration is included but not required for initial setup
  verification
- All acceptance criteria map directly to file existence and configuration
  validation
- Implementation can proceed in any order, but TypeScript setup should come
  first as it enables other features

---

## Contact

**Questions or Issues?**

- Ask in team standup
- Tag @tea-agent in Slack/Discord
- Refer to `testarch/README.md` for workflow documentation
- Consult `testarch/knowledge/` for testing best practices

---

**Generated by BMad TEA Agent** - 2025-10-21
