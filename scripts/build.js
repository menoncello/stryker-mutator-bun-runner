#!/usr/bin/env node

/**
 * Build Script for Dual ESM/CJS Output
 *
 * This script handles the complete build process including:
 * - TypeScript compilation for declarations
 * - Dual ESM/CJS output generation
 * - Package.json exports configuration
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

import { execSync } from 'node:child_process';
import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * Execute a command and return the result
 */
function execCommand(command, description) {
  console.log(`🔨 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed`);
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    process.exit(1);
  }
}

/**
 * Clean build directory
 */
function cleanBuild() {
  const distPath = join(process.cwd(), 'dist');
  if (existsSync(distPath)) {
    rmSync(distPath, { recursive: true, force: true });
  }
  mkdirSync(distPath, { recursive: true });
  console.log('🧹 Cleaned build directory');
}

/**
 * Generate TypeScript declarations
 */
function generateDeclarations() {
  console.log('📝 Generating TypeScript declarations...');
  execCommand('npx tsc --emitDeclarationOnly', 'TypeScript declarations');
}

/**
 * Build CommonJS output
 */
function buildCJS() {
  console.log('📦 Building CommonJS output...');

  // Since @stryker-mutator/api is ESM-only, we'll use a bundler approach
  // For now, generate CommonJS using bun build with proper transpilation
  try {
    execCommand(
      'bun build src/index.ts --outdir dist --target node --format cjs --outfile index.js',
      'CommonJS bundling'
    );
  } catch (error) {
    console.warn('⚠️ CommonJS build failed (ESM-only dependencies). ESM build available.');
    // Create a minimal CommonJS wrapper for ESM compatibility
    const cjsWrapper = `
// CommonJS compatibility wrapper
try {
  module.exports = require('./index.mjs');
} catch (error) {
  console.warn('CommonJS fallback failed. Please use ESM (import) syntax.');
}
`;
    require('fs').writeFileSync(join(process.cwd(), 'dist/index.js'), cjsWrapper.trim());
  }
}

/**
 * Build ESM output
 */
function buildESM() {
  console.log('📦 Building ESM output...');

  // Use TypeScript to build ESM
  const tsconfigPath = join(process.cwd(), 'tsconfig.esm.json');

  if (!existsSync(tsconfigPath)) {
    // Create temporary ESM tsconfig
    const baseTsConfig = JSON.parse(readFileSync(join(process.cwd(), 'tsconfig.json'), 'utf8'));
    const esmTsConfig = {
      ...baseTsConfig,
      compilerOptions: {
        ...baseTsConfig.compilerOptions,
        module: 'ESNext',
        moduleResolution: 'bundler',
        outDir: './dist/esm',
      },
    };
    writeFileSync(tsconfigPath, JSON.stringify(esmTsConfig, null, 2));
  }

  execCommand(`npx tsc --project ${tsconfigPath}`, 'ESM compilation');

  // Rename .js files to .mjs and copy to dist root
  execCommand(
    'find dist/esm -name "*.js" -exec sh -c \'mv "$1" "${1%.js}.mjs"\' _ {} \\;',
    'Rename to .mjs'
  );
  execCommand('cp dist/esm/*.mjs dist/ || true', 'Copy ESM files to root');
}

/**
 * Create package.json for different module systems
 */
function createPackageJsons() {
  console.log('📋 Creating module-specific package.json files...');

  // Main package.json already has the exports configuration
  // No additional package.json files needed for this simple structure
}

/**
 * Validate build output
 */
function validateBuild() {
  console.log('🔍 Validating build output...');

  const requiredFiles = ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts'];

  const missingFiles = requiredFiles.filter(file => !existsSync(join(process.cwd(), file)));

  if (missingFiles.length > 0) {
    console.error('❌ Build validation failed. Missing files:', missingFiles);
    process.exit(1);
  }

  console.log('✅ Build validation passed');
}

/**
 * Main build process
 */
function main() {
  console.log('🚀 Starting build process...\n');

  try {
    cleanBuild();
    generateDeclarations();
    buildCJS();
    buildESM();
    createPackageJsons();
    validateBuild();

    console.log('\n🎉 Build completed successfully!');
    console.log('📦 Build outputs:');
    console.log('  - CommonJS: dist/index.js');
    console.log('  - ESM: dist/index.mjs');
    console.log('  - Types: dist/index.d.ts');
  } catch (error) {
    console.error('\n💥 Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
main();
