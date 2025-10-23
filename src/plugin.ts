/**
 * Stryker Plugin Registration
 *
 * Registers the Bun Test Runner plugin with Stryker's plugin system.
 * Provides the necessary plugin metadata and factory function.
 *
 * @author Stryker Mutator Bun Runner Plugin Team
 * @version 1.0.0
 */

import { declareValuePlugin, PluginKind } from '@stryker-mutator/api/plugin';
import type { BunTestRunnerOptions } from './config/index.js';
import { BunTestRunner } from './index.js';

/**
 * Plugin factory for Bun Test Runner
 *
 * Creates and configures the Bun Test Runner plugin instance.
 *
 * @param options - Configuration options for the test runner
 * @returns Configured BunTestRunner instance
 */
export function createBunTestRunner(options: BunTestRunnerOptions = {}): BunTestRunner {
  return new BunTestRunner(options);
}

/**
 * Register the Bun Test Runner plugin with Stryker
 *
 * This plugin registers under the 'bun' identifier and provides
 * mutation testing capabilities using Bun as the test execution engine.
 *
 * Note: This is a simplified plugin registration. Full dependency injection
 * setup will be implemented in future stories.
 */
const strykerBunRunnerPlugin = declareValuePlugin(
  PluginKind.TestRunner,
  'bun',
  new BunTestRunner({})
);

/**
 * Plugin metadata for package.json exports
 */
export const PLUGIN_INFO = {
  name: '@stryker-mutator/bun-runner',
  version: '1.0.0',
  description: 'Stryker test runner plugin for Bun',
  author: 'Stryker Mutator Bun Runner Plugin Team',
  homepage: 'https://stryker-mutator.io',
  license: 'Apache-2.0',
  keywords: ['stryker', 'mutation-testing', 'bun', 'test-runner'],
  repository: {
    type: 'git',
    url: 'https://github.com/stryker-mutator/stryker-js.git',
    directory: 'packages/bun-runner',
  },
  bugs: {
    url: 'https://github.com/stryker-mutator/stryker-js/issues',
  },
  engines: {
    node: '>=18.0.0',
    bun: '>=1.3.0',
  },
  peerDependencies: {
    '@stryker-mutator/core': '^8.0.0',
  },
  dependencies: {
    'typed-inject': '^4.0.0',
    '@stryker-mutator/api': '^8.0.0',
  },
  devDependencies: {
    typescript: '^5.3.0',
    '@types/node': '^18.0.0',
  },
} as const;

// Export plugin
export { strykerBunRunnerPlugin };
