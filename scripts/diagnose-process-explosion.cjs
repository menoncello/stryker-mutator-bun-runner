#!/usr/bin/env node

/**
 * Main diagnostic script to identify process explosion issues
 * Runs both test files and mutation testing individually
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
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

// Monitor process count in real-time
class ProcessMonitor {
  constructor() {
    this.interval = null;
    this.counts = [];
    this.startTime = Date.now();
  }
  
  start() {
    this.interval = setInterval(() => {
      try {
        const count = this.getProcessCount();
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(1);
        this.counts.push({ time: elapsed, count });
        
        if (count > 20) {
          console.log(`${colors.red}⚠️  High process count: ${count} at ${elapsed}s${colors.reset}`);
        }
      } catch (_error) {
        // Ignore errors
      }
    }, 1000);
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  getProcessCount() {
    try {
      const result = execSync('ps aux | grep -E "bun|node" | grep -v grep | wc -l', { 
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      return parseInt(result.trim());
    } catch (_error) {
      return 0;
    }
  }
  
  getReport() {
    if (this.counts.length === 0) return null;
    
    const max = Math.max(...this.counts.map(c => c.count));
    const avg = this.counts.reduce((sum, c) => sum + c.count, 0) / this.counts.length;
    const spikes = this.counts.filter(c => c.count > 20);
    
    return {
      max,
      average: avg.toFixed(1),
      spikes: spikes.length,
      duration: this.counts[this.counts.length - 1]?.time || '0',
      timeline: this.counts
    };
  }
}

// Run a command with process monitoring
async function runWithMonitoring(command, description) {
  console.log(`\n${colors.cyan}${colors.bold}=== ${description} ===${colors.reset}`);
  console.log(`${colors.blue}Command: ${command}${colors.reset}`);
  
  const monitor = new ProcessMonitor();
  monitor.start();
  const startTime = Date.now();
  
  try {
    
    // Run command
    execSync(command, {
      stdio: 'inherit',
      timeout: 300000 // 5 minutes
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`${colors.green}✓ Completed in ${duration}s${colors.reset}`);
    
    return {
      success: true,
      duration,
      processReport: monitor.getReport()
    };
    
  } catch (_error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`${colors.red}✗ Failed after ${duration}s${colors.reset}`);
    
    return {
      success: false,
      duration,
      error: _error.message,
      processReport: monitor.getReport()
    };
    
  } finally {
    monitor.stop();
  }
}

// Test specific scenarios
async function testScenarios() {
  const scenarios = [
    {
      name: 'Simple Bun Test',
      command: 'bun test test/fixtures/simple.test.ts'
    },
    {
      name: 'Process Pool Test',
      command: 'bun test test/process/BunProcessPool.test.ts'
    },
    {
      name: 'Worker Manager Test',
      command: 'bun test test/process/WorkerManager.test.ts'
    },
    {
      name: 'All Process Tests',
      command: 'bun test test/process/'
    },
    {
      name: 'Small Stryker Run',
      command: 'npx stryker run --mutate "src/utils/SourceMapHandler.ts"'
    },
    {
      name: 'Process Pool Stryker',
      command: 'npx stryker run --mutate "src/process/BunProcessPool.ts"'
    }
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    const result = await runWithMonitoring(scenario.command, scenario.name);
    results.push({ ...scenario, ...result });
    
    // Clean up between scenarios
    console.log(`${colors.yellow}Cleaning up...${colors.reset}`);
    execSync('pkill -f "bun" || true', { stdio: 'ignore' });
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

// Main diagnostic function
async function main() {
  console.log(`${colors.magenta}${colors.bold}=== Stryker Process Explosion Diagnostic ===${colors.reset}`);
  console.log(`${colors.cyan}This will help identify which files cause process explosion${colors.reset}`);
  
  // Ensure we start clean
  console.log(`\n${colors.yellow}Initial cleanup...${colors.reset}`);
  execSync('pkill -f "bun" || true', { stdio: 'ignore' });
  execSync('pkill -f "node.*stryker" || true', { stdio: 'ignore' });
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Create results directory
  const resultsDir = 'diagnostic-results';
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const results = {
    timestamp: new Date().toISOString(),
    scenarios: []
  };
  
  // Option 1: Quick scenarios
  console.log(`\n${colors.bold}Running quick diagnostic scenarios...${colors.reset}`);
  const scenarioResults = await testScenarios();
  results.scenarios = scenarioResults;
  
  // Analyze results
  console.log(`\n${colors.magenta}${colors.bold}=== Analysis ===${colors.reset}`);
  
  const problematic = scenarioResults.filter(r => 
    !r.success || 
    (r.processReport && r.processReport.max > 20) ||
    (r.processReport && r.processReport.spikes > 0)
  );
  
  if (problematic.length > 0) {
    console.log(`\n${colors.red}Found ${problematic.length} problematic scenarios:${colors.reset}`);
    
    problematic.forEach(scenario => {
      console.log(`\n${colors.yellow}${scenario.name}:${colors.reset}`);
      if (!scenario.success) {
        console.log(`  ${colors.red}Failed: ${scenario.error}${colors.reset}`);
      }
      if (scenario.processReport) {
        console.log(`  Max processes: ${scenario.processReport.max}`);
        console.log(`  Average processes: ${scenario.processReport.average}`);
        console.log(`  Process spikes: ${scenario.processReport.spikes}`);
      }
    });
  } else {
    console.log(`${colors.green}All scenarios completed without major issues${colors.reset}`);
  }
  
  // Save results
  const resultsPath = path.join(resultsDir, 'diagnostic-summary.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n${colors.cyan}Results saved to: ${resultsPath}${colors.reset}`);
  
  // Recommendations
  console.log(`\n${colors.magenta}${colors.bold}=== Recommendations ===${colors.reset}`);
  
  if (problematic.some(p => p.name.includes('Process Pool'))) {
    console.log(`${colors.yellow}• Process Pool tests show issues - check worker management${colors.reset}`);
  }
  
  if (problematic.some(p => p.name.includes('Stryker'))) {
    console.log(`${colors.yellow}• Stryker runs show issues - check test runner lifecycle${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}For detailed file-by-file analysis, run:${colors.reset}`);
  console.log(`  ${colors.blue}node scripts/test-individual-files.js${colors.reset} - Test mutation on each source file`);
  console.log(`  ${colors.blue}node scripts/test-individual-tests.js${colors.reset} - Run each test file individually`);
  
  // Final cleanup
  console.log(`\n${colors.yellow}Final cleanup...${colors.reset}`);
  execSync('pkill -f "bun" || true', { stdio: 'ignore' });
  execSync('pkill -f "node.*stryker" || true', { stdio: 'ignore' });
}

// Run the diagnostic
main().catch(error => {
  console.error(`${colors.red}${colors.bold}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});