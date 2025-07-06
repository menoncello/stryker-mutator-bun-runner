// Simple test to check if coverage hook is working
console.log('=== Coverage Test ===');
console.log('globalThis.__stryker__:', globalThis.__stryker__);
console.log('globalThis.stryCov_9fa48:', typeof globalThis.stryCov_9fa48);

// Try to call the coverage function if it exists
if (typeof globalThis.stryCov_9fa48 === 'function') {
  console.log('Calling stryCov_9fa48(1, 2, 3)');
  globalThis.stryCov_9fa48(1, 2, 3);
}

// Check the stryker object after
console.log('After call - globalThis.__stryker__:', globalThis.__stryker__);