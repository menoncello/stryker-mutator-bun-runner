# Bun Testing Patterns

## Test Structure

```typescript
import { describe, it, expect } from 'bun:test';

describe('ComponentName', () => {
  describe('methodName', () => {
    it('should handle expected behavior', async () => {
      // Test implementation
    });
  });
});
```

## Key Features

- **Native TypeScript**: No transpilation needed
- **13x faster than Jest**: Bun's native execution
- **Built-in coverage**: `bun test --coverage`
- **Vitest-compatible API**: describe, it, expect

## Coverage Collection

```bash
# Run tests with coverage
bun test --coverage

# Output in LCOV format for Stryker integration
bun test --coverage --coverage-reporter=lcov
```

## Quality Requirements

- **Test Pass Rate**: 100% required
- **Coverage Threshold**: ≥80% (NFR009)
- **No 'any' Types**: Use proper TypeScript types in test data
- **ESLint Compliance**: Test code must pass linting
- **Structure Tests**: BDD organization with descriptive names

## Test Data Patterns

```typescript
// Good: Proper TypeScript types
const testData: {
  input: string;
  expected: number;
} = {
  input: 'test',
  expected: 42
};

// Bad: 'any' type (violates ADR-004)
const testData: any = {
  input: 'test',
  expected: 42
};
```

## Async Testing

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});
```

## Mutation Testing Integration

- Use Stryker with Bun test runner
- Coverage data in LCOV format
- Target 80%+ mutation score
- Structure tests to kill mutants (boundary values, error paths)