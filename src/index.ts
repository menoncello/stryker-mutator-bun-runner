import { PluginKind, declareClassPlugin } from '@stryker-mutator/api/dist/src/plugin';
import { BunTestRunner } from './BunTestRunner';

export const strykerPlugins = [
  declareClassPlugin(PluginKind.TestRunner, 'bun', BunTestRunner)
];

export { BunTestRunner } from './BunTestRunner';
export * from './BunTestRunnerOptions';