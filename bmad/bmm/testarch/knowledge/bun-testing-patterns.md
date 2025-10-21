# Bun Testing Patterns

## Overview
This project uses **Bun Test** (native) for all testing.

## Test API
```typescript
import { describe, it, expect } from 'bun:test';

describe('MyClass', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

## Running Tests
```bash
bun test                    # Run all tests
bun test --coverage        # With coverage (≥80% required - NFR009)
bun test path/to/file.test.ts  # Run specific file
```

## Test Quality Requirements
- ✅ Use proper TypeScript types (NEVER use 'any' - ADR-004)
- ✅ Handle async/await correctly (no floating promises)
- ✅ Follow ESLint rules (no-unused-vars, etc.)
- ✅ Structure tests to kill mutants (boundary values, null checks, error paths)
- ✅ Test resource cleanup patterns (FR027, FR028, FR038)

## References
- [Bun Test Documentation](https://bun.sh/docs/cli/test)
