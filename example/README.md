# Stryker Bun Runner Example

This example demonstrates how to use the Stryker Bun Runner with a TypeScript project.

## Project Structure

```
example/
├── src/                    # Source code to mutate
│   ├── calculator/         # Calculator implementations
│   └── utils/             # Utility functions
├── tests/                  # Test files
│   ├── calculator/        # Calculator tests
│   └── utils/            # Utility tests
├── stryker.config.json    # Default configuration
├── stryker-*.config.json  # Alternative configurations
└── package.json
```

## Prerequisites

- Bun >= 1.0.0
- Node.js >= 20.0.0

## Setup

1. First, build the parent project:
   ```bash
   cd ..
   npm install
   npm run build
   ```

2. Install dependencies in this example:
   ```bash
   npm install
   ```

3. Link the local plugin (for development):
   ```bash
   npm link ..
   ```

## Running Tests

To run tests with Bun:
```bash
bun test
```

## Running Mutation Tests

### Default Configuration
```bash
npx stryker run
```

### Alternative Configurations

**Process Pool Configuration** (optimized for performance):
```bash
npx stryker run -c stryker-processpool.config.json
```
- Uses 8 worker processes
- Best for CI/CD environments
- 2-3x faster execution

**Watch Mode Configuration** (for development):
```bash
npx stryker run -c stryker-watch.config.json --watch
```
- Continuous testing
- 2 workers for resource efficiency
- Bail on first failure

**Minimal Configuration** (quick testing):
```bash
npx stryker run -c stryker-minimal.config.json
```
- Tests only Calculator class
- Fastest option
- Good for learning

## Mutation Testing Results

The example project includes:
- **800+ mutants** across various TypeScript files
- **87.94% mutation score** with default configuration
- Comprehensive test suite demonstrating best practices

### Understanding the Results

After running Stryker, open `reports/mutation/mutation.html` to see:
- Which mutations were killed (good)
- Which mutations survived (may need more tests)
- Which files have the best/worst coverage
- Detailed reports for each mutant

## Features Demonstrated

1. **TypeScript Support**
   - No configuration needed
   - Full type safety
   - Source map support

2. **Process Pool**
   - Reuse Bun processes
   - Configurable worker count
   - Automatic cleanup

3. **Complex Code Patterns**
   - Classes with inheritance
   - Static methods
   - Async operations
   - Error handling
   - Mathematical algorithms

4. **Test Patterns**
   - Unit tests
   - Edge cases
   - Error scenarios
   - Performance tests

## Configuration Options

### Basic Options
```json
{
  "bun": {
    "testFiles": ["tests/**/*.test.ts"],
    "timeout": 30000,
    "bail": false
  }
}
```

### Performance Options
```json
{
  "bun": {
    "processPool": true,
    "maxWorkers": 8,
    "coverageAnalysis": "off"
  }
}
```

### Development Options
```json
{
  "bun": {
    "watchMode": true,
    "bail": true,
    "maxWorkers": 2
  }
}
```

## Performance Tips

1. **Use Process Pool**: Enable `processPool: true` for 2-3x faster execution
2. **Adjust Workers**: Set `maxWorkers` based on CPU cores
3. **Filter Tests**: Use specific patterns to reduce scope
4. **Coverage Off**: Use `coverageAnalysis: "off"` (perTest has limitations)

## Troubleshooting

### Out of Memory
```json
{
  "bun": {
    "nodeArgs": ["--max-old-space-size=4096"],
    "maxWorkers": 2
  }
}
```

### Timeout Issues
```json
{
  "bun": {
    "timeout": 60000
  }
}
```

### Coverage Not Working
Coverage perTest is a known limitation. Use:
```json
{
  "coverageAnalysis": "off"
}
```

## Experiments to Try

1. **Break a test**: Comment out a test and see the mutation score drop
2. **Add a bug**: Introduce a bug in the source and see if tests catch it
3. **Improve coverage**: Add tests to kill surviving mutants
4. **Performance test**: Compare execution time with/without process pool

## Next Steps

1. Explore the [API Documentation](../docs/API.md)
2. Read the [User Guide](../docs/GUIDE.md)
3. Check [Troubleshooting](../docs/GUIDE.md#troubleshooting)
4. Contribute to the [project](../CONTRIBUTING.md)

Happy mutation testing with Bun! 🚀