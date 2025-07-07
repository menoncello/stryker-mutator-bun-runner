import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import jsdoc from 'eslint-plugin-jsdoc';
import promise from 'eslint-plugin-promise';
import functional from 'eslint-plugin-functional';
import regexp from 'eslint-plugin-regexp';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      security: security,
      import: importPlugin,
      sonarjs: sonarjs,
      unicorn: unicorn,
      jsdoc: jsdoc,
      promise: promise,
      functional: functional,
      regexp: regexp
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/prefer-readonly': 'error',
      '@typescript-eslint/no-unsafe-type-assertion': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'off', // Too strict for this project
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true
        }
      ],
      '@typescript-eslint/no-deprecated': 'error',
      'prefer-const': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',

      // Core ESLint rules for code quality
      'no-throw-literal': 'error',
      'no-useless-escape': 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],

      // Size and complexity limits
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-len': ['error', { code: 120, tabWidth: 2, ignoreUrls: true, ignoreStrings: true }],
      complexity: ['error', 10],
      'max-depth': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-params': ['error', 4],

      // SonarJS rules for code quality
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-unused-collection': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',

      // Unicorn rules for better code
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-destructuring': 'error',
      'unicorn/no-array-push-push': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-nested-ternary': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/throw-new-error': 'error',
      // Disable some unicorn rules that conflict with project style
      'unicorn/filename-case': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-module': 'off',

      // Regexp rules for better regex quality
      'regexp/no-dupe-characters-character-class': 'error',
      'regexp/no-empty-character-class': 'error',
      'regexp/no-useless-character-class': 'error',
      'regexp/no-useless-escape': 'error',
      'regexp/no-contradiction-with-assertion': 'error',

      // Promise rules
      'promise/always-return': 'error',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-nesting': 'error',
      'promise/no-promise-in-callback': 'error',
      'promise/no-callback-in-promise': 'error',
      'promise/avoid-new': 'off',

      // Functional programming rules (for immutability)
      'functional/prefer-readonly-type': 'off', // Temporarily disabled due to config issues
      'functional/no-let': 'off', // Temporarily disabled due to config issues
      'functional/immutable-data': 'off', // Temporarily disabled due to config issues
      // Disable functional rules that are too strict
      'functional/no-conditional-statements': 'off',
      'functional/no-expression-statements': 'off',
      'functional/no-return-void': 'off',
      'functional/no-throw-statements': 'off',
      'functional/no-try-statements': 'off',
      'functional/no-loop-statements': 'off',
      'functional/functional-parameters': 'off',

      // JSDoc rules
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true
          }
        }
      ],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/check-alignment': 'error',
      'jsdoc/check-param-names': 'error',
      'jsdoc/check-tag-names': 'error',

      // Import rules (disabled problematic ones)
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/default': 'off',
      'import/namespace': 'off',
      'import/no-absolute-path': 'error',
      'import/no-dynamic-require': 'error',
      'import/no-self-import': 'off',
      'import/no-cycle': 'off',
      'import/no-useless-path-segments': 'off',
      'import/no-duplicates': 'error',

      // Security rules (adjusted for TypeScript)
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-unsafe-regex': 'off'
    }
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.test.json'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      sonarjs: sonarjs,
      regexp: regexp
    },
    rules: {
      // Basic TypeScript rules only for tests
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/prefer-readonly': 'error',
      'prefer-const': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',

      // Relaxed rules for tests
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-len': ['error', { code: 150, tabWidth: 2, ignoreUrls: true, ignoreStrings: true }],
      complexity: 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'jsdoc/require-jsdoc': 'off',
      'functional/prefer-readonly-type': 'off',
      'functional/no-let': 'off',
      'functional/immutable-data': 'off'
    }
  },
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        console: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        Buffer: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      'prefer-const': 'error',
      'no-undef': 'error'
    }
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'example/',
      '*.config.js',
      '*.config.mjs',
      'coverage/',
      '.stryker-tmp/',
      'reports/'
    ]
  }
];
