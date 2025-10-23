/**
 * Stryker Bun Runner Plugin
 *
 * Main entry point for the Stryker Bun Test Runner plugin.
 * Provides mutation testing support for projects using Bun as their test runner.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

export { BunTestRunner } from './bun-test-runner.js';
export { strykerBunRunnerPlugin as Plugin } from './plugin.js';

// Plugin registration for Stryker
export { declareClassPlugin } from '@stryker-mutator/api/plugin';

// Re-export core types for external use
export type { BunTestRunnerOptions } from './config/bun-test-runner-config.types.js';
