# TypeScript Strict Mode for Testing

## Critical Rule (ADR-004, NFR018)
**NEVER use 'any' type ANYWHERE in the codebase - including test code.**

## Type Safety in Tests

### ❌ BAD (uses 'any')
```typescript
const mockData: any = { id: 1, name: 'test' };  // VIOLATES ADR-004
```

### ✅ GOOD (proper types)
```typescript
interface TestData {
  id: number;
  name: string;
}

const mockData: TestData = { id: 1, name: 'test' };
```

### ✅ GOOD (use 'unknown' and narrow)
```typescript
const unknownData: unknown = fetchData();

if (typeof unknownData === 'object' && unknownData !== null) {
  const data = unknownData as TestData;  // Type guard + assertion
}
```

## Test Data Patterns
- Use proper interfaces for mock data
- Use generics for reusable test utilities
- Infer types from implementation code
- Use 'Record<string, unknown>' for dynamic objects

## Quality Gates
- TypeScript: 0 errors (strict mode)
- ESLint: @typescript-eslint/no-explicit-any: 'error'
- NEVER use @ts-ignore or @ts-expect-error
