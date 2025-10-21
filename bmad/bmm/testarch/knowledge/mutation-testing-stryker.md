# Mutation Testing with Stryker

## Overview
This project uses **Stryker** for mutation testing (dogfooding NFR010).

## Running Mutation Tests
```bash
bun run test:mutate        # Run Stryker mutation testing
npx stryker run           # Alternative
```

## Thresholds
- Coverage target: ≥80% (NFR009)
- Mutation score: Project-specific (check stryker.config.json)

## Critical Rules
- ❌ NEVER lower mutation testing thresholds to make tests pass
- ✅ ALWAYS add more tests to kill surviving mutants
- ✅ ALWAYS improve test quality to cover edge cases

## Exception
Only adjust thresholds when mutants are legitimately untestable:
- Stub code awaiting implementation
- Logging strings with no behavioral impact

**Document all threshold adjustments with clear justification.**

## References
- [Stryker Documentation](https://stryker-mutator.io/)
