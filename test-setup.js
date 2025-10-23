#!/usr/bin/env node

/**
 * Simple test runner to verify failing tests (RED phase)
 * This will fail until the project is properly set up
 */

const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

const projectRoot = __dirname;

function expect(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  return { toBe: val => expect(condition === val, message) };
}

function describe(groupName, fn) {
  console.log(`\n📋 ${groupName}`);
  try {
    fn();
    console.log('✅ All tests passed in this group');
  } catch (error) {
    console.log(`❌ ${error.message}`);
    throw error;
  }
}

function test(testName, fn) {
  try {
    fn();
    console.log(`  ✓ ${testName}`);
  } catch (error) {
    console.log(`  ✗ ${testName}: ${error.message}`);
    throw error;
  }
}

console.log('🧪 Running Story 1.1 Project Setup Tests (RED Phase)');
console.log('🎯 These tests will FAIL until implementation is complete');

try {
  describe('Story 1.1: Project Setup and Build Configuration', () => {
    describe('TypeScript Configuration (AC1)', () => {
      test('should have tsconfig.json with strict mode enabled', () => {
        const tsconfigPath = join(projectRoot, 'tsconfig.json');
        expect(existsSync(tsconfigPath), 'tsconfig.json should exist').toBe(true);

        const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
        expect(
          config.compilerOptions?.strict === true,
          'TypeScript strict mode should be enabled'
        ).toBe(true);
      });
    });

    describe('Package Configuration (AC2)', () => {
      test('should have package.json with required dependencies', () => {
        const packageJsonPath = join(projectRoot, 'package.json');
        expect(existsSync(packageJsonPath), 'package.json should exist').toBe(true);

        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        expect(
          pkg.dependencies?.['@stryker-mutator/api'],
          '@stryker-mutator/api dependency should be present'
        ).toBeDefined();
        expect(
          pkg.dependencies?.['typed-inject'],
          'typed-inject dependency should be present'
        ).toBeDefined();
      });
    });

    describe('Project Structure (AC6)', () => {
      test('should have src directory', () => {
        const srcDir = join(projectRoot, 'src');
        expect(existsSync(srcDir), 'src/ directory should exist').toBe(true);
      });
    });
  });

  console.log('\n🎉 UNEXPECTED: All tests passed! Implementation might already be complete.');
} catch (error) {
  console.log('\n✅ EXPECTED: Tests are failing (RED phase)');
  console.log('🔧 Implementation needed to make tests pass (GREEN phase)');
  console.log(`\n📝 Failure reason: ${error.message}`);
}

console.log('\n📊 Test execution completed');
console.log('🚀 Next step: Implement the features to make tests pass');
