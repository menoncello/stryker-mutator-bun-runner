# Resource Cleanup Patterns (FR027, FR028, FR038)

## Critical Rules
- ALWAYS cleanup resources in try/finally
- ALWAYS use secure permissions for temp files (0o700)
- ALWAYS cleanup on both normal exit and crash scenarios

## Pattern: Basic Cleanup
```typescript
async function processData(): Promise<void> {
  const resource = await acquireResource();

  try {
    // Use resource
    await processResource(resource);
  } finally {
    await cleanupResource(resource);  // FR027
  }
}
```

## Pattern: Multiple Resources
```typescript
async function complexOperation(): Promise<void> {
  const resource1 = await acquire1();
  try {
    const resource2 = await acquire2();
    try {
      // Use both resources
    } finally {
      await cleanup2(resource2);
    }
  } finally {
    await cleanup1(resource1);
  }
}
```

## Pattern: Secure Temp Files (FR038)
```typescript
import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const tempDir = join(tmpdir(), `prefix-${randomId}`);
mkdirSync(tempDir, { mode: 0o700 });  // Owner-only permissions

try {
  // Use temp directory
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
```

## Pattern: Dispose (FR028)
```typescript
class BunTestRunner {
  async dispose(): Promise<void> {
    // FR028: Cleanup on Stryker termination
    for (const process of this.processes) {
      await this.killProcess(process);
    }
  }
}
```

## Testing Cleanup Patterns
- ✅ Test that finally blocks execute on errors
- ✅ Test that resources are released in correct order
- ✅ Test that temp files are removed on crash
- ✅ Test that dispose() cleans up all resources
