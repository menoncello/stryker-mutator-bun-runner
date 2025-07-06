import { PluginKind, declareClassPlugin } from '@stryker-mutator/api/plugin';
import { BunTestRunner } from './BunTestRunner.js';

export const strykerPlugins = [
  declareClassPlugin(PluginKind.TestRunner, 'bun', BunTestRunner)
];

export const strykerValidationSchema = {
  properties: {
    bun: {
      title: 'BunTestRunnerOptions',
      description: 'Configuration options for the Bun test runner plugin',
      type: 'object',
      properties: {
        testFiles: {
          description: 'Pattern(s) of test files to run',
          type: 'array',
          items: {
            type: 'string'
          }
        },
        timeout: {
          description: 'Timeout per test in milliseconds',
          type: 'number',
          minimum: 0
        },
        bail: {
          description: 'Stop running tests after the first failure',
          type: 'boolean'
        },
        nodeArgs: {
          description: 'Additional arguments to pass to the bun process',
          type: 'array',
          items: {
            type: 'string'
          }
        },
        env: {
          description: 'Environment variables to set when running tests',
          type: 'object',
          additionalProperties: {
            type: 'string'
          }
        },
        command: {
          description: 'Custom command to run instead of "bun test". Useful for projects with custom test scripts',
          type: 'string'
        },
        coverageAnalysis: {
          description: 'Coverage analysis setting',
          type: 'string',
          enum: ['off', 'all', 'perTest']
        },
        processPool: {
          description: 'Enable process pooling for better performance',
          type: 'boolean'
        },
        maxWorkers: {
          description: 'Maximum number of worker processes in the pool',
          type: 'number',
          minimum: 1
        },
        watchMode: {
          description: 'Enable watch mode for continuous test execution',
          type: 'boolean'
        },
        updateSnapshots: {
          description: 'Update snapshots during test runs',
          type: 'boolean'
        }
      },
      additionalProperties: false
    }
  }
};

export { BunTestRunner } from './BunTestRunner.js';
export * from './BunTestRunnerOptions.js';