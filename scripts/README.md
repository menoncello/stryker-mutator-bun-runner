# Diagnostic Scripts

These scripts help identify process explosion issues in the Stryker Bun Runner.

## Quick Start

```bash
# Run all diagnostic scenarios
npm run diagnose

# Test each source file individually with Stryker
npm run diagnose:files

# Run each test file individually
npm run diagnose:tests
```

## Scripts

### diagnose-process-explosion.cjs

Main diagnostic script that runs quick scenarios to identify process issues:
- Individual test files
- Process pool tests
- Small Stryker runs
- Monitors process count in real-time
- Identifies process spikes and leaks

**Usage:**
```bash
npm run diagnose
# or
node scripts/diagnose-process-explosion.cjs
```

**Output:**
- Console output with color-coded results
- `diagnostic-results/diagnostic-summary.json` - Complete results with process timelines

### test-individual-files.cjs

Tests each source file individually with Stryker to identify which file causes process explosion.

**Usage:**
```bash
npm run diagnose:files
# or
node scripts/test-individual-files.cjs
```

**Features:**
- Tests each `.ts` file in `src/` directory
- Monitors process count before and after each test
- Detects process leaks and explosions
- Automatic cleanup between files
- Configurable timeout (default: 2 minutes per file)

**Output:**
- Console progress with color-coded status
- `stryker-individual-logs/` - Log files for each test
- `stryker-individual-logs/summary.json` - Complete results

### test-individual-tests.cjs

Runs each test file individually to identify problematic tests.

**Usage:**
```bash
npm run diagnose:tests
# or
node scripts/test-individual-tests.cjs
```

**Features:**
- Runs each `.test.ts` file individually
- Monitors process count
- Detects hanging processes
- Tests process pool functionality
- Reports test pass/fail counts

**Output:**
- Console progress with test results
- `test-individual-logs/` - Log files for each test
- `test-individual-logs/summary.json` - Complete results

## Interpreting Results

### Process Explosion
- **Normal**: 5-10 processes during testing
- **Warning**: 10-20 processes (possible leak)
- **Critical**: 20+ processes (definite problem)

### Common Issues

1. **Process Leak**
   - Extra processes remain after test completion
   - Usually indicates missing cleanup in dispose methods

2. **Process Explosion**
   - Rapid creation of many processes
   - Often caused by recursive process creation

3. **Timeout**
   - Test takes too long to complete
   - May indicate deadlock or infinite loop

## Example Output

```
=== Stryker Process Explosion Diagnostic ===

[1/6] Testing: Simple Bun Test
Initial process count: 5
✓ Completed in 1.2s
Final process count: 5

[2/6] Testing: Process Pool Test
Initial process count: 5
⚠️  High process count: 25 at 3.4s
✗ Failed after 10.5s
Final process count: 45

=== Analysis ===
Found 1 problematic scenario:
Process Pool Test:
  Failed: Process explosion
  Max processes: 45
  Process spikes: 3
```

## Troubleshooting

If scripts fail to run:

1. Ensure dependencies are installed:
   ```bash
   npm install
   ```

2. Kill any hanging processes:
   ```bash
   pkill -f "bun"
   pkill -f "node.*stryker"
   ```

3. Check permissions:
   ```bash
   chmod +x scripts/*.cjs
   ```

4. Run with debug output:
   ```bash
   DEBUG=* node scripts/diagnose-process-explosion.cjs
   ```