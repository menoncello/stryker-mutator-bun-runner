import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import importPlugin from 'eslint-plugin-import';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.js',
      '**/*.d.ts',
      '**/reports/**',
      '**/.stryker-tmp/**',
      '**/stryker-tmp/**',
    ],
  },
  // Main TypeScript configuration
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      sonarjs: sonarjs,
      unicorn: unicorn,
      import: importPlugin,
      jsdoc: jsdoc,
    },
    rules: {
      // TypeScript ESLint - Strictest Rules (without type-checking)
      ...tseslint.configs['recommended'].rules,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off', // Relaxed for efficiency
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-useless-constructor': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-as-const': 'error',
      '@typescript-eslint/no-array-constructor': 'error',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
      ],

      // SonarJS - Code Quality & Complexity (relaxed for efficiency)
      ...sonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity': ['warn', 30], // Increased threshold
      'sonarjs/no-duplicate-string': ['warn', { threshold: 5 }], // Increased threshold
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-duplicated-branches': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',

      // Unicorn - Best Practices
      'unicorn/better-regex': 'error',
      'unicorn/catch-error-name': 'error',
      'unicorn/consistent-function-scoping': 'error',
      'unicorn/custom-error-definition': 'error',
      'unicorn/error-message': 'error',
      'unicorn/escape-case': 'error',
      'unicorn/expiring-todo-comments': 'error',
      'unicorn/explicit-length-check': 'error',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-for-each': 'error',
      'unicorn/no-console-spaces': 'error',
      'unicorn/no-for-loop': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/no-invalid-remove-event-listener': 'error',
      'unicorn/no-negated-condition': 'error',
      'unicorn/no-nested-ternary': 'warn',
      'unicorn/no-new-array': 'error',
      'unicorn/no-new-buffer': 'error',
      'unicorn/no-unreadable-array-destructuring': 'error',
      'unicorn/no-unused-properties': 'error',
      'unicorn/no-useless-undefined': 'error',
      'unicorn/number-literal-case': 'error',
      'unicorn/prefer-add-event-listener': 'error',
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-default-parameters': 'error',
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-modern-math-apis': 'error',
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-number-properties': 'error',
      'unicorn/prefer-optional-catch-binding': 'error',
      'unicorn/prefer-string-starts-ends-with': 'error',
      'unicorn/prefer-ternary': 'error',
      'unicorn/prefer-type-error': 'error',
      'unicorn/throw-new-error': 'error',

      // Import - Module Management
      'import/no-duplicates': 'error',
      'import/no-unresolved': 'off', // TypeScript handles this
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/newline-after-import': 'error',
      'import/no-default-export': 'error',
      'import/no-mutable-exports': 'error',

      // JSDoc - Documentation Quality (relaxed for efficiency)
      'jsdoc/check-alignment': 'warn',
      'jsdoc/check-param-names': 'warn',
      'jsdoc/check-tag-names': 'off', // Allow custom tags like @nimata/adapters
      'jsdoc/check-types': 'warn',
      'jsdoc/require-description': 'off', // Reduced priority
      'jsdoc/require-param': 'warn',
      'jsdoc/require-param-description': 'off', // Reduced priority
      'jsdoc/require-param-type': 'off', // TypeScript provides types
      'jsdoc/require-returns': 'warn',
      'jsdoc/require-returns-description': 'off', // Reduced priority
      'jsdoc/require-returns-type': 'off', // TypeScript provides types
      'jsdoc/require-jsdoc': 'off', // Reduced priority for efficiency

      // Core ESLint - Code Quality (relaxed for efficiency)
      complexity: ['warn', 15], // Increased threshold
      'max-depth': ['warn', 4], // Increased threshold
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }], // Increased threshold
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }], // Increased threshold
      'max-nested-callbacks': ['warn', 4], // Increased threshold
      'max-params': ['warn', 6], // Increased threshold
      'max-statements': ['warn', 25], // Increased threshold
      'no-console': 'off', // CLI needs console
      'no-magic-numbers': [
        'warn', // Downgraded to warn
        {
          ignore: [0, 1, -1, 2, 10, 100, 1000],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
        },
      ],
      'no-duplicate-imports': 'error',
      'no-else-return': 'warn',
      'no-lonely-if': 'warn',
      'no-negated-condition': 'warn',
      'no-nested-ternary': 'warn', // Downgraded to warn
      'no-return-await': 'error',
      'no-unneeded-ternary': 'error',
      'no-useless-return': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      yoda: 'error',
    },
  },
  // Test files - Relaxed rules
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/require-returns': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-nested-callbacks': 'off',
      'max-statements': 'off',
      'no-magic-numbers': 'off',
      'import/no-default-export': 'off',
      'unicorn/no-array-for-each': 'off',
    },
  },
];
