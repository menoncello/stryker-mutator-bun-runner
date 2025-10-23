# Mutation Testing with Stryker

## Configuration

```json
{
  "$schema": "./node_modules/@stryker-mutator/core/schema/stryker-schema.json",
  "testRunner": "bun",
  "coverageAnalysis": "off",
  "mutate": [
    "src/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/*.spec.ts",
    "!src/**/*.test.ts"
  ],
  "thresholds": {
    "high": 80,
    "low": 60
  },
  "reporters": ["html", "clear-text", "progress"]
}
```

## Running Tests

```bash
# Run mutation testing
bun run test:mutate

# Output: reports/mutation/mutation-report.html
```

## Quality Gates

- **High threshold**: 80% (must achieve)
- **Low threshold**: 60% (warning)
- **Break threshold**: Not set (project uses low as break)

## Test Quality Requirements

- Tests must kill mutants (not just pass)
- Use boundary values and edge cases
- Test error paths and null checks
- Structure tests for maximum mutation killing

## Mutation Testing Best Practices

1. **NEVER lower thresholds** to make tests pass
2. **Add more tests** to kill surviving mutants
3. **Focus on critical code paths** first
4. **Test error conditions** and edge cases
5. **Use proper TypeScript types** in test data

## Dogfooding (NFR010)

This project uses Stryker for mutation testing as part of dogfooding strategy:
- Validates our own mutation testing capabilities
- Ensures high test quality
- Targets 80%+ mutation score

## Integration with Bun Test

- Test Runner: Bun (native)
- Coverage Collection: Custom per-test implementation
- LCOV format for integration
- 13x faster execution than Jest/Vitest