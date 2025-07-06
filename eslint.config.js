import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import security from 'eslint-plugin-security';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'security': security,
      'import': importPlugin,
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',

      // Size and complexity limits
      'max-lines': ['error', { max: 200, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-len': ['error', { code: 120, tabWidth: 2, ignoreUrls: true, ignoreStrings: true }],
      'complexity': ['error', 10],

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
      'security/detect-unsafe-regex': 'off',
    },
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      // Basic TypeScript rules only for tests
      '@typescript-eslint/no-unused-vars': ['error', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_' 
      }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prefer-const': 'error',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      
      // Relaxed rules for tests
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-len': ['error', { code: 150, tabWidth: 2, ignoreUrls: true, ignoreStrings: true }],
      'complexity': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'node_modules/',
      'example/',
      '*.config.js',
      '*.config.mjs',
      'coverage/',
    ],
  },
];