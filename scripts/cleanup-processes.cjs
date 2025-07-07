#!/usr/bin/env node

/**
 * Cleanup script to ensure all Bun processes are terminated
 */
const { execSync } = require('child_process');

function cleanupProcesses() {
  console.log('Cleaning up Bun processes...');
  try {
    // Kill all bun test processes
    execSync('pkill -f "bun test" 2>/dev/null || true', { stdio: 'inherit' });
    
    // Kill any remaining bun processes
    execSync('pkill -f "bun" 2>/dev/null || true', { stdio: 'inherit' });
    
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error.message);
  }
}

// Run cleanup
cleanupProcesses();

// Also setup cleanup on exit
process.on('exit', cleanupProcesses);
process.on('SIGINT', () => {
  cleanupProcesses();
  process.exit(0);
});
process.on('SIGTERM', () => {
  cleanupProcesses();
  process.exit(0);
});