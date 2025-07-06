#!/usr/bin/env node

/**
 * Script to specifically test BunProcessPool mutations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Get process count
function getProcessCount() {
  try {
    const result = execSync('ps aux | grep -E "bun|node" | grep -v grep | wc -l', { 
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return parseInt(result.trim());
  } catch (error) {
    return 0;
  }
}

// Monitor processes in real-time
function startProcessMonitor(interval = 1000) {
  let maxCount = 0;
  let counts = [];
  
  const monitor = setInterval(() => {
    const count = getProcessCount();
    counts.push(count);
    maxCount = Math.max(maxCount, count);
    
    if (count > 15) {
      console.log(`${colors.red}⚠️  High process count: ${count}${colors.reset}`);
    }
  }, interval);
  
  return {
    stop: () => {
      clearInterval(monitor);
      return { maxCount, counts, average: counts.reduce((a, b) => a + b, 0) / counts.length };
    }
  };
}

// Create minimal config for testing BunProcessPool
function createMinimalConfig() {
  const config = {
    testRunner: 'command',
    commandRunner: {
      command: 'bun test test/process/BunProcessPool.test.ts'
    },
    mutate: ['src/process/BunProcessPool.ts'],
    mutator: {
      excludedMutations: [
        'StringLiteral', // Exclude string mutations to reduce test count
        'ObjectLiteral',  // Exclude object literal mutations
      ]
    },
    coverageAnalysis: 'off',
    timeoutMS: 10000, // Shorter timeout
    timeoutFactor: 1.5,
    logLevel: 'debug',
    fileLogLevel: 'trace',
    concurrency: 1, // Single concurrency to isolate issue
    tempDirName: '.stryker-pool-test',
    cleanTempDir: true,
    checkers: [],
    disableTypeChecks: true,
    reporters: ['clear-text'],
    dryRunTimeoutMinutes: 1
  };
  
  const configPath = '.stryker-pool-test.json';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

// Test specific mutations
async function testSpecificMutations() {
  console.log(`${colors.magenta}${colors.bold}=== Testing BunProcessPool Mutations ===${colors.reset}`);
  
  // Clean up first
  console.log(`${colors.yellow}Cleaning up existing processes...${colors.reset}`);
  execSync('pkill -f "bun" || true', { stdio: 'ignore' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const initialCount = getProcessCount();
  console.log(`${colors.blue}Initial process count: ${initialCount}${colors.reset}`);
  
  // Test different scenarios
  const scenarios = [
    {
      name: 'Basic unit test',
      command: 'bun test test/process/BunProcessPool.test.ts'
    },
    {
      name: 'Unit test with coverage',
      command: 'bun test --coverage test/process/BunProcessPool.test.ts'
    },
    {
      name: 'Minimal Stryker run',
      command: 'npx stryker run -c .stryker-pool-test.json'
    }
  ];
  
  for (const scenario of scenarios) {
    console.log(`\n${colors.cyan}Testing: ${scenario.name}${colors.reset}`);
    console.log(`${colors.blue}Command: ${scenario.command}${colors.reset}`);
    
    const monitor = startProcessMonitor();
    const startTime = Date.now();
    
    try {
      if (scenario.name.includes('Stryker')) {
        const configPath = createMinimalConfig();
        scenario.command = `npx stryker run -c ${configPath}`;
      }
      
      execSync(scenario.command, {
        stdio: 'inherit',
        timeout: 60000
      });
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const stats = monitor.stop();
      
      console.log(`${colors.green}✓ Success in ${duration}s${colors.reset}`);
      console.log(`${colors.blue}Max processes: ${stats.maxCount}, Average: ${stats.average.toFixed(1)}${colors.reset}`);
      
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      const stats = monitor.stop();
      
      console.log(`${colors.red}✗ Failed after ${duration}s${colors.reset}`);
      console.log(`${colors.blue}Max processes: ${stats.maxCount}, Average: ${stats.average.toFixed(1)}${colors.reset}`);
      
      if (stats.maxCount > 20) {
        console.log(`${colors.red}PROCESS EXPLOSION DETECTED!${colors.reset}`);
      }
    }
    
    // Cleanup
    console.log(`${colors.yellow}Cleaning up...${colors.reset}`);
    execSync('pkill -f "bun" || true', { stdio: 'ignore' });
    if (fs.existsSync('.stryker-pool-test.json')) {
      fs.unlinkSync('.stryker-pool-test.json');
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Test with limited mutations
async function testLimitedMutations() {
  console.log(`\n${colors.magenta}${colors.bold}=== Testing with Limited Mutations ===${colors.reset}`);
  
  // Create config with very limited mutations
  const config = {
    testRunner: 'command',
    commandRunner: {
      command: 'bun test test/process/BunProcessPool.test.ts'
    },
    mutate: ['src/process/BunProcessPool.ts'],
    mutator: {
      plugins: ['@stryker-mutator/typescript-checker'],
      excludedMutations: [
        'StringLiteral',
        'ObjectLiteral',
        'ArrayLiteral',
        'BooleanLiteral',
        'ConditionalExpression',
        'EqualityOperator',
        'LogicalOperator'
      ]
    },
    checkers: ['typescript'],
    tsconfigFile: 'tsconfig.json',
    coverageAnalysis: 'off',
    timeoutMS: 5000,
    timeoutFactor: 1.2,
    logLevel: 'info',
    concurrency: 1,
    cleanTempDir: true,
    reporters: ['progress', 'clear-text'],
    thresholds: {
      high: 80,
      low: 60,
      break: 0
    }
  };
  
  const configPath = '.stryker-limited.json';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  
  const monitor = startProcessMonitor(500);
  
  try {
    console.log(`${colors.blue}Running Stryker with limited mutations...${colors.reset}`);
    
    execSync(`npx stryker run -c ${configPath}`, {
      stdio: 'inherit',
      timeout: 120000
    });
    
    const stats = monitor.stop();
    console.log(`${colors.green}Completed successfully${colors.reset}`);
    console.log(`${colors.blue}Max processes: ${stats.maxCount}${colors.reset}`);
    
  } catch (error) {
    const stats = monitor.stop();
    console.log(`${colors.red}Failed!${colors.reset}`);
    console.log(`${colors.blue}Max processes: ${stats.maxCount}${colors.reset}`);
    
    if (error.signal === 'SIGTERM' || error.code === 'ETIMEDOUT') {
      console.log(`${colors.red}Timeout - likely process explosion${colors.reset}`);
    }
  } finally {
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
  }
}

// Main
async function main() {
  try {
    await testSpecificMutations();
    await testLimitedMutations();
    
    console.log(`\n${colors.magenta}${colors.bold}=== Recommendations ===${colors.reset}`);
    console.log(`${colors.yellow}If process explosion occurs with BunProcessPool:${colors.reset}`);
    console.log(`1. Check for recursive process creation in mutated code`);
    console.log(`2. Add mutation filters to skip problematic mutations`);
    console.log(`3. Use command runner instead of bun runner for self-testing`);
    console.log(`4. Consider adding istanbul ignore comments for problematic lines`);
    
  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  } finally {
    // Final cleanup
    console.log(`\n${colors.yellow}Final cleanup...${colors.reset}`);
    execSync('pkill -f "bun" || true', { stdio: 'ignore' });
    execSync('rm -rf .stryker-tmp* .stryker-pool-test* || true', { stdio: 'ignore' });
  }
}

main();