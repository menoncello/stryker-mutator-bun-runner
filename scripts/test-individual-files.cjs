#!/usr/bin/env node

/**
 * Script to test each file individually with Stryker
 * This helps identify which file causes process explosion
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
  mutatePattern: 'src/**/*.ts',
  excludePattern: ['**/*.test.ts', '**/*.d.ts'],
  timeout: 120000, // 2 minutes per file
  concurrency: 1, // Use single concurrency to isolate issues
  logDir: 'stryker-individual-logs'
};

// Create log directory
if (!fs.existsSync(config.logDir)) {
  fs.mkdirSync(config.logDir, { recursive: true });
}

// Get all source files
function getSourceFiles() {
  const files = glob.sync(config.mutatePattern, {
    ignore: config.excludePattern
  });
  return files.filter(file => !file.includes('.test.'));
}

// Get process count
function getProcessCount() {
  try {
    const result = execSync('ps aux | grep -E "bun|node" | grep -v grep | wc -l', { 
      encoding: 'utf8' 
    });
    return parseInt(result.trim());
  } catch (error) {
    return 0;
  }
}

// Kill all bun/node processes
function killProcesses() {
  try {
    execSync('pkill -f "bun" || true', { stdio: 'ignore' });
    execSync('pkill -f "node.*stryker" || true', { stdio: 'ignore' });
  } catch (error) {
    // Ignore errors
  }
}

// Create temporary Stryker config for single file
function createTempConfig(file) {
  const config = {
    testRunner: 'command',
    commandRunner: {
      command: 'npm test'
    },
    mutate: [file],
    coverageAnalysis: 'off',
    timeoutMS: 30000,
    timeoutFactor: 2,
    logLevel: 'info',
    fileLogLevel: 'trace',
    concurrency: 1,
    tempDirName: '.stryker-tmp-individual',
    cleanTempDir: true,
    checkers: [],
    disableTypeChecks: true,
    reporters: ['clear-text', 'json'],
    jsonReporter: {
      fileName: path.join(config.logDir, `${path.basename(file, '.ts')}-report.json`)
    }
  };
  
  const configPath = '.stryker-temp.json';
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

// Run Stryker for a single file
async function testFile(file, index, total) {
  console.log(`\n${colors.cyan}[${index + 1}/${total}] Testing file: ${colors.yellow}${file}${colors.reset}`);
  
  const startTime = Date.now();
  const initialProcessCount = getProcessCount();
  console.log(`${colors.blue}Initial process count: ${initialProcessCount}${colors.reset}`);
  
  const configPath = createTempConfig(file);
  const logFile = path.join(config.logDir, `${path.basename(file, '.ts')}.log`);
  
  try {
    // Run Stryker with timeout
    const command = `npx stryker run -c ${configPath}`;
    console.log(`${colors.blue}Running: ${command}${colors.reset}`);
    
    execSync(command, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: config.timeout,
      encoding: 'utf8'
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const finalProcessCount = getProcessCount();
    
    console.log(`${colors.green}✓ Success${colors.reset} - Duration: ${duration}s`);
    console.log(`${colors.blue}Final process count: ${finalProcessCount}${colors.reset}`);
    
    // Check for process leak
    if (finalProcessCount > initialProcessCount + 5) {
      console.log(`${colors.red}⚠️  WARNING: Process leak detected! (${finalProcessCount - initialProcessCount} extra processes)${colors.reset}`);
      return {
        file,
        status: 'warning',
        duration,
        processLeak: finalProcessCount - initialProcessCount,
        error: 'Process leak detected'
      };
    }
    
    return {
      file,
      status: 'success',
      duration,
      processCount: finalProcessCount
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
    
    // Check for process explosion
    if (finalProcessCount > initialProcessCount + 10) {
      console.log(`${colors.red}Error: Process explosion detected! (${finalProcessCount} processes)${colors.reset}`);
      killProcesses();
      return {
        file,
        status: 'explosion',
        duration,
        processCount: finalProcessCount,
        error: 'Process explosion'
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
    // Cleanup temp config
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    
    // Kill any remaining processes if count is high
    const currentCount = getProcessCount();
    if (currentCount > initialProcessCount + 5) {
      console.log(`${colors.yellow}Cleaning up ${currentCount - initialProcessCount} extra processes...${colors.reset}`);
      killProcesses();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Main execution
async function main() {
  console.log(`${colors.magenta}=== Stryker Individual File Testing ===${colors.reset}`);
  console.log(`${colors.cyan}Log directory: ${config.logDir}${colors.reset}`);
  
  // Kill any existing processes
  console.log(`\n${colors.yellow}Cleaning up existing processes...${colors.reset}`);
  killProcesses();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const files = getSourceFiles();
  console.log(`\n${colors.cyan}Found ${files.length} files to test${colors.reset}`);
  
  const results = [];
  
  // Test each file
  for (let i = 0; i < files.length; i++) {
    const result = await testFile(files[i], i, files.length);
    results.push(result);
    
    // Add delay between files
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log(`\n${colors.magenta}=== Summary ===${colors.reset}`);
  
  const successful = results.filter(r => r.status === 'success').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const timeouts = results.filter(r => r.status === 'timeout').length;
  const explosions = results.filter(r => r.status === 'explosion').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`${colors.green}Successful: ${successful}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${warnings}${colors.reset}`);
  console.log(`${colors.red}Timeouts: ${timeouts}${colors.reset}`);
  console.log(`${colors.red}Process explosions: ${explosions}${colors.reset}`);
  console.log(`${colors.red}Other errors: ${errors}${colors.reset}`);
  
  // List problematic files
  if (warnings + timeouts + explosions + errors > 0) {
    console.log(`\n${colors.red}=== Problematic Files ===${colors.reset}`);
    
    results.filter(r => r.status !== 'success').forEach(result => {
      const color = result.status === 'warning' ? colors.yellow : colors.red;
      console.log(`${color}${result.file}: ${result.status} - ${result.error}${colors.reset}`);
      if (result.processCount) {
        console.log(`  Process count: ${result.processCount}`);
      }
    });
  }
  
  // Save full results
  const resultsPath = path.join(config.logDir, 'summary.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n${colors.cyan}Full results saved to: ${resultsPath}${colors.reset}`);
  
  // Final cleanup
  console.log(`\n${colors.yellow}Final cleanup...${colors.reset}`);
  killProcesses();
}

// Run the script
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});