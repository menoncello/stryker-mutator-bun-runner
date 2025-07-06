import { PluginKind, declareClassPlugin } from '@stryker-mutator/api/plugin';
import { BunTestRunner } from './BunTestRunner.js';

export const strykerPlugins = [
  declareClassPlugin(PluginKind.TestRunner, 'bun', BunTestRunner)
];

export { BunTestRunner } from './BunTestRunner.js';
export * from './BunTestRunnerOptions.js';