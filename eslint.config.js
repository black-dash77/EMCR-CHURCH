const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  // Fichiers à ignorer
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'build/**',
      'android/**',
      'ios/**',
      '*.html',
      'babel.config.js',
      'metro.config.js',
      'eslint.config.js',
    ],
  },

  // Configuration Expo de base
  ...compat.extends('expo'),

  // Configuration Prettier pour désactiver les règles conflictuelles
  ...compat.extends('prettier'),

  // Configuration personnalisée
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      // Règles désactivées pour éviter les faux positifs
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Imports
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'warn',

      // Bonnes pratiques
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'warn',
      eqeqeq: ['error', 'always', { null: 'ignore' }],

      // Désactiver les règles trop strictes pour React Native
      'react-native/no-inline-styles': 'off',
    },
  },
];
