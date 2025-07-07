#!/usr/bin/env node

/**
 * Script to run each test file individually
 * This helps identify which test file causes issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Configuration
const config = {
  testPattern: 'test/**/*.test.ts',
  timeout: 60000, // 1 minute per test file
  logDir: 'test-individual-logs'
};

// Create log directory
if (!fs.existsSync(config.logDir)) {
  fs.mkdirSync(config.logDir, { recursive: true });
}

// Get all test files
function getTestFiles() {
  return glob.sync(config.testPattern);
}

// Get process count
function getProcessCount() {
  try {
    const result = execSync('ps aux | grep -E "bun|node" | grep -v grep | wc -l', { 
      encoding: 'utf8' 
    });
    return parseInt(result.trim());
  } catch (_error) {
    return 0;
  }
}

// Kill all bun processes
function killBunProcesses() {
  try {
    execSync('pkill -f "bun" || true', { stdio: 'ignore' });
  } catch (_error) {
    // Ignore errors
  }
}

// Run a single test file
async function runTestFile(file, index, total) {
  console.log(`\n${colors.cyan}[${index + 1}/${total}] Testing: ${colors.yellow}${file}${colors.reset}`);
  
  const startTime = Date.now();
  const initialProcessCount = getProcessCount();
  console.log(`${colors.blue}Initial process count: ${initialProcessCount}${colors.reset}`);
  
  const logFile = path.join(config.logDir, `${path.basename(file, '.ts')}.log`);
  
  try {
    // Run test with timeout
    const command = `bun test ${file}`;
    console.log(`${colors.blue}Running: ${command}${colors.reset}`);
    
    const output = execSync(command, {
      timeout: config.timeout,
      encoding: 'utf8'
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const finalProcessCount = getProcessCount();
    
    // Parse test results
    const passMatch = output.match(/(\d+) pass/);
    const failMatch = output.match(/(\d+) fail/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    
    console.log(`${colors.green}✓ Success${colors.reset} - ${passed} passed, ${failed} failed - Duration: ${duration}s`);
    console.log(`${colors.blue}Final process count: ${finalProcessCount}${colors.reset}`);
    
    // Save output
    fs.writeFileSync(logFile, output);
    
    // Check for process leak
    if (finalProcessCount > initialProcessCount + 3) {
      console.log(`${colors.yellow}⚠️  WARNING: Possible process leak (${finalProcessCount - initialProcessCount} extra processes)${colors.reset}`);
    }
    
    return {
      file,
      status: 'success',
      duration,
      passed,
      failed,
      processCount: finalProcessCount,
      processLeak: Math.max(0, finalProcessCount - initialProcessCount)
    };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const finalProcessCount = getProcessCount();
    
    console.log(`${colors.red}✗ Failed${colors.reset} - Duration: ${duration}s`);
    console.log(`${colors.blue}Final process count: ${finalProcessCount}${colors.reset}`);
    
    // Save error log
    fs.writeFileSync(logFile, error.toString());
    
    // Check if it's a timeout
    if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
      console.log(`${colors.red}Error: Timeout after ${config.timeout / 1000}s${colors.reset}`);
      return {
        file,
        status: 'timeout',
        duration,
        processCount: finalProcessCount,
        error: 'Timeout'
      };
    }
    
    // Check for test failures
    if (error.status === 1 && error.stdout) {
      const output = error.stdout.toString();
      const passMatch = output.match(/(\d+) pass/);
      const failMatch = output.match(/(\d+) fail/);
      const passed = passMatch ? parseInt(passMatch[1]) : 0;
      const failed = failMatch ? parseInt(failMatch[1]) : 0;
      
      return {
        file,
        status: 'test-failure',
        duration,
        passed,
        failed,
        processCount: finalProcessCount,
        error: `${failed} tests failed`
      };
    }
    
    return {
      file,
      status: 'error',
      duration,
      processCount: finalProcessCount,
      error: error.message || 'Unknown error'
    };
    
  } finally {
    // Kill any hanging processes if count is high
    const currentCount = getProcessCount();
    if (currentCount > initialProcessCount + 3) {
      console.log(`${colors.yellow}Cleaning up ${currentCount - initialProcessCount} extra processes...${colors.reset}`);
      killBunProcesses();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Run tests with process pool enabled
async function runWithProcessPool() {
  console.log(`\n${colors.magenta}=== Testing with Process Pool Enabled ===${colors.reset}`);
  
  // Create a test file that uses process pool
  const testContent = `
import { describe, test, expect } from 'bun:test';
import { BunTestAdapter } from '../src/BunTestAdapter.js';
import { Logger } from '@stryker-mutator/api/logging';

describe('Process Pool Test', () => {
  test('should run with process pool', async () => {
    const mockLogger = {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: () => {}
    };
    
    const adapter = new BunTestAdapter(mockLogger as any, {
      processPool: true,
      maxWorkers: 8,
      timeout: 5000
    });
    
    await adapter.init();
    const result = await adapter.runTests([], { timeout: 5000 });
    await adapter.dispose();
    
    expect(result).toBeDefined();
  });
});
`;
  
  const testPath = 'test-process-pool.test.ts';
  fs.writeFileSync(testPath, testContent);
  
  try {
    const result = await runTestFile(testPath, 0, 1);
    return result;
  } finally {
    if (fs.existsSync(testPath)) {
      fs.unlinkSync(testPath);
    }
  }
}

// Main execution
async function main() {
  console.log(`${colors.magenta}=== Individual Test File Runner ===${colors.reset}`);
  console.log(`${colors.cyan}Log directory: ${config.logDir}${colors.reset}`);
  
  // Kill any existing processes
  console.log(`\n${colors.yellow}Cleaning up existing processes...${colors.reset}`);
  killBunProcesses();
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const files = getTestFiles();
  console.log(`\n${colors.cyan}Found ${files.length} test files${colors.reset}`);
  
  const results = [];
  
  // Test each file
  for (let i = 0; i < files.length; i++) {
    const result = await runTestFile(files[i], i, files.length);
    results.push(result);
    
    // Add small delay between files
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  // Test with process pool
  const poolResult = await runWithProcessPool();
  results.push(poolResult);
  
  // Summary
  console.log(`\n${colors.magenta}=== Summary ===${colors.reset}`);
  
  const successful = results.filter(r => r.status === 'success').length;
  const testFailures = results.filter(r => r.status === 'test-failure').length;
  const timeouts = results.filter(r => r.status === 'timeout').length;
  const errors = results.filter(r => r.status === 'error').length;
  const totalPassed = results.reduce((sum, r) => sum + (r.passed || 0), 0);
  const totalFailed = results.reduce((sum, r) => sum + (r.failed || 0), 0);
  
  console.log(`${colors.green}Successful files: ${successful}${colors.reset}`);
  console.log(`${colors.yellow}Files with test failures: ${testFailures}${colors.reset}`);
  console.log(`${colors.red}Timeouts: ${timeouts}${colors.reset}`);
  console.log(`${colors.red}Other errors: ${errors}${colors.reset}`);
  console.log(`\n${colors.cyan}Total tests: ${totalPassed + totalFailed} (${totalPassed} passed, ${totalFailed} failed)${colors.reset}`);
  
  // List files with issues
  const problematic = results.filter(r => r.status !== 'success' || r.processLeak > 3);
  if (problematic.length > 0) {
    console.log(`\n${colors.red}=== Files with Issues ===${colors.reset}`);
    
    problematic.forEach(result => {
      const color = result.status === 'success' ? colors.yellow : colors.red;
      console.log(`${color}${result.file}:${colors.reset}`);
      console.log(`  Status: ${result.status}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      if (result.processLeak > 0) {
        console.log(`  Process leak: ${result.processLeak} processes`);
      }
      console.log(`  Duration: ${result.duration}s`);
    });
  }
  
  // Files that leak processes
  const leakers = results.filter(r => r.processLeak > 3).sort((a, b) => b.processLeak - a.processLeak);
  if (leakers.length > 0) {
    console.log(`\n${colors.yellow}=== Process Leaks ===${colors.reset}`);
    leakers.forEach(result => {
      console.log(`${colors.yellow}${result.file}: ${result.processLeak} leaked processes${colors.reset}`);
    });
  }
  
  // Save full results
  const resultsPath = path.join(config.logDir, 'summary.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n${colors.cyan}Full results saved to: ${resultsPath}${colors.reset}`);
  
  // Final cleanup
  console.log(`\n${colors.yellow}Final cleanup...${colors.reset}`);
  killBunProcesses();
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});